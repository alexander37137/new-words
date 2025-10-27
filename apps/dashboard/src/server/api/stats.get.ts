import { FeedAnalyzer } from '@new-words/feed-analyzer';

export default defineEventHandler(async () => {
  const analyzer = new FeedAnalyzer();

  try {
    const stats = await analyzer.getWordStats();

    return {
      totalWords: stats.totalUniqueWords,
      topWords: stats.topWords
    };
  } catch (error) {
    console.error('Error fetching word stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch word statistics'
    });
  } finally {
    await analyzer.disconnect();
  }
});
