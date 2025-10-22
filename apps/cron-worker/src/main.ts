import { FeedAnalyzer } from '@new-words/feed-analyzer';

async function analyzeRssFeed(): Promise<void> {
  const analyzer = new FeedAnalyzer();

  try {
    console.log('📝 Analyzing entire Meduza RSS feed...\n');
    
    const stats = await analyzer.analyzeFullFeed();
    
    console.log('\n📊 RSS Feed Analysis Results:');
    console.log('═'.repeat(60));
    
    for (const [date, data] of Object.entries(stats).sort().reverse()) {
      console.log(`\n📅 ${date}`);
      console.log(`   Words processed: ${data.wordsProcessed}`);
      console.log(`   Articles found: ${data.articleCount}`);
    }
    
    console.log('\n' + '═'.repeat(60));
    const totalWords = Object.values(stats).reduce((sum: number, d: { wordsProcessed: number; articleCount: number }) => sum + d.wordsProcessed, 0);
    const totalArticles = Object.values(stats).reduce((sum: number, d: { wordsProcessed: number; articleCount: number }) => sum + d.articleCount, 0);
    console.log(`\n📊 Total: ${totalWords} words from ${totalArticles} articles`);
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error analyzing feed:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await analyzer.disconnect();
  }
}

analyzeRssFeed().catch(error => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});
