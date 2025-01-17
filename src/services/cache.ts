import { redisService } from './redis';
import { createHash } from 'crypto';

interface CacheOptions {
  ttl?: number;
  namespace?: string;
  invalidateOn?: string[];
  useCompression?: boolean;
  useVersioning?: boolean;
}

export class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly VERSION_KEY = 'cache:version';
  private currentVersion: string | null = null;

  constructor() {
    this.initializeVersion();
  }

  private async initializeVersion() {
    this.currentVersion = await redisService.get(this.VERSION_KEY) || '1';
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.buildKey(key, options);
    const data = await redisService.get(fullKey);

    if (!data) return null;

    return options.useCompression 
      ? this.decompress(data)
      : JSON.parse(data);
  }

  async set(key: string, data: any, options: CacheOptions = {}) {
    const fullKey = this.buildKey(key, options);
    const value = options.useCompression 
      ? await this.compress(data)
      : JSON.stringify(data);

    await redisService.set(
      fullKey,
      value,
      options.ttl || this.DEFAULT_TTL
    );

    // Set invalidation triggers
    if (options.invalidateOn) {
      await this.setInvalidationTriggers(fullKey, options.invalidateOn);
    }
  }

  async invalidate(pattern: string) {
    await redisService.invalidatePattern(pattern);
    await this.incrementVersion();
  }

  async invalidateMultiple(patterns: string[]) {
    await Promise.all([
      ...patterns.map(pattern => redisService.invalidatePattern(pattern)),
      this.incrementVersion()
    ]);
  }

  private buildKey(key: string, options: CacheOptions): string {
    const parts = [
      options.namespace,
      key,
      options.useVersioning ? this.currentVersion : null
    ].filter(Boolean);

    return parts.join(':');
  }

  private async setInvalidationTriggers(key: string, triggers: string[]) {
    await Promise.all(
      triggers.map(trigger =>
        redisService.addToSet(`invalidation:${trigger}`, key)
      )
    );
  }

  private async incrementVersion() {
    this.currentVersion = (parseInt(this.currentVersion!) + 1).toString();
    await redisService.set(this.VERSION_KEY, this.currentVersion);
  }

  private async compress(data: any): Promise<string> {
    const { compress } = await import('zlib');
    const { promisify } = await import('util');
    const compressAsync = promisify(compress);
    
    const buffer = await compressAsync(Buffer.from(JSON.stringify(data)));
    return buffer.toString('base64');
  }

  private async decompress(data: string): Promise<any> {
    const { decompress } = await import('zlib');
    const { promisify } = await import('util');
    const decompressAsync = promisify(decompress);
    
    const buffer = await decompressAsync(Buffer.from(data, 'base64'));
    return JSON.parse(buffer.toString());
  }

  async mget(keys: string[], options: CacheOptions = {}) {
    const fullKeys = keys.map(key => this.buildKey(key, options));
    const values = await redisService.mget(fullKeys);
    
    return values.map(value => 
      value ? (options.useCompression ? this.decompress(value) : JSON.parse(value)) : null
    );
  }

  async mset(items: { key: string; value: any }[], options: CacheOptions = {}) {
    const entries = await Promise.all(
      items.map(async item => ({
        key: this.buildKey(item.key, options),
        value: options.useCompression 
          ? await this.compress(item.value)
          : JSON.stringify(item.value)
      }))
    );

    await redisService.mset(entries, options.ttl || this.DEFAULT_TTL);
  }
}

export const cacheService = new CacheService(); 