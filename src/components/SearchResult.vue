<script>
export default {
  props: {
    content: {
      type: String,
      required: true
    },
    sources: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<template>
  <Transition name="search-result">
    <div class="w-full max-w-3xl mx-auto mt-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover-scale">
        <div v-if="loading" class="animate-pulse space-y-4">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div v-else>
          <p class="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
            {{ content }}
          </p>
          <Transition name="fade">
            <div v-if="sources.length > 0" class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                参考来源：
              </h3>
              <ul class="space-y-2">
                <li v-for="source in sources" :key="source.url" class="flex items-center space-x-2">
                  <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <a
                    :href="source.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    {{ source.title }}
                  </a>
                </li>
              </ul>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>
