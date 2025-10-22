<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>📊 Meduza Word Statistics Dashboard</h1>
      <p>Real-time word frequency analysis from Meduza news articles</p>
    </header>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>Loading statistics...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>❌ Error loading statistics: {{ error.message }}</p>
      <button @click="refresh" class="refresh-btn">Retry</button>
    </div>

    <div v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Unique Words</h3>
          <p class="stat-number">{{ data?.totalWords || 0 }}</p>
        </div>

        <div class="stat-card">
          <h3>Top Words Tracked</h3>
          <p class="stat-number">{{ data?.topWords?.length || 0 }}</p>
        </div>
      </div>

      <div class="top-words-section">
        <h2>🔝 Top 10 Words</h2>

        <div v-if="!data?.topWords?.length" class="empty-state">
          <p>No words found yet. Run the word counter to populate data.</p>
        </div>

        <div v-else class="word-list">
          <div
            v-for="(item, index) in data.topWords"
            :key="item.word"
            class="word-item"
            :class="{ 'top-word': index < 3 }"
          >
            <div class="word-rank">
              <span class="rank-number">#{{ index + 1 }}</span>
            </div>

            <div class="word-content">
              <span class="word-text">"{{ item.word }}"</span>
              <span class="word-count">{{ item.count }} occurrences</span>
            </div>

            <div class="word-bar">
              <div
                class="word-bar-fill"
                :style="{ width: getBarWidth(item.count) }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="refresh" class="refresh-btn" :disabled="pending || clearing">
          {{ pending ? 'Loading...' : '🔄 Refresh Data' }}
        </button>
        <button @click="clearDatabase" class="clear-btn" :disabled="pending || clearing">
          {{ clearing ? 'Clearing...' : '🗑️ Clear Database' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data, pending, error, refresh } = await useFetch('/api/stats')
const clearing = ref(false)

const getBarWidth = (count: number) => {
  if (!data.value?.topWords?.length) return '0%'
  const maxCount = data.value.topWords[0].count
  return `${(count / maxCount) * 100}%`
}

const clearDatabase = async () => {
  if (!confirm('Are you sure you want to delete all data from the database? This cannot be undone.')) {
    return
  }
  
  clearing.value = true
  try {
    await $fetch('/api/clear', { method: 'POST' })
    await refresh()
  } catch (err) {
    console.error('Error clearing database:', err)
    alert('Failed to clear database')
  } finally {
    clearing.value = false
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.dashboard-header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state p {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  opacity: 0.9;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  margin: 0;
}

.top-words-section {
  margin-bottom: 3rem;
}

.top-words-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
}

.word-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.word-item {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  transition: transform 0.2s, box-shadow 0.2s;
}

.word-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.word-item.top-word {
  border-color: #ffd700;
  background: linear-gradient(135deg, #fff8dc 0%, #ffffff 100%);
}

.word-rank {
  min-width: 60px;
  text-align: center;
}

.rank-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #6c757d;
}

.word-item.top-word .rank-number {
  color: #ffd700;
}

.word-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.word-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  font-style: italic;
}

.word-count {
  font-size: 0.9rem;
  color: #6c757d;
}

.word-bar {
  flex: 1;
  max-width: 200px;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-left: 1rem;
}

.word-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.word-item.top-word .word-bar-fill {
  background: linear-gradient(90deg, #ffd700 0%, #ffb347 100%);
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 3rem;
  flex-wrap: wrap;
}

.refresh-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-btn {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.clear-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.clear-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .dashboard-header h1 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .word-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .word-bar {
    width: 100%;
    max-width: none;
    margin-left: 0;
  }
}
</style>
