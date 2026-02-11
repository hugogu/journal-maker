<template>
  <button
    @click="exportConversation"
    :disabled="exporting"
    class="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
    title="导出对话"
  >
    <svg v-if="exporting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  scenarioId: number
  messages: { role: string; content: string; timestamp?: string }[]
  scenarioName?: string
}>()

const exporting = ref(false)
const toast = useToast()

function exportConversation() {
  exporting.value = true

  try {
    const markdown = generateMarkdown()
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.scenarioName || 'conversation'}-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('对话导出成功')
  } catch (e) {
    console.error('Export failed:', e)
    toast.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

function generateMarkdown(): string {
  const lines: string[] = []
  
  lines.push(`# ${props.scenarioName || '对话记录'}`)
  lines.push('')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  
  for (const message of props.messages) {
    const role = message.role === 'user' ? '**用户**' : '**AI助手**'
    const time = message.timestamp 
      ? new Date(message.timestamp).toLocaleString('zh-CN')
      : new Date().toLocaleString('zh-CN')
    
    lines.push(`${role} (${time})`)
    lines.push('')
    lines.push(message.content)
    lines.push('')
    lines.push('---')
    lines.push('')
  }
  
  return lines.join('\n')
}
</script>
