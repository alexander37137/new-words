type MeduzaDocument = {
  published_at?: number | string;
};

type MeduzaSearchResult = {
  total?: number;
  next_page?: number | null;
  documents?: Record<string, MeduzaDocument | undefined>;
  collection?: string[];
};

type MeduzaSearchResponse = {
  result?: MeduzaSearchResult;
};

export interface CountTodayArticlesOptions {
  locale?: 'ru' | 'en';
  chrono?: string;
  perPage?: number;
}

export interface MeduzaRepositoryOptions {
  baseUrl?: string;
  userAgent?: string;
  fetchImplementation?: typeof fetch;
}

const DEFAULT_BASE_URL = 'https://meduza.io/rss/all';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

export class MeduzaRepository {
  private readonly baseUrl: string;
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

  async countTodayArticles(options: CountTodayArticlesOptions = {}): Promise<number> {
    const response = await this.fetchFn(this.baseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`RSS Response (${response.status}):`, responseText.substring(0, 500));
      throw new Error(`Meduza RSS request failed with status ${response.status}`);
    }

    const rssText = await response.text();
    const startOfToday = this.getStartOfToday();
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Simple regex to find pubDate tags
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/g;
    let match;
    let totalToday = 0;

    while ((match = pubDateRegex.exec(rssText)) !== null) {
      const pubDateStr = match[1];
      const pubDate = new Date(pubDateStr);

      if (pubDate >= startOfToday && pubDate < startOfTomorrow) {
        totalToday += 1;
      }
    }

    return totalToday;
  }


  private getStartOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
