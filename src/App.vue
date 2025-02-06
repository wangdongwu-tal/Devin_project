<script>
export default {
  name: 'App',
  data() {
    return {
      isDark: false,
      activeMode: 'All',
      searchQuery: '',
      isSearching: false,
      searchResult: '',
      searchSources: []
    }
  },
  methods: {
    toggleDarkMode() {
      this.isDark = !this.isDark
      document.documentElement.classList.toggle('dark')
    },
    setMode(mode) {
      this.activeMode = mode
    },
    async handleSearch(query) {
      if (!query.trim()) return
      
      this.isSearching = true
      this.searchResult = ''
      this.searchSources = []
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        if (query.includes('天气')) {
          this.searchResult = '根据最新气象数据，今天天气晴朗，温度适宜。建议您可以进行户外活动。空气质量良好，适合各类户外运动。'
          this.searchSources = [
            { title: '中国天气网 - 实时天气报告', url: 'https://weather.example.com' },
            { title: '环境监测站 - 空气质量数据', url: 'https://air-quality.example.com' }
          ]
        } else if (query.includes('时间')) {
          this.searchResult = `现在是北京时间 ${new Date().toLocaleTimeString()}。标准时间由国家授时中心提供，误差小于0.1秒。`
          this.searchSources = [
            { title: '国家授时中心', url: 'https://time.example.com' }
          ]
        } else {
          this.searchResult = '抱歉，我暂时无法回答这个问题。请尝试其他问题或稍后再试。'
        }
      } catch (error) {
        this.searchResult = '搜索过程中出现错误，请稍后重试。'
      } finally {
        this.isSearching = false
      }
    }
  }
}
</script>

<template>
  <div class="min-h-screen">
    <header class="fixed top-0 w-full">
      <nav class="container px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent">
          AI Search
        </h1>
        <button 
          @click="toggleDarkMode" 
          class="p-2 rounded-full"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
        >
          {{ isDark ? '🌞' : '🌙' }}
        </button>
      </nav>
    </header>
    <main class="container px-4 pt-24">
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="activeMode === 'Writing' ? '开始写作...' : '输入您的问题...'"
          @keyup.enter="handleSearch(searchQuery)"
        />
        <button
          @click="handleSearch(searchQuery)"
          :disabled="isSearching"
          class="search-button"
        >
          {{ isSearching ? '搜索中...' : '搜索' }}
        </button>
      </div>
      <div v-if="searchResult || isSearching" class="search-result">
        <p>{{ searchResult }}</p>
        <div v-if="searchSources.length > 0" class="sources">
          <h3>参考来源：</h3>
          <ul>
            <li v-for="source in searchSources" :key="source.url">
              <a :href="source.url" target="_blank" rel="noopener noreferrer">
                {{ source.title }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
:root {
  --color-primary: #3b82f6;
  --color-text: #1f2937;
  --color-bg: #f9fafb;
  --color-bg-dark: #111827;
  --color-text-dark: #f3f4f6;
}

.dark {
  background-color: var(--color-bg-dark);
  color: var(--color-text-dark);
}

.min-h-screen { min-height: 100vh; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.fixed { position: fixed; }
.top-0 { top: 0; }
.w-full { width: 100%; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-bold { font-weight: 700; }
.rounded-full { border-radius: 9999px; }
.rounded-2xl { border-radius: 1rem; }
.p-2 { padding: 0.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.pt-24 { padding-top: 6rem; }
.text-transparent { color: transparent; }
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--color-primary), #60a5fa); }
.bg-clip-text { -webkit-background-clip: text; background-clip: text; }

.search-container {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  outline: none;
}

.search-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.5rem 1rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-result {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .search-result {
  background-color: var(--color-bg-dark);
}

.sources {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.dark .sources {
  border-top-color: #374151;
}

.sources h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.sources ul {
  list-style: none;
  padding: 0;
}

.sources li {
  margin: 0.5rem 0;
}

.sources a {
  color: var(--color-primary);
  text-decoration: none;
}

.sources a:hover {
  text-decoration: underline;
}
</style>
