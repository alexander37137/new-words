import Redis from 'ioredis'

export default defineEventHandler(async () => {
  const redis = new Redis({
    host: 'localhost',
    port: 6379
  })

  try {
    // Get all word keys
    const keys = await redis.keys('word:*')

    if (keys.length === 0) {
      return {
        totalWords: 0,
        topWords: []
      }
    }

    // Get word counts
    const counts = await redis.mget(keys)

    // Combine and sort
    const words = keys.map((key, index) => ({
      word: key.replace('word:', ''),
      count: parseInt(counts[index] || '0', 10)
    }))

    const sortedWords = words
      .filter(w => w.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const totalWords = keys.length

    return {
      totalWords,
      topWords: sortedWords
    }
  } catch (error) {
    console.error('Error fetching word stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch word statistics'
    })
  } finally {
    await redis.disconnect()
  }
})
