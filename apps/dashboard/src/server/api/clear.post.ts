import Redis from 'ioredis'

export default defineEventHandler(async () => {
  const redis = new Redis({
    host: 'localhost',
    port: 6379
  })

  try {
    await redis.flushdb()
    return {
      success: true,
      message: 'Database cleared successfully'
    }
  } catch (error) {
    console.error('Error clearing database:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to clear database'
    })
  } finally {
    await redis.disconnect()
  }
})
