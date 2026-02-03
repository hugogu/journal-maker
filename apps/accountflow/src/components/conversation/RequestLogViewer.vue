<template>
  <div class="request-log-viewer">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">请求日志</h3>
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

    <div v-else-if="logData" class="space-y-4">
      <!-- System Prompt -->
      <div v-if="logData.systemPrompt" class="border rounded-lg p-4">
        <h4 class="font-medium text-sm text-gray-700 mb-2">System Prompt</h4>
        <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">{{ logData.systemPrompt }}</pre>
      </div>

      <!-- Context Messages -->
      <div v-if="logData.contextMessages?.length" class="border rounded-lg p-4">
        <h4 class="font-medium text-sm text-gray-700 mb-2">上下文消息 ({{ logData.contextMessages.length }})</h4>
        <div class="space-y-2 max-h-40 overflow-auto">
          <div v-for="(msg, i) in logData.contextMessages" :key="i" class="bg-gray-50 p-2 rounded text-xs">
            <span class="font-medium" :class="msg.role === 'system' ? 'text-purple-600' : 'text-blue-600'">{{ msg.role }}:</span>
            <span class="ml-2 text-gray-700">{{ msg.content.substring(0, 100) }}{{ msg.content.length > 100 ? '...' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Full Prompt -->
      <div v-if="logData.fullPrompt" class="border rounded-lg p-4">
        <h4 class="font-medium text-sm text-gray-700 mb-2">完整 Prompt</h4>
        <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">{{ logData.fullPrompt }}</pre>
      </div>

      <!-- Variables -->
      <div v-if="logData.variables && Object.keys(logData.variables).length > 0" class="border rounded-lg p-4">
        <h4 class="font-medium text-sm text-gray-700 mb-2">变量</h4>
        <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto">{{ JSON.stringify(logData.variables, null, 2) }}</pre>
      </div>
    </div>

    <div v-else class="text-gray-500 text-center py-8">
      暂无日志数据
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface RequestLogData {
  systemPrompt?: string
  contextMessages?: { role: string; content: string }[]
  fullPrompt?: string
  variables?: Record<string, any>
}

const props = defineProps<{
  messageId: number
}>()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref('')
const logData = ref<RequestLogData | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/conversations/messages/${props.messageId}/log`)
    const data = await response.json()
    
    if (data.success) {
      logData.value = data.data
    } else {
      error.value = data.error || '加载失败'
    }
  } catch (e) {
    error.value = '网络错误'
  } finally {
    loading.value = false
  }
})
</script>
