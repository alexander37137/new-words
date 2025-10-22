import { MeduzaRepository } from '@new-words/meduza-api-client';
import { WordCountRepository } from '@new-words/db-client';

export interface FeedStats {
  wordsProcessed: number;
  articleCount: number;
}

export interface FullFeedStats {
  [date: string]: FeedStats;
}

export class FeedAnalyzer {
  private readonly meduzaRepo: MeduzaRepository;
  private readonly wordRepo: WordCountRepository;

  constructor() {
    this.meduzaRepo = new MeduzaRepository();
    this.wordRepo = new WordCountRepository();
  }

  /**
   * Analyze entire RSS feed and group articles by date
   */
  async analyzeFullFeed(): Promise<FullFeedStats> {
    const rssResponse = await fetch(this.meduzaRepo.baseUrl);
    const rssText = await rssResponse.text();

    const stats: FullFeedStats = {};

    // Extract all items from RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(rssText)) !== null) {
      const itemContent = itemMatch[1];
      
      // Extract pubDate
      const pubDateMatch = itemContent.match(/<pubDate>([^<]+)<\/pubDate>/);
      if (!pubDateMatch) continue;

      const pubDateStr = pubDateMatch[1].trim();
      const pubDate = new Date(pubDateStr);
      const dateKey = pubDate.toISOString().split('T')[0];

      // Extract title (remove CDATA)
      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      
      // Extract description (remove CDATA)
      const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);
      const description = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '').trim() : '';

      // Initialize date stats if not exists
      if (!stats[dateKey]) {
        stats[dateKey] = { wordsProcessed: 0, articleCount: 0 };
      }

      stats[dateKey].articleCount++;

      // Process title
      if (title) {
        const titleWords = await this.wordRepo.processText(title);
        stats[dateKey].wordsProcessed += titleWords;
      }

      // Process description
      if (description) {
        const descWords = await this.wordRepo.processText(description);
        stats[dateKey].wordsProcessed += descWords;
      }
    }

    return stats;
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    await this.wordRepo.disconnect();
  }
}
