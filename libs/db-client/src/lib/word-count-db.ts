import Redis from 'ioredis';

export interface WordCountRepositoryOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export class WordCountRepository {
  private redis: Redis;

  constructor(options: WordCountRepositoryOptions = {}) {
    this.redis = new Redis({
      host: options.host ?? 'localhost',
      port: options.port ?? 6379,
      password: options.password,
      db: options.db ?? 0,
      lazyConnect: true, // Connect only when needed
    });

    // Handle connection events
    this.redis.on('connect', () => console.log('Connected to Redis'));
    this.redis.on('error', (err) => console.error('Redis connection error:', err));
  }

  async incrementWordCount(word: string, count: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(`word:${word}`, count);
    } catch (error) {
      console.error(`Failed to increment word count for "${word}":`, error);
      throw error;
    }
  }

  async getWordCount(word: string): Promise<number> {
    try {
      const count = await this.redis.get(`word:${word}`);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error(`Failed to get word count for "${word}":`, error);
      throw error;
    }
  }

  async getTopWords(limit: number = 100): Promise<Array<{ word: string; count: number }>> {
    try {
      // Get all word keys
      const keys = await this.redis.keys('word:*');

      if (keys.length === 0) {
        return [];
      }

      // Get all counts
      const counts = await this.redis.mget(keys);

      // Combine and sort
      const wordCounts = keys.map((key, index) => ({
        word: key.replace('word:', ''),
        count: parseInt(counts[index] || '0', 10),
      }));

      return wordCounts
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get top words:', error);
      throw error;
    }
  }

  async getTotalUniqueWords(): Promise<number> {
    try {
      const keys = await this.redis.keys('word:*');
      return keys.length;
    } catch (error) {
      console.error('Failed to get total unique words:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.redis.flushdb();
      console.log('Cleared all word counts');
    } catch (error) {
      console.error('Failed to clear word counts:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }
}
