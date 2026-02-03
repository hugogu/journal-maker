<template>
  <div class="response-stats-viewer">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">响应统计</h3>
      <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p class="text-gray-500 text-sm">加载中...</p>
    </div>

    <div v-else-if="error" class="text-red-600 py-8 px-4 bg-red-50 rounded-lg border border-red-200">
      {{ error }}
    </div>

    <div v-else-if="stats" class="space-y-6">
      <!-- Provider Info -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</span>
          <p class="font-medium text-gray-900 mt-2">{{ stats.providerName || 'Default' }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">模型</span>
          <p class="font-medium text-gray-900 mt-2">{{ stats.model || 'Unknown' }}</p>
        </div>
      </div>

      <!-- Token Usage -->
      <div class="bg-white border border-gray-200 rounded-lg p-5">
        <h4 class="font-medium text-sm text-gray-700 mb-4 flex items-center">
          <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          Token 使用
        </h4>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ stats.inputTokens }}</div>
            <div class="text-xs text-gray-600 mt-2 font-medium">输入</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div class="text-2xl font-bold text-green-600">{{ stats.outputTokens }}</div>
            <div class="text-xs text-gray-600 mt-2 font-medium">输出</div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
            <div class="text-2xl font-bold text-purple-600">{{ stats.totalTokens }}</div>
            <div class="text-xs text-gray-600 mt-2 font-medium">总计</div>
          </div>
        </div>
      </div>

      <!-- Performance -->
      <div class="bg-white border border-gray-200 rounded-lg p-5">
        <h4 class="font-medium text-sm text-gray-700 mb-4 flex items-center">
          <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          性能
        </h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2">
            <span class="text-gray-600 text-sm">响应时间</span>
            <span class="font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">{{ formatDuration(stats.durationMs) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-gray-500 text-center py-12">
      <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
      <p class="text-sm">暂无统计数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ResponseStats {
  model?: string
  providerId?: string
  providerName?: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  durationMs: number
}

const props = defineProps<{
  messageId: number
}>()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref('')
const stats = ref<ResponseStats | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/conversations/messages/${props.messageId}/stats`)
    const data = await response.json()
    
    if (data.success) {
      stats.value = data.data
    } else {
      error.value = data.error || '加载失败'
    }
  } catch (e) {
    error.value = '网络错误'
  } finally {
    loading.value = false
  }
})

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}
</script>
