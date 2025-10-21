import { MeduzaRepository } from './data-access-db';

const createFetchResponse = (body: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => body,
  } as Response);

describe('MeduzaRepository', () => {
  const originalDate = Date;

  beforeEach(() => {
    const fixedNow = new Date('2025-10-21T12:00:00.000Z');

    // @ts-expect-error override for deterministic testing
    global.Date = class extends Date {
      constructor(value?: number | string) {
        if (value !== undefined) {
          super(value);
        } else {
          super(fixedNow.getTime());
        }
      }

      static now() {
        return fixedNow.getTime();
      }
    };
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  it('counts only documents published today', async () => {
    const startOfToday = new Date('2025-10-21T00:00:00.000Z').getTime() / 1000;
    const yesterday = new Date('2025-10-20T23:59:59.000Z').getTime() / 1000;

    const fetchMock = jest.fn().mockImplementation(() =>
      createFetchResponse({
        result: {
          collection: ['today', 'yesterday'],
          documents: {
            today: { published_at: startOfToday },
            yesterday: { published_at: yesterday },
          },
        },
      })
    );

    const repository = new MeduzaRepository({ fetchImplementation: fetchMock, baseUrl: 'https://example.com' });

    const count = await repository.countTodayArticles({ chrono: 'news', locale: 'ru', perPage: 10 });

    expect(count).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://example.com'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });
});
