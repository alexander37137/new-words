import { FeedAnalyzer } from '@new-words/feed-analyzer';

export default defineEventHandler(async () => {
  const analyzer = new FeedAnalyzer();

  try {
    const stats = await analyzer.analyzeFullFeed();

    return {
      success: true,
      stats,
      message: 'Feed analysis completed'
    };
  } catch (error) {
    console.error('Error analyzing feed:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to analyze feed'
    });
  } finally {
    await analyzer.disconnect();
  }
});
