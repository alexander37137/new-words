import { MeduzaRepository } from '@new-words/meduza-api-client';
import { WordCountRepository } from '@new-words/db-client';

function decodeHtmlEntities(text: string): string {
  // Create a temporary DOM element to leverage browser's HTML entity decoding
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Fallback for Node.js: basic entity decoding
  return text
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function extractWords(text: string): string[] {
  // Decode HTML entities first
  const decodedText = decodeHtmlEntities(text);

  // Remove HTML tags and CDATA
  const cleanText = decodedText
    .replace(/<!\[CDATA\[|\]\]>/g, '') // Remove CDATA tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\p{L}\p{M}\s-]/gu, ' ') // Keep letters, marks, spaces, hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toLowerCase()
    .trim();

  // Split by whitespace and filter
  return cleanText
    .split(/\s+/)
    .filter(word => word.length > 2 && word.length < 50)
    .filter(word => !/^\d+$/.test(word));
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
