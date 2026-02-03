<template>
  <div class="container mx-auto p-6 max-w-4xl">
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">加载中...</p>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-600 mb-4">{{ error }}</div>
      <NuxtLink to="/" class="text-blue-600 hover:underline">返回首页</NuxtLink>
    </div>

    <div v-else-if="sharedData" class="space-y-6">
      <!-- Header -->
      <div class="border-b pb-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">{{ sharedData.scenario.name }}</h1>
            <p v-if="sharedData.scenario.description" class="text-gray-600 mt-1">{{ sharedData.scenario.description }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a
              :href="`/api/shares/${token}/export`"
              class="btn-secondary text-sm flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              下载 Markdown
            </a>
          </div>
        </div>
        <div class="text-sm text-gray-500 mt-2">
          分享于 {{ formatDate(sharedData.sharedAt) }}
        </div>
      </div>

      <!-- Messages -->
      <div class="space-y-4">
        <div
          v-for="(message, index) in sharedData.messages"
          :key="index"
          :class="message.role === 'user' ? 'user-message' : 'assistant-message'"
        >
          <div class="flex items-center mb-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                 :class="message.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'">
              {{ message.role === 'user' ? '用户' : 'AI' }}
            </div>
            <div class="text-sm text-gray-500">
              {{ formatDate(message.timestamp) }}
            </div>
          </div>
          <div class="message-content" v-html="renderMarkdown(message.content)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const token = route.params.token as string

const loading = ref(true)
const error = ref('')
const sharedData = ref<any>(null)

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

onMounted(async () => {
  try {
    const response = await fetch(`/api/shares/${token}`)
    const data = await response.json()
    
    if (data.success) {
      sharedData.value = data.data
    } else {
      error.value = data.error || '加载失败'
    }
  } catch (e) {
    error.value = '网络错误'
  } finally {
    loading.value = false
  }
})

function renderMarkdown(content: string): string {
  return md.render(content)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
.user-message {
  @apply bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg;
}

.assistant-message {
  @apply bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg;
}

.message-content {
  @apply text-sm leading-relaxed text-gray-800;
}

.message-content :deep(h1), .message-content :deep(h2), .message-content :deep(h3) {
  @apply font-bold mb-2 mt-4;
}

.message-content :deep(p) {
  @apply mb-2;
}

.message-content :deep(pre) {
  @apply bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2;
}

.message-content :deep(code) {
  @apply bg-gray-100 px-1 py-0.5 rounded text-sm;
}
</style>
