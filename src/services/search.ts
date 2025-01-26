import { PrismaClient, Prisma, Category } from '@prisma/client';
import { redisService } from './redis';
import Fuse from 'fuse.js';
import { ElasticsearchService } from './elasticsearch';

interface SearchFilters {
  category?: Category;
  roomId?: string;
  // tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  quantity?: {
    min: number;
    max: number;
  };
}

interface PaginationParams {
  page: number;
  limit: number;
}

interface SearchParams {
  query: string;
  filters: SearchFilters;
  pagination: PaginationParams;
  includeMetadata?: boolean;
}

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
    const { query, filters } = params;
    
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

    // Perform fuzzy search and return just the items with scores
    return fuse.search(query).map(result => ({
      ...result.item,
      score: result.score
    }));
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
            // status: true
          }
        }
      }
    });
  }

  private buildDatabaseFilters(filters: SearchFilters): Prisma.ObjectWhereInput {
    const where: Prisma.ObjectWhereInput = {};

    if (filters.category) where.category = filters.category;
    if (filters.roomId) where.roomId = filters.roomId;
    // if (filters.status) where.status = filters.status;
    // if (filters.tags?.length) {
    //   where.tags = {
    //     hasSome: filters.tags  // Changed from hasEvery to hasSome based on Prisma's array operators
    //   };
    // }
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

  private buildElasticsearchFilters(filters: SearchFilters) {
    const must: any[] = [];

    if (filters.category) must.push({ term: { category: filters.category } });
    if (filters.roomId) must.push({ term: { roomId: filters.roomId } });
    // if (filters.status) must.push({ term: { status: filters.status } });
    if (filters.dateRange) {
      must.push({
        range: {
          updatedAt: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          }
        }
      });
    }

    return must;
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

  private processElasticsearchResults(results: any) {
    return results.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
      score: hit._score
    }));
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

  private async getRoomSuggestions(query: string) {
    return this.prisma.room.findMany({
      where: {
        name: { startsWith: query, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true
      },
      take: 10
    });
  }

  private async getTagSuggestions(query: string) {
    // Since tags are not in schema, return empty array for now
    return [];
    
    // Commented out original implementation
    // const objects = await this.prisma.object.findMany({
    //   where: {
    //     tags: { has: query }
    //   },
    //   select: {
    //     tags: true
    //   },
    //   take: 10
    // });
    // return [...new Set(objects.flatMap(obj => obj.tags))];
  }

  private mergeSearchResults(elasticResults: any[], fuzzyResults: any[]) {
    const merged = [...elasticResults];
    fuzzyResults.forEach(result => {
      if (!merged.find(m => m.id === result.id)) {
        merged.push(result);
      }
    });
    return merged;
  }

  private applyFiltersAndPagination(results: any[], params: SearchParams) {
    const { pagination } = params;
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    
    return {
      data: results.slice(start, end),
      pagination: {
        total: results.length,
        page: pagination.page,
        pageSize: pagination.limit,
        totalPages: Math.ceil(results.length / pagination.limit)
      }
    };
  }

  // Additional helper methods...
}

export const searchService = new SearchService(); 