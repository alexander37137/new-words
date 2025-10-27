import { FeedAnalyzer } from '@new-words/feed-analyzer';

export class ArticleProcessorService {
  private readonly feedAnalyzer: FeedAnalyzer;

  constructor() {
    // Use FeedAnalyzer which handles repositories internally
    this.feedAnalyzer = new FeedAnalyzer();
  }

  /**
   * Process articles from Meduza RSS feed and extract words
   * @param date Optional date in YYYY-MM-DD format. If not provided, processes today's articles.
   */
  async processTodayArticles(date?: string): Promise<{
    wordsProcessed: number;
  }> {
    const dateLabel = date ? `for ${date}` : 'for today';
    console.log(`Fetching articles from Meduza RSS feed ${dateLabel}...`);

    try {
      const result = await this.feedAnalyzer.processArticlesByDate(date);

      console.log(`✅ Processed ${result.wordsProcessed} words from articles`);

      return result;
    } catch (error) {
      console.error('❌ Error processing articles:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    await this.feedAnalyzer.disconnect();
  }

  /**
   * Get word statistics
   */
  async getWordStats(): Promise<{
    totalUniqueWords: number;
    topWords: Array<{ word: string; count: number }>;
  }> {
    return this.feedAnalyzer.getWordStats();
  }
}
