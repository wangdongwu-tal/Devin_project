<script>
export default {
  emits: ['search'],
  data() {
    return {
      searchModes: ['All', 'Academic', 'Writing'],
      activeMode: 'All',
      searchQuery: '',
      isSearching: false
    }
  },
  methods: {
    handleSearch() {
      if (!this.searchQuery.trim()) return
      this.$emit('search', this.searchQuery, this.activeMode)
    }
  }
}
</script>

<template>
  <div class="relative w-full max-w-3xl mx-auto">
    <Transition name="fade">
      <div class="flex gap-2 mb-4">
        <button
          v-for="mode in searchModes"
          :key="mode"
          @click="activeMode = mode"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
            activeMode === mode
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 scale-105'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 hover:scale-105'
          ]"
        >
          {{ mode }}
        </button>
      </div>
    </Transition>
    
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        class="w-full px-6 py-4 text-lg border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow duration-200 hover:shadow-md"
        :placeholder="activeMode === 'Writing' ? '开始写作...' : '输入您的问题...'"
        @keyup.enter="handleSearch"
      />
      <button
        @click="handleSearch"
        :disabled="isSearching"
        class="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105"
      >
        <span :class="{ 'loading-pulse': isSearching }">
          {{ isSearching ? '搜索中...' : '搜索' }}
        </span>
      </button>
    </div>
  </div>
</template>
