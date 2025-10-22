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
   * @param date Optional date in YYYY-MM-DD format. If not provided, processes today's articles.
   */
  async processTodayArticles(date?: string): Promise<{
    wordsProcessed: number;
  }> {
    const dateLabel = date ? `for ${date}` : 'for today';
    console.log(`Fetching articles from Meduza RSS feed ${dateLabel}...`);

    try {
      // Process words from RSS feed
      const wordsProcessed = await this.processWordsFromRss(date);

      console.log(`✅ Processed ${wordsProcessed} words from articles`);

      return { wordsProcessed };
    } catch (error) {
      console.error('❌ Error processing articles:', error);
      throw error;
    }
  }

  /**
   * Extract and process words from Meduza RSS feed
   * @param date Optional date in YYYY-MM-DD format for filtering articles
   */
  private async processWordsFromRss(date?: string): Promise<number> {
    const rssResponse = await fetch(this.meduzaRepo.baseUrl);
    const rssText = await rssResponse.text();

    // Extract titles and descriptions from RSS
    const titleMatches = rssText.match(/<title>(.*?)<\/title>/g) || [];
    const descriptionMatches = rssText.match(/<description>(.*?)<\/description>/g) || [];

    let totalWords = 0;

    // If date is provided, filter articles by publication date
    if (date) {
      // Extract pubDate elements to filter by date
      const pubDateMatches = rssText.match(/<pubDate>(.*?)<\/pubDate>/g) || [];
      const targetDate = new Date(date).getTime();
      const dateStart = targetDate;
      const dateEnd = targetDate + 24 * 60 * 60 * 1000; // Next day

      let foundArticles = false;

      for (let i = 0; i < pubDateMatches.length; i++) {
        const pubDateText = pubDateMatches[i].replace(/<\/?pubDate>/g, '');
        const pubDate = new Date(pubDateText).getTime();

        // Check if article is within the target date range
        if (pubDate >= dateStart && pubDate < dateEnd) {
          foundArticles = true;
          if (titleMatches[i]) {
            const titleText = titleMatches[i].replace(/<\/?title>/g, '');
            const wordsProcessed = await this.wordRepo.processText(titleText);
            totalWords += wordsProcessed;
          }
          if (descriptionMatches[i]) {
            const descText = descriptionMatches[i].replace(/<\/?description>/g, '');
            const wordsProcessed = await this.wordRepo.processText(descText);
            totalWords += wordsProcessed;
          }
        }
      }

      // If no articles found in RSS, try search API for historical data
      if (!foundArticles) {
        console.log(`No articles found in RSS for ${date}, trying search API...`);
        const searchArticles = await this.meduzaRepo.searchArticlesByDate(date);
        console.log(`Found ${searchArticles.length} articles via search API`);
        
        for (const article of searchArticles) {
          if (article.title) {
            const wordsProcessed = await this.wordRepo.processText(article.title);
            totalWords += wordsProcessed;
          }
          if (article.description) {
            const wordsProcessed = await this.wordRepo.processText(article.description);
            totalWords += wordsProcessed;
          }
        }
      }
    } else {
      // Process all articles if no date filter
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
