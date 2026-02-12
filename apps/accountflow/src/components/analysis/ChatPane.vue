<template>
  <div class="card flex flex-col h-full p-6">
    <!-- Header -->
    <div class="border-b pb-6 mb-6">
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-2xl font-bold text-gray-900">{{ scenario?.name }}</h1>
        <div class="flex items-center gap-2">
          <ExportButton
            :scenario-id="scenarioIdNum"
            :messages="messages"
            :scenario-name="scenario?.name"
          />
          <button
            @click="$emit('showShare')"
            class="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
            title="分享对话"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
            </svg>
          </button>
        </div>
      </div>
      <p class="text-gray-600 text-sm">{{ scenario?.description }}</p>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" class="mb-3">
        <div :class="[
          message.role === 'user' ? 'user-message' : 'assistant-message',
          message.role === 'assistant' && isConfirmed(message.id) ? 'confirmed-message' : ''
        ]">
          <div class="flex items-center mb-2 justify-between">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                   :class="message.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'">
                {{ message.role === 'user' ? '你' : 'AI' }}
              </div>
              <div class="font-medium text-sm flex items-center gap-2">
                <template v-if="message.role === 'user'">用户</template>
                <template v-else>
                  <span v-if="message.responseStats?.providerName">
                    {{ message.responseStats.providerName }}
                    <span v-if="message.responseStats.model" class="text-xs text-gray-500">
                      / {{ message.responseStats.model }}
                    </span>
                  </span>
                  <span v-else>AI助手</span>
                </template>
                <!-- Confirmation Badge -->
                <span v-if="message.role === 'assistant' && isConfirmed(message.id)" 
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  已确认
                </span>
                <span v-if="message.role === 'assistant' && streaming && index === messages.length - 1"
                      class="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button
                v-if="message.content"
                @click="copyMessage(message.content)"
                class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                title="复制内容"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
              <button
                v-if="message.role === 'assistant' && message.id"
                @click="$emit('showLog', message.id)"
                class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                title="查看请求日志"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </button>
              <button
                v-if="message.role === 'assistant' && message.id"
                @click="$emit('showStats', message.id)"
                class="text-gray-400 hover:text-green-600 p-1 rounded hover:bg-green-50"
                title="查看响应统计"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </button>
              <!-- Confirm button for assistant messages -->
              <ConfirmAnalysisButton
                v-if="message.role === 'assistant' && !streaming"
                :message-content="message.content"
                :message-id="message.id"
                :disabled="streaming"
                @confirm="handleConfirm"
              />
              <button
                @click="deleteMessage(index, message.id)"
                class="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                title="删除消息"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
          <!-- Message Content with optional height limit -->
          <div class="relative">
            <div
              v-if="streaming && index === messages.length - 1 && message.role === 'assistant'"
              class="message-content markdown-content"
              :class="{ 'message-collapsed': !isExpanded(index) && shouldShowExpandButton(streamingContent) }"
              :key="`streaming-${streamingKey}`"
              v-html="renderStreamingContent(streamingContent)"
            ></div>
            <div
              v-else
              class="message-content markdown-content"
              :class="{ 'message-collapsed': !isExpanded(index) && shouldShowExpandButton(message.content) }"
              v-html="renderMarkdown(message.content)"
            ></div>

            <!-- Expand/Collapse Button -->
            <div
              v-if="shouldShowExpandButton(message.content) && !(streaming && index === messages.length - 1)"
              class="flex justify-center mt-2"
            >
              <button
                @click="toggleExpand(index)"
                class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                <svg v-if="!isExpanded(index)" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                </svg>
                {{ isExpanded(index) ? '收起' : '展开全文' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="streaming" class="text-center text-gray-400 text-sm py-3">
        <div class="inline-flex items-center">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-2"></div>
          AI正在分析中...
        </div>
      </div>
    </div>

    <!-- Input Form -->
    <div class="border-t pt-4 mt-4">
      <form @submit.prevent="sendMessage" class="space-y-3">
        <div class="flex gap-3">
          <textarea
            v-model="inputMessage"
            rows="2"
            class="input flex-1 resize-none"
            placeholder="描述业务场景细节..."
            @keydown.enter.prevent="sendMessage"
            :disabled="streaming"
          />
          <button
            type="submit"
            class="btn-primary self-end"
            :disabled="!inputMessage.trim() || streaming"
          >
            发送
          </button>
        </div>
        <div class="flex justify-start">
          <ProviderModelSelector
            :providers="aiProviders"
            :loading="loadingProviders"
            @change="onProviderChange"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { useConversation } from '../../composables/useConversation'
import { useToast } from '../../composables/useToast'
import ProviderModelSelector from '../ai-config/ProviderModelSelector.vue'
import ExportButton from '../conversation/ExportButton.vue'
import ConfirmAnalysisButton from './ConfirmAnalysisButton.vue'
import type { ParsedAnalysis } from '../../types'

const toast = useToast()

const props = defineProps<{
  scenarioId: string | number
  scenario: { name: string; description?: string } | null
}>()

const scenarioIdNum = computed(() => typeof props.scenarioId === 'string' ? parseInt(props.scenarioId, 10) : props.scenarioId)

const emit = defineEmits<{
  (e: 'showShare'): void
  (e: 'showLog', messageId: number): void
  (e: 'showStats', messageId: number): void
  (e: 'confirm', data: { parsed: ParsedAnalysis; messageId?: number }): void
}>()

const { messages: conversationMessages, loading: conversationLoading, loadMessages } = useConversation(scenarioIdNum.value)

// Create a local writable copy for display
const messages = ref<any[]>([])

// Sync messages when conversation messages change
watch(conversationMessages, (newMessages) => {
  messages.value = [...newMessages]
}, { immediate: true })

// Initialize markdown renderer with XSS protection
const md = new MarkdownIt({
  html: false, // SECURITY: Disable raw HTML to prevent XSS attacks
  linkify: true,
  typographer: true
})

// Custom renderer for mermaid diagrams
const defaultRender = md.renderer.rules.fence || function(tokens, idx, options, env, renderer) {
  return renderer.renderToken(tokens, idx, options)
}

md.renderer.rules.fence = function(tokens, idx, options, env, renderer) {
  const token = tokens[idx]
  const info = token.info ? token.info.trim() : ''

  if (info === 'mermaid') {
    try {
      const diagramId = `mermaid-${Date.now()}-${idx}`
      const encodedContent = encodeURIComponent(token.content)
      return `<div class="mermaid-container" id="${diagramId}" data-content="${encodedContent}"></div>`
    } catch (error) {
      console.error('Mermaid rendering error:', error)
      return `<pre><code>${token.content}</code></pre>`
    }
  }

  return defaultRender(tokens, idx, options, env, renderer)
}

const inputMessage = ref('')
const streaming = ref(false)
const streamingContent = ref('')
const streamingKey = ref(0) // Key for streaming content updates
const messagesContainer = ref<HTMLElement>()
const expandedMessages = ref<Set<number>>(new Set())

// AI Provider selection
const aiProviders = ref<any[]>([])
const loadingProviders = ref(false)
const selectedProviderId = ref('')
const selectedModel = ref('')

// Load AI providers
async function loadProviders() {
  loadingProviders.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any[] }>('/api/admin/ai-providers')
    if (response.success) {
      aiProviders.value = response.data
    }
  } catch (e) {
    console.error('Failed to load AI providers:', e)
  } finally {
    loadingProviders.value = false
  }
}

function onProviderChange(providerId: string, model: string) {
  selectedProviderId.value = providerId
  selectedModel.value = model
}

// Local delete function
async function deleteMessage(index: number, messageId?: number) {
  if (!confirm('确定要删除这条消息吗？')) return

  messages.value.splice(index, 1)

  if (messageId) {
    try {
      await $fetch(`/api/conversations/${scenarioIdNum.value}/messages/${messageId}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to delete message from database:', e)
    }
  }
}

// Watch messages and render mermaid when they change
watch(() => messages.value.length, async (newLength, oldLength) => {
  if (newLength > 0 && newLength !== oldLength) {
    await nextTick()
    setTimeout(() => {
      renderMermaidDiagrams()
    }, 50)
  }
}, { immediate: true })

onMounted(async () => {
  await loadProviders()
  await loadMessages()

  if (messages.value.length > 0) {
    await nextTick()
    renderMermaidDiagrams()
  }
})

function renderMarkdown(content: string): string {
  return md.render(content)
}

function renderStreamingContent(content: string): string {
  // Use markdown rendering for streaming content as well
  return md.render(content)
}

async function toggleExpand(index: number) {
  if (expandedMessages.value.has(index)) {
    expandedMessages.value.delete(index)
  } else {
    expandedMessages.value.add(index)
  }
  
  // Re-render Mermaid diagrams after expansion state changes
  await nextTick()
  setTimeout(() => {
    renderMermaidDiagrams()
  }, 50)
}

function isExpanded(index: number): boolean {
  return expandedMessages.value.has(index)
}

function shouldShowExpandButton(content: string): boolean {
  // Show expand button if content is long (> 500 chars or > 10 lines)
  return content.length > 500 || content.split('\n').length > 10
}

async function sendMessage() {
  if (!inputMessage.value.trim()) return

  const userMessage = inputMessage.value
  const userMessageData = { role: 'user' as const, content: userMessage }
  messages.value.push(userMessageData)
  inputMessage.value = ''
  streaming.value = true
  streamingKey.value++ // Increment key to force re-render when streaming starts

  await nextTick()
  scrollToBottom(true) // Force scroll after user sends message

  try {
    streamingContent.value = ''
    const assistantMessage: { role: 'assistant'; content: string; id?: number } = { role: 'assistant', content: '' }
    messages.value.push(assistantMessage)

    const response = await fetch(`/api/scenarios/${scenarioIdNum.value}/chat.stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: userMessage,
        providerId: selectedProviderId.value ? parseInt(selectedProviderId.value, 10) : undefined,
        model: selectedModel.value || undefined
      }),
    })

    if (!response.ok) throw new Error('Network response was not ok')

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) throw new Error('No response body')

    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        streaming.value = false
        streamingKey.value++ // Increment key to force re-render when streaming ends
        scrollToBottom()
        await nextTick()
        renderMermaidDiagrams()
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'chunk') {
              fullContent += data.content
              streamingContent.value = fullContent
              assistantMessage.content = fullContent
              
              // Immediate scroll during streaming to prevent jumping
              scrollToBottom()
            } else if (data.type === 'user_saved') {
              const userMessageIndex = messages.value.length - 2
              if (userMessageIndex >= 0 && messages.value[userMessageIndex]) {
                messages.value[userMessageIndex].id = data.id
              }
            } else if (data.type === 'complete') {
              fullContent = data.message
              streamingContent.value = data.message
              assistantMessage.content = data.message
            } else if (data.type === 'done') {
              streaming.value = false
              streamingKey.value++ // Increment key to force re-render when streaming ends
              streamingContent.value = ''
              if (data.id) assistantMessage.id = data.id
              await loadMessages()
              scrollToBottom()
              await nextTick()
              setTimeout(() => renderMermaidDiagrams(), 100)
              return
            } else if (data.type === 'error') {
              let errorContent = '抱歉，处理请求时出错：' + data.message
              if (data.cause) errorContent += `\n\n**技术详情:**\n\`${data.cause}\``
              if (data.message?.includes('fetch failed') || data.message?.includes('Connect Timeout')) {
                errorContent += '\n\n**建议:** 检查网络连接或稍后重试'
              }
              assistantMessage.content = errorContent
              streaming.value = false
              streamingKey.value++ // Increment key to force re-render when streaming ends
              scrollToBottom()
              return
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e)
          }
        }
      }
    }
  } catch (e) {
    console.error('Streaming error:', e)
    let errorMessage = '抱歉，处理请求时出错。请稍后重试。'
    if (e instanceof Error && (e.message.includes('fetch failed') || e.message.includes('Connect Timeout Error'))) {
      errorMessage = '网络连接失败，无法访问 AI 服务。请检查网络连接或稍后重试。'
    }
    const errorResponse = { role: 'assistant' as const, content: errorMessage }
    messages.value.push(errorResponse)
    streaming.value = false
    streamingKey.value++ // Increment key to force re-render when streaming ends
    await nextTick()
    scrollToBottom()
  }
}

function copyMessage(content: string) {
  navigator.clipboard.writeText(content).then(() => {
    toast.success('内容已复制到剪贴板')
  }).catch(err => {
    console.error('Failed to copy:', err)
    toast.error('复制失败，请手动复制')
  })
}

async function renderMermaidDiagrams() {
  if (typeof window === 'undefined') return

  // Dynamic import for client-side only
  const mermaidModule = await import('mermaid')
  const mermaid = mermaidModule.default

  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
    // Disable global error handling to prevent errors from appearing at page bottom
    suppressErrorRendering: true
  })

  const containers = document.querySelectorAll('.mermaid-container')

  containers.forEach(async (container, index) => {
    try {
      const encodedContent = container.getAttribute('data-content')
      if (!encodedContent) return

      let content = decodeURIComponent(encodedContent)
      if (!content.trim()) return

      const diagramId = `mermaid-${Date.now()}-${index}`
      const { svg } = await mermaid.render(diagramId, content.trim())
      container.innerHTML = svg
    } catch (error) {
      console.error(`Mermaid rendering error for container ${index}:`, error)
      const encodedContent = container.getAttribute('data-content')
      if (encodedContent) {
        // Show user-friendly error message in the container
        const errorDiv = document.createElement('div')
        errorDiv.className = 'text-red-500 text-sm p-3 bg-red-50 rounded border border-red-200'
        errorDiv.innerHTML = `
          <div class="flex items-center mb-2">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            图表渲染失败
          </div>
          <details class="text-xs">
            <summary class="cursor-pointer hover:text-red-700">查看源码</summary>
            <pre class="mt-2 bg-white p-2 rounded border overflow-x-auto">${decodeURIComponent(encodedContent)}</pre>
          </details>
        `
        container.innerHTML = ''
        container.appendChild(errorDiv)
      }
    }
  })
}

function scrollToBottom(force = false) {
  if (!messagesContainer.value) return

  const container = messagesContainer.value

  // Force scroll during streaming or if explicitly requested
  if (force || streaming.value) {
    // Use immediate scroll for streaming to prevent jumping
    container.scrollTop = container.scrollHeight
    return
  }

  // For non-streaming updates, check if user is near bottom
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200

  if (isNearBottom) {
    container.scrollTop = container.scrollHeight
  }
}

async function handleConfirm(data: { parsed: ParsedAnalysis; messageId?: number }) {
  if (data.messageId) {
    // Save confirmation to database
    try {
      const response = await $fetch(`/api/conversation-messages/${data.messageId}/confirm`, {
        method: 'POST',
        body: { scenarioId: scenarioIdNum.value }
      })
      
      console.log('Confirmation saved:', response)
      
      // Reload messages to reflect the database state
      await loadMessages()
      
    } catch (error) {
      console.error('Failed to save confirmation:', error)
      // Don't update local state if API call failed
    }
  }
  emit('confirm', data)
}

function isConfirmed(messageId?: number): boolean {
  if (!messageId) return false
  // Find the message in the current messages array and check its confirmedAt status
  const message = messages.value.find(msg => msg.id === messageId)
  return message ? !!message.confirmedAt : false
}

// Expose for parent component access
defineExpose({
  loadMessages,
  messages,
  streaming,
})
</script>

<style scoped>
.user-message {
  @apply bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm;
}

.assistant-message {
  @apply bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg shadow-sm;
}

.confirmed-message {
  @apply bg-emerald-50 border-l-4 border-emerald-400;
}

.message-content {
  @apply text-sm leading-relaxed text-gray-800;
}

.message-collapsed {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding-bottom: 20px;
}

/* Scrollbar styling for collapsed messages */
.message-collapsed::-webkit-scrollbar {
  width: 6px;
}

.message-collapsed::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.message-collapsed::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.message-collapsed::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.message-content :deep(pre) {
  @apply bg-gray-100 text-gray-800 p-3 rounded-lg overflow-x-auto my-2 border border-gray-200;
}

.message-content :deep(pre code) {
  @apply bg-transparent text-gray-800 p-0;
}

.message-content :deep(.mermaid-container) {
  @apply bg-white border border-gray-200 rounded-lg p-4 mb-4 overflow-x-auto;
}

.message-content :deep(.mermaid-container svg) {
  @apply max-w-full;
}
</style>
