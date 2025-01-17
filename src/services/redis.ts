import Redis from 'ioredis';

class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        retryStrategy: (times) => {
          if (times > 3) {
            this.isConnected = false;
            return null; // stop retrying
          }
          return Math.min(times * 100, 3000);
        }
      });

      this.client.on('error', (err: any) => {
        console.error('Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Redis connected successfully');
      });
    } catch (error) {
      console.error('Redis initialization error:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isConnected || !this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      // Silently fail if Redis is not available
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      // Silently fail if Redis is not available
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      // Silently fail if Redis is not available
    }
  }

  async addToSortedSet(key: string, score: number, member: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.zadd(key, score, member);
    } catch (error) {
      // Silently fail if Redis is not available
    }
  }

  async sortedSetCount(key: string): Promise<number> {
    if (!this.isConnected || !this.client) return 0;
    try {
      return await this.client.zcard(key);
    } catch (error) {
      return 0;
    }
  }

  async removeOldestFromSortedSet(key: string, count: number): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.zremrangebyrank(key, 0, count - 1);
    } catch (error) {
      // Silently fail
    }
  }

  async getRecentFromSortedSet(key: string, limit: number): Promise<string[]> {
    if (!this.isConnected || !this.client) return [];
    try {
      return await this.client.zrevrange(key, 0, limit - 1);
    } catch (error) {
      return [];
    }
  }
}

export const redisService = new RedisService(); 