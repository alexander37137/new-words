import { MeduzaRepository } from '@new-words/meduza-api-client';
import { WordCountRepository } from '@new-words/db-client';

function extractWords(text: string): string[] {
  // Remove HTML tags, punctuation, and normalize
  const cleanText = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .toLowerCase()
    .trim();

  // Split by whitespace and filter out empty strings and very short words
  return cleanText
    .split(/\s+/)
    .filter(word => word.length > 2 && word.length < 50) // Reasonable word length
    .filter(word => !/^\d+$/.test(word)); // Filter out pure numbers
}

async function processArticlesForWords(repository: WordCountRepository): Promise<void> {
  console.log('Fetching articles from Meduza RSS feed...');

  try {
    // For now, we'll fetch the RSS and extract words from titles and descriptions
    // In a real implementation, you'd fetch full articles
    const meduzaRepo = new MeduzaRepository();
    const rssResponse = await fetch(meduzaRepo.baseUrl);
    const rssText = await rssResponse.text();

    // Extract titles and descriptions from RSS
    const titleMatches = rssText.match(/<title>(.*?)<\/title>/g) || [];
    const descriptionMatches = rssText.match(/<description>(.*?)<\/description>/g) || [];

    let totalWords = 0;

    // Process titles
    for (const titleMatch of titleMatches) {
      const titleText = titleMatch.replace(/<\/?title>/g, '');
      const words = extractWords(titleText);
      for (const word of words) {
        await repository.incrementWordCount(word);
        totalWords++;
      }
    }

    // Process descriptions
    for (const descMatch of descriptionMatches) {
      const descText = descMatch.replace(/<\/?description>/g, '');
      const words = extractWords(descText);
      for (const word of words) {
        await repository.incrementWordCount(word);
        totalWords++;
      }
    }

    console.log(`✅ Processed ${totalWords} words from ${titleMatches.length + descriptionMatches.length} articles`);
  } catch (error) {
    console.error('❌ Error processing articles:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('📝 Starting Meduza word counter...');

    const wordRepo = new WordCountRepository();
    const meduzaRepo = new MeduzaRepository();

    // Count today's articles
    console.log('🗓️ Fetching today\'s article count...');
    const articleCount = await meduzaRepo.countTodayArticles();
    console.log(`✅ Found ${articleCount} articles published today on Meduza`);

    // Process words from articles
    await processArticlesForWords(wordRepo);

    // Show some stats
    const uniqueWords = await wordRepo.getTotalUniqueWords();
    const topWords = await wordRepo.getTopWords(10);

    console.log(`📊 Total unique words: ${uniqueWords}`);
    console.log('🔝 Top 10 words:');
    topWords.forEach(({ word, count }, index) => {
      console.log(`  ${index + 1}. "${word}": ${count}`);
    });

    await wordRepo.disconnect();
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
