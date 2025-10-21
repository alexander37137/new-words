import { MeduzaRepository } from '@new-words/meduza-api-client';
import { WordCountRepository } from '@new-words/db-client';

export class ArticleProcessorService {
  private readonly meduzaRepo: MeduzaRepository;
  private readonly wordRepo: WordCountRepository;

  constructor() {
    // Create repositories internally
    this.meduzaRepo = new MeduzaRepository();
    this.wordRepo = new WordCountRepository();
  }

  /**
   * Process articles from Meduza RSS feed and extract words
   */
  async processTodayArticles(): Promise<{
    wordsProcessed: number;
  }> {
    console.log('Fetching articles from Meduza RSS feed...');

    try {
      // Process words from RSS feed
      const wordsProcessed = await this.processWordsFromRss();

      console.log(`✅ Processed ${wordsProcessed} words from articles`);

      return { wordsProcessed };
    } catch (error) {
      console.error('❌ Error processing articles:', error);
      throw error;
    }
  }

  /**
   * Extract and process words from Meduza RSS feed
   */
  private async processWordsFromRss(): Promise<number> {
    const rssResponse = await fetch(this.meduzaRepo.baseUrl);
    const rssText = await rssResponse.text();

    // Extract titles and descriptions from RSS
    const titleMatches = rssText.match(/<title>(.*?)<\/title>/g) || [];
    const descriptionMatches = rssText.match(/<description>(.*?)<\/description>/g) || [];

    let totalWords = 0;

    // Process titles
    for (const titleMatch of titleMatches) {
      const titleText = titleMatch.replace(/<\/?title>/g, '');
      const wordsProcessed = await this.wordRepo.processText(titleText);
      totalWords += wordsProcessed;
    }

    // Process descriptions
    for (const descMatch of descriptionMatches) {
      const descText = descMatch.replace(/<\/?description>/g, '');
      const wordsProcessed = await this.wordRepo.processText(descText);
      totalWords += wordsProcessed;
    }

    return totalWords;
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    await this.wordRepo.disconnect();
  }

  /**
   * Get word statistics
   */
  async getWordStats(): Promise<{
    totalUniqueWords: number;
    topWords: Array<{ word: string; count: number }>;
  }> {
    const [totalUniqueWords, topWords] = await Promise.all([
      this.wordRepo.getTotalUniqueWords(),
      this.wordRepo.getTopWords(10)
    ]);

    return { totalUniqueWords, topWords };
  }
}
