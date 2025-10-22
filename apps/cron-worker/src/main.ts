import { ArticleProcessorService } from './services/ArticleProcessorService';

async function runWordCounter(date?: string): Promise<{
  wordsProcessed: number;
}> {
  // Initialize service (it creates its own repositories internally)
  const articleProcessor = new ArticleProcessorService();

  try {
    // Process words from articles using the service
    const { wordsProcessed } = await articleProcessor.processTodayArticles(date);

    return { wordsProcessed };
  } finally {
    await articleProcessor.disconnect();
  }
}

function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function main() {
  try {
    // Get date from command line arguments (e.g., node main.ts 2025-10-10)
    const dateArg = process.argv[2];
    
    if (dateArg) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateArg)) {
        console.error('❌ Invalid date format. Please use YYYY-MM-DD (e.g., 2025-10-10)');
        process.exit(1);
      }
      console.log(`📝 Starting Meduza word counter for date: ${dateArg}...`);
      const { wordsProcessed } = await runWordCounter(dateArg);

      console.log(`📊 Words processed: ${wordsProcessed}`);
    } else {
      // Run for yesterday by default
      const yesterday = getDateString(1);
      console.log(`📝 Starting Meduza word counter for yesterday: ${yesterday}...`);
      const { wordsProcessed } = await runWordCounter(yesterday);

      console.log(`📊 Words processed: ${wordsProcessed}`);
    }

    console.log('\n✅ Done!');
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
