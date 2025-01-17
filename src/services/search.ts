import { PrismaClient, Prisma } from '@prisma/client';
import { redisService } from './redis';
import Fuse from 'fuse.js';
import { ElasticsearchService } from './elasticsearch';

export class SearchService {
  private prisma: PrismaClient;
  private elastic: ElasticsearchService;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor() {
    this.prisma = new PrismaClient();
    this.elastic = new ElasticsearchService();
  }

  async search(params: {
    query: string;
    filters: SearchFilters;
    pagination: PaginationParams;
    includeMetadata?: boolean;
    searchStrategy?: 'fuzzy' | 'elastic' | 'hybrid';
  }) {
    const cacheKey = `search:${JSON.stringify(params)}`;
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;

    let results;
    switch (params.searchStrategy) {
      case 'elastic':
        results = await this.elasticSearch(params);
        break;
      case 'fuzzy':
        results = await this.fuzzySearch(params);
        break;
      case 'hybrid':
      default:
        results = await this.hybridSearch(params);
    }

    await redisService.set(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  private async hybridSearch(params: SearchParams) {
    // Combine results from both elastic and fuzzy search
    const [elasticResults, fuzzyResults] = await Promise.all([
      this.elasticSearch(params),
      this.fuzzySearch(params)
    ]);

    // Merge and deduplicate results
    const mergedResults = this.mergeSearchResults(elasticResults, fuzzyResults);
    return this.applyFiltersAndPagination(mergedResults, params);
  }

  private async fuzzySearch(params: SearchParams) {
    const { query, filters, pagination } = params;
    
    // Get base data from database
    const items = await this.getBaseData(filters);
    
    // Configure Fuse.js for fuzzy searching
    const fuse = new Fuse(items, {
      keys: ['name', 'description', 'tags', 'category'],
      threshold: 0.3,
      distance: 100,
      includeScore: true,
      useExtendedSearch: true,
      ignoreLocation: true,
      findAllMatches: true
    });

    // Perform fuzzy search
    const searchResults = fuse.search(query);
    return this.processSearchResults(searchResults, pagination);
  }

  private async elasticSearch(params: SearchParams) {
    const { query, filters, pagination } = params;
    
    // Prepare Elasticsearch query
    const esQuery = this.buildElasticsearchQuery(query, filters);
    
    // Execute search
    const results = await this.elastic.search('objects', esQuery, pagination);
    return this.processElasticsearchResults(results);
  }

  private async getBaseData(filters: SearchFilters) {
    return this.prisma.object.findMany({
      where: this.buildDatabaseFilters(filters),
      include: {
        room: true,
        history: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        variants: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
  }

  private buildDatabaseFilters(filters: SearchFilters): Prisma.ObjectWhereInput {
    const where: Prisma.ObjectWhereInput = {};

    if (filters.category) where.category = filters.category;
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.status) where.status = filters.status;
    if (filters.tags?.length) where.tags = { hasEvery: filters.tags };
    if (filters.dateRange) {
      where.updatedAt = {
        gte: new Date(filters.dateRange.start),
        lte: new Date(filters.dateRange.end)
      };
    }
    if (filters.quantity) {
      where.quantity = {
        gte: filters.quantity.min,
        lte: filters.quantity.max
      };
    }

    return where;
  }

  private buildElasticsearchQuery(query: string, filters: SearchFilters) {
    return {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['name^3', 'description^2', 'tags'],
              fuzziness: 'AUTO'
            }
          }
        ],
        filter: this.buildElasticsearchFilters(filters)
      }
    };
  }

  private async processSearchResults(results: any[], pagination: PaginationParams) {
    const { page, limit } = pagination;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: results.slice(start, end).map(r => r.item),
      pagination: {
        total: results.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(results.length / limit)
      },
      metadata: {
        scores: results.map(r => r.score)
      }
    };
  }

  async getSuggestions(query: string, type: 'object' | 'room' | 'tag' = 'object') {
    const cacheKey = `suggestions:${type}:${query}`;
    const cached = await redisService.get(cacheKey);
    if (cached) return cached;

    let suggestions;
    switch (type) {
      case 'object':
        suggestions = await this.getObjectSuggestions(query);
        break;
      case 'room':
        suggestions = await this.getRoomSuggestions(query);
        break;
      case 'tag':
        suggestions = await this.getTagSuggestions(query);
        break;
    }

    await redisService.set(cacheKey, suggestions, 60); // Cache for 1 minute
    return suggestions;
  }

  private async getObjectSuggestions(query: string) {
    return this.prisma.object.findMany({
      where: {
        name: { startsWith: query, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        category: true
      },
      take: 10
    });
  }

  // Additional helper methods...
}

export const searchService = new SearchService(); 