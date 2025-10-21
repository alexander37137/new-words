import { ArticleProcessorService } from './services/ArticleProcessorService';

async function runWordCounter(): Promise<{
  totalUniqueWords: number;
  topWords: Array<{ word: string; count: number }>;
}> {
  // Initialize service (it creates its own repositories internally)
  const articleProcessor = new ArticleProcessorService();

  try {
    // Process words from articles using the service
    const { wordsProcessed } = await articleProcessor.processTodayArticles();

    // Get word statistics using the service
    const stats = await articleProcessor.getWordStats();

    return stats;
  } finally {
    await articleProcessor.disconnect();
  }
}

async function main() {
  try {
    console.log('📝 Starting Meduza word counter...');

    const { totalUniqueWords, topWords } = await runWordCounter();

    console.log(`📊 Total unique words: ${totalUniqueWords}`);
    console.log('🔝 Top 10 words:');
    topWords.forEach(({ word, count }, index) => {
      console.log(`  ${index + 1}. "${word}": ${count}`);
    });

    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error in word counter:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});
