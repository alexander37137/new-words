import { MeduzaRepository } from '@new-words/meduza-api-client';

console.log('Script started');

async function main() {
  try {
    console.log('Starting Meduza article counter...');
    const repository = new MeduzaRepository();
    console.log('Fetching today\'s article count...');
    const count = await repository.countTodayArticles();
    console.log(`✅ Found ${count} articles published today on Meduza`);
  } catch (error) {
    console.error('❌ Error in Meduza article counter:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run main directly
main().catch(error => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});
