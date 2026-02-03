<template>
  <div class="response-stats-viewer">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">响应统计</h3>
      <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="text-gray-500 mt-2">加载中...</p>
    </div>

    <div v-else-if="error" class="text-red-600 py-4">
      {{ error }}
    </div>

    <div v-else-if="stats" class="space-y-4">
      <!-- Provider Info -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 p-3 rounded-lg">
          <span class="text-xs text-gray-500">Provider</span>
          <p class="font-medium">{{ stats.providerName || 'Default' }}</p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <span class="text-xs text-gray-500">模型</span>
          <p class="font-medium">{{ stats.model || 'Unknown' }}</p>
        </div>
      </div>

      <!-- Token Usage -->
      <div class="border rounded-lg p-4">
        <h4 class="font-medium text-sm text-gray-700 mb-3">Token 使用</h4>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="bg-blue-50 p-3 rounded">
            <div class="text-2xl font-bold text-blue-600">{{ stats.inputTokens }}</div>
            <div class="text-xs text-gray-500">输入</div>
          </div>
          <div class="bg-green-50 p-3 rounded">
            <div class="text-2xl font-bold text-green-600">{{ stats.outputTokens }}</div>
            <div class="text-xs text-gray-500">输出</div>
          </div>
          <div class="bg-purple-50 p-3 rounded">
            <div class="text-2xl font-bold text-purple-600">{{ stats.totalTokens }}</div>
            <div class="text-xs text-gray-500">总计</div>
          </div>
        </div>
      </div>

      <!-- Performance -->
      <div class="border rounded-lg p-4">
        <h4 class="font-medium text-sm text-gray-700 mb-3">性能</h4>
        <div class="flex items-center justify-between">
          <span class="text-gray-600">响应时间</span>
          <span class="font-medium">{{ formatDuration(stats.durationMs) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="text-gray-500 text-center py-8">
      暂无统计数据
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
