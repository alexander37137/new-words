export interface MeduzaRepositoryOptions {
  baseUrl?: string;
  userAgent?: string;
  fetchImplementation?: typeof fetch;
}

const DEFAULT_BASE_URL = 'https://meduza.io/rss/all';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

export class MeduzaRepository {
  public readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: MeduzaRepositoryOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.fetchFn = options.fetchImplementation ?? globalThis.fetch;

    if (typeof this.fetchFn !== 'function') {
      throw new Error('Fetch API is not available in the current environment.');
    }
  }

  /**
   * Search for articles on a specific date using Meduza RSS feed
   * @param dateStr Date in YYYY-MM-DD format
   * @returns Array of articles with title and description
   */
  async searchArticlesByDate(dateStr: string): Promise<Array<{ title: string; description: string; published_at: string }>> {
    try {
      const articles: Array<{ title: string; description: string; published_at: string }> = [];
      
      // Parse target date (YYYY-MM-DD) as UTC start of day
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).getTime();
      const dateEnd = dateStart + 24 * 60 * 60 * 1000;

      // Fetch from RSS feed
      const response = await this.fetchFn(this.baseUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });

      if (!response.ok) {
        console.warn(`Meduza RSS returned status ${response.status}`);
        return [];
      }

      const rssText = await response.text();

      // Extract all items from RSS
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(rssText)) !== null) {
        const itemContent = itemMatch[1];
        
        // Extract title (remove CDATA)
        const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
        const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
        
        // Extract description (remove CDATA)
        const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);
        const description = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '').trim() : '';
        
        // Extract pubDate
        const pubDateMatch = itemContent.match(/<pubDate>([^<]+)<\/pubDate>/);
        if (pubDateMatch) {
          const pubDateStr = pubDateMatch[1];
          const pubTime = new Date(pubDateStr).getTime();

          // Check if article is within the target date range (accounting for timezone)
          if (pubTime >= dateStart && pubTime < dateEnd) {
            articles.push({
              title,
              description,
              published_at: new Date(pubTime).toISOString(),
            });
          }
        }
      }

      return articles;
    } catch (error) {
      console.warn('Error searching articles by date:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }
}
