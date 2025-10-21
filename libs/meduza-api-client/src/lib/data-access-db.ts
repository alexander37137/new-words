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

const DEFAULT_BASE_URL = 'https://meduza.io/api/w5/search';
const DEFAULT_USER_AGENT =
  process.env.MEDUZA_USER_AGENT ??
  'Mozilla/5.0 (compatible; new-words-cron-worker/1.0; +https://github.com/alexander37137/new-words)';

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
    const locale = options.locale ?? (process.env.MEDUZA_LOCALE === 'en' ? 'en' : 'ru');
    const chrono = options.chrono ?? process.env.MEDUZA_CHRONO ?? 'news';
    const perPageEnvRaw = process.env.MEDUZA_PER_PAGE;
    const perPageEnv =
      perPageEnvRaw !== undefined ? Number.parseInt(perPageEnvRaw, 10) : undefined;

    const resolvedPerPage =
      options.perPage ??
      (perPageEnv !== undefined && Number.isFinite(perPageEnv) ? perPageEnv : undefined) ??
      100;

    const perPage = Math.max(1, resolvedPerPage);

    const startOfToday = this.getStartOfToday();
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    let page = 0;
    let totalToday = 0;

    // Loop through paginated results until we exhaust today's posts.
    while (true) {
      const response = await this.fetchSearchPage({ page, perPage, locale, chrono });
      const result = response.result;

      if (!result) {
        break;
      }

      const collection = result.collection ?? [];
      const documents = result.documents ?? {};

      if (collection.length === 0) {
        break;
      }

      let shouldStop = false;

      for (const slug of collection) {
        const doc = documents[slug];

        if (!doc) {
          continue;
        }

        const publishedAt = this.toDate(doc.published_at);

        if (!publishedAt) {
          continue;
        }

        if (publishedAt >= startOfTomorrow) {
          continue;
        }

        if (publishedAt >= startOfToday) {
          totalToday += 1;
        } else {
          shouldStop = true;
          break;
        }
      }

      if (shouldStop) {
        break;
      }

      const nextPage = result.next_page;

      if (nextPage === null || nextPage === undefined) {
        page += 1;
      } else if (nextPage <= page) {
        page += 1;
      } else {
        page = nextPage;
      }
    }

    return totalToday;
  }

  private async fetchSearchPage(params: {
    page: number;
    perPage: number;
    locale: string;
    chrono: string;
  }): Promise<MeduzaSearchResponse> {
    const url = new URL(this.baseUrl);
    url.search = new URLSearchParams({
      chrono: params.chrono,
      page: String(params.page),
      per_page: String(params.perPage),
      locale: params.locale,
    }).toString();

    const response = await this.fetchFn(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Meduza API request failed with status ${response.status}`);
    }

    return (await response.json()) as MeduzaSearchResponse;
  }

  private getStartOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private toDate(value: number | string | undefined): Date | null {
    if (value === undefined) {
      return null;
    }

    const numericValue = typeof value === 'string' ? Number.parseInt(value, 10) : value;

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    return new Date(numericValue * 1000);
  }
}
