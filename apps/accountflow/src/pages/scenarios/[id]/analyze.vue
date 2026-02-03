<template>
  <div class="container mx-auto p-6 h-full">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">加载场景中...</p>
      </div>
    </div>
    
    <div v-else class="grid grid-cols-1 gap-6 h-full">
      <!-- Chat Section -->
      <div class="card flex flex-col h-full">
        <div class="border-b pb-4 mb-4">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ scenario?.name }}</h2>
              <p class="text-gray-600 text-sm">{{ scenario?.description }}</p>
            </div>
            <div class="flex items-center gap-1">
              <ExportButton
                :scenario-id="parseInt(scenarioId, 10)"
                :messages="messages"
                :scenario-name="scenario?.name"
              />
              <button
                @click="showShareModal = true"
                class="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
                title="分享对话"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto" ref="messagesContainer">
          <div v-for="(message, index) in messages" :key="index" class="mb-4">
            <div :class="message.role === 'user' ? 'user-message' : 'assistant-message'">
              <div class="flex items-center mb-2 justify-between">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                       :class="message.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'">
                    {{ message.role === 'user' ? '你' : 'AI' }}
                  </div>
                  <div class="font-medium text-sm">
                    {{ message.role === 'user' ? '用户' : 'AI助手' }}
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
                    @click="showLog(message.id)"
                    class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                    title="查看请求日志"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </button>
                  <button
                    v-if="message.role === 'assistant' && message.id"
                    @click="showStats(message.id)"
                    class="text-gray-400 hover:text-green-600 p-1 rounded hover:bg-green-50"
                    title="查看响应统计"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </button>
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
              <div class="message-content markdown-content" v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
          <div v-if="streaming" class="text-center text-gray-400 text-sm py-3">
            <div class="inline-flex items-center">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-2"></div>
              AI正在分析中...
            </div>
          </div>
        </div>
        
        <form @submit.prevent="sendMessage" class="space-y-2">
          <div class="flex gap-2">
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
    <!-- Log/Stats Modal -->
    <div v-if="showLogModal || showStatsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <RequestLogViewer
          v-if="showLogModal && selectedMessageId"
          :message-id="selectedMessageId"
          @close="closeModals"
        />
        <ResponseStatsViewer
          v-if="showStatsModal && selectedMessageId"
          :message-id="selectedMessageId"
          @close="closeModals"
        />
      </div>
    </div>
    <!-- Share Modal -->
    <div v-if="showShareModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-lg w-full p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">分享对话</h3>
          <button @click="showShareModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <ShareManager :scenario-id="parseInt(scenarioId, 10)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'
import { useRoute } from 'vue-router'
import ProviderModelSelector from '../../../components/ai-config/ProviderModelSelector.vue'
import RequestLogViewer from '../../../components/conversation/RequestLogViewer.vue'
import ResponseStatsViewer from '../../../components/conversation/ResponseStatsViewer.vue'
import ExportButton from '../../../components/conversation/ExportButton.vue'
import ShareManager from '../../../components/conversation/ShareManager.vue'

const route = useRoute()
const scenarioId = route.params.id as string
const { messages, loading: conversationLoading, loadMessages, saveMessage } = useConversation(parseInt(scenarioId, 10))

// Initialize markdown renderer
const md = new MarkdownIt({
  html: true,
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
      // Generate unique ID for mermaid diagram
      const diagramId = `mermaid-${Date.now()}-${idx}`
      // Store content in data attribute to avoid HTML escaping issues
      const encodedContent = encodeURIComponent(token.content)
      return `<div class="mermaid-container" id="${diagramId}" data-content="${encodedContent}"></div>`
    } catch (error) {
      console.error('Mermaid rendering error:', error)
      return `<pre><code>${token.content}</code></pre>`
    }
  }
  
  // Use default renderer for other fence blocks
  return defaultRender(tokens, idx, options, env, renderer)
}

const loading = ref(true)
const scenario = ref<any>(null)
const inputMessage = ref('')
const streaming = ref(false)
const messagesContainer = ref<HTMLElement>()

// AI Provider selection
const aiProviders = ref<any[]>([])
const loadingProviders = ref(false)
const selectedProviderId = ref('')
const selectedModel = ref('')

// Load AI providers
async function loadProviders() {
  loadingProviders.value = true
  try {
    const response = await $fetch<{ success: boolean; data: any[] }>('/api/ai-providers')
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

// Log/Stats modal state
const showLogModal = ref(false)
const showStatsModal = ref(false)
const showShareModal = ref(false)
const selectedMessageId = ref<number | null>(null)

function showLog(messageId: number) {
  selectedMessageId.value = messageId
  showLogModal.value = true
  showStatsModal.value = false
}

function showStats(messageId: number) {
  selectedMessageId.value = messageId
  showStatsModal.value = true
  showLogModal.value = false
}

function closeModals() {
  showLogModal.value = false
  showStatsModal.value = false
  selectedMessageId.value = null
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
  // Load AI providers first
  await loadProviders()
  
  // Load scenario
  const response = await $fetch<{ success: boolean; data: any }>(`/api/scenarios/${scenarioId}`)
  if (response.success) {
    scenario.value = response.data
  }
  
  // Load messages from API (with auto-migration from localStorage)
  await loadMessages()
  
  // Render mermaid diagrams for loaded messages
  if (messages.value.length > 0) {
    await nextTick()
    renderMermaidDiagrams()
  }
  
  loading.value = false
})

function renderMarkdown(content: string): string {
  return md.render(content)
}

async function sendMessage() {
  if (!inputMessage.value.trim()) return
  
  const userMessage = inputMessage.value
  const userMessageData = { role: 'user' as const, content: userMessage }
  messages.value.push(userMessageData)
  inputMessage.value = ''
  streaming.value = true
  
  // Save to database
  await saveMessage(userMessageData)
  
  await nextTick()
  scrollToBottom()
  
  try {
    // Create assistant message for streaming - store direct reference
    const assistantMessage = { role: 'assistant' as const, content: '' }
    messages.value.push(assistantMessage)
    
    // Use fetch with streaming
    const response = await fetch(`/api/scenarios/${scenarioId}/chat.stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        content: userMessage,
        providerId: selectedProviderId.value || undefined,
        model: selectedModel.value || undefined
      }),
    })
    
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    if (!reader) {
      throw new Error('No response body')
    }
    
    let fullContent = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        streaming.value = false
        scrollToBottom()
        // Render mermaid diagrams after message is complete
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
              // Append chunk content in real-time
              fullContent += data.content
              assistantMessage.content = fullContent
              scrollToBottom()
            } else if (data.type === 'complete') {
              // Update final message
              fullContent = data.message
              assistantMessage.content = data.message
            } else if (data.type === 'done') {
              streaming.value = false
              scrollToBottom()
              // Wait for DOM to fully update before rendering mermaid
              await nextTick()
              setTimeout(() => {
                renderMermaidDiagrams()
              }, 100)
              // Save final assistant message to database
              await saveMessage({
                role: 'assistant',
                content: fullContent || assistantMessage.content
              })
              return
            } else if (data.type === 'error') {
              assistantMessage.content = '抱歉，处理请求时出错：' + data.message
              streaming.value = false
              scrollToBottom()
              // Save error message to database
              await saveMessage({
                role: 'assistant',
                content: assistantMessage.content
              })
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
    const errorMessage = { role: 'assistant' as const, content: '抱歉，处理请求时出错。请稍后重试。' }
    messages.value.push(errorMessage)
    streaming.value = false
    // Save error message to database
    await saveMessage(errorMessage)
    await nextTick()
    scrollToBottom()
  }
}

function copyMessage(content: string) {
  navigator.clipboard.writeText(content).then(() => {
    alert('内容已复制到剪贴板')
  }).catch(err => {
    console.error('Failed to copy:', err)
    alert('复制失败，请手动复制')
  })
}

function renderMermaidDiagrams() {
  // Initialize mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    }
  })
  
  // Find all mermaid containers and render them
  const containers = document.querySelectorAll('.mermaid-container')
  console.log(`Found ${containers.length} mermaid containers`)
  
  containers.forEach(async (container, index) => {
    try {
      const encodedContent = container.getAttribute('data-content')
      if (!encodedContent) {
        console.warn(`Container ${index}: no data-content found`)
        return
      }
      
      let content = decodeURIComponent(encodedContent)
      console.log(`Container ${index} content (first 100 chars):`, content.substring(0, 100))
      
      if (!content.trim()) {
        console.warn(`Container ${index}: empty content`)
        return
      }
      
      // Don't sanitize - let Mermaid handle the content as-is
      // The issue was that replacing () breaks Mermaid's node label syntax like A(Label)
      
      const diagramId = `mermaid-${Date.now()}-${index}`
      console.log(`Rendering diagram ${diagramId}`)
      
      const { svg } = await mermaid.render(diagramId, content.trim())
      container.innerHTML = svg
      console.log(`Diagram ${diagramId} rendered successfully`)
    } catch (error) {
      console.error(`Mermaid rendering error for container ${index}:`, error)
      // Show error message in container
      const encodedContent = container.getAttribute('data-content')
      if (encodedContent) {
        container.innerHTML = `<div class="text-red-500 text-sm">图表渲染失败</div><pre class="bg-gray-100 p-2 mt-2 text-xs overflow-x-auto"><code>${decodeURIComponent(encodedContent)}</code></pre>`
      }
    }
  })
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function deleteMessage(index: number, messageId?: number) {
  if (!confirm('确定要删除这条消息吗？')) return
  
  // Remove from local array
  messages.value.splice(index, 1)
  
  // If message has an ID, delete from database
  if (messageId) {
    try {
      await $fetch(`/api/conversations/${scenarioId}/messages/${messageId}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to delete message:', e)
    }
  }
}
</script>

<style scoped>
.user-message {
  @apply bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm;
}

.assistant-message {
  @apply bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg shadow-sm;
}

.message-content {
  @apply text-sm leading-relaxed text-gray-800;
}

/* Markdown styles - use shared .markdown-content class from main.css */
/* Only keep page-specific overrides if needed */
.message-content :deep(pre) {
  @apply bg-gray-100 text-gray-800 p-3 rounded-lg overflow-x-auto my-2 border border-gray-200;
}

.message-content :deep(pre code) {
  @apply bg-transparent text-gray-800 p-0;
}

/* Mermaid container styles */
.message-content :deep(.mermaid-container) {
  @apply bg-white border border-gray-200 rounded-lg p-4 mb-4 overflow-x-auto;
}

.message-content :deep(.mermaid-container svg) {
  @apply max-w-full;
}
</style>
