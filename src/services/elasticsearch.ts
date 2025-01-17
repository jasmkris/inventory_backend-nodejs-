import { Client } from '@elastic/elasticsearch';

export class ElasticsearchService {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || ''
      }
    });
  }

  async search(index: string, query: any, pagination: { page: number; limit: number }) {
    const { page, limit } = pagination;
    const from = (page - 1) * limit;

    const response = await this.client.search({
      index,
      body: {
        from,
        size: limit,
        query
      }
    });

    return {
      hits: response.hits.hits,
      total: response.hits.total,
      took: response.took
    };
  }

  async index(index: string, document: any) {
    return this.client.index({
      index,
      body: document
    });
  }

  async bulk(operations: any[]) {
    return this.client.bulk({
      refresh: true,
      body: operations
    });
  }

  async delete(index: string, id: string) {
    return this.client.delete({
      index,
      id
    });
  }
} 