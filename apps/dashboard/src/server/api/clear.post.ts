import { FeedAnalyzer } from '@new-words/feed-analyzer';

export default defineEventHandler(async () => {
  const analyzer = new FeedAnalyzer();

  try {
    await analyzer.clearAll();
    return {
      success: true,
      message: 'Database cleared successfully'
    };
  } catch (error) {
    console.error('Error clearing database:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to clear database'
    });
  } finally {
    await analyzer.disconnect();
  }
});
