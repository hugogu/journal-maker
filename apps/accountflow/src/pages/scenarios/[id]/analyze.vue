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
          <h2 class="text-lg font-semibold">{{ scenario?.name }}</h2>
          <p class="text-gray-600 text-sm">{{ scenario?.description }}</p>
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
              </div>
              <div class="message-content" v-html="renderMarkdown(message.content)"></div>
            </div>
          </div>
          <div v-if="streaming" class="text-center text-gray-400 text-sm py-3">
            <div class="inline-flex items-center">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-2"></div>
              AI正在分析中...
            </div>
          </div>
        </div>
        
        <form @submit.prevent="sendMessage" class="flex gap-2">
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
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'
import { useRoute } from 'vue-router'

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

onMounted(async () => {
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
    // Create assistant message for streaming
    const assistantMessageIndex = messages.value.length
    messages.value.push({
      role: 'assistant',
      content: '',
    })
    
    // Use fetch with streaming
    const response = await fetch(`/api/scenarios/${scenarioId}/chat.stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: userMessage }),
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
              // Update message content in real-time
              fullContent = data.fullContent
              messages.value[assistantMessageIndex].content = data.fullContent
              scrollToBottom()
            } else if (data.type === 'complete') {
              // Update final message
              fullContent = data.message
              messages.value[assistantMessageIndex].content = data.message
            } else if (data.type === 'done') {
              streaming.value = false
              scrollToBottom()
              await nextTick()
              renderMermaidDiagrams()
              // Save final assistant message to database
              await saveMessage({
                role: 'assistant',
                content: fullContent || messages.value[assistantMessageIndex].content
              })
              return
            } else if (data.type === 'error') {
              messages.value[assistantMessageIndex].content = '抱歉，处理请求时出错：' + data.message
              streaming.value = false
              scrollToBottom()
              // Save error message to database
              await saveMessage({
                role: 'assistant',
                content: messages.value[assistantMessageIndex].content
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
  // Initialize mermaid if not already done
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true
    }
  })
  
  // Find all mermaid containers and render them
  const containers = document.querySelectorAll('.mermaid-container')
  containers.forEach(async (container) => {
    try {
      // Get content from data attribute (avoid HTML escaping issues)
      const encodedContent = container.getAttribute('data-content')
      let content = encodedContent ? decodeURIComponent(encodedContent) : ''
      
      if (content.trim()) {
        const diagramId = 'mermaid-' + Math.random().toString(36).substr(2, 9)
        const { svg } = await mermaid.render(diagramId, content.trim())
        container.innerHTML = svg
      }
    } catch (error) {
      console.error('Mermaid rendering error:', error)
      // Show original content if rendering fails
      const encodedContent = container.getAttribute('data-content')
      if (encodedContent) {
        container.innerHTML = `<pre><code>${decodeURIComponent(encodedContent)}</code></pre>`
      }
    }
  })
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
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

/* Markdown styles */
.message-content :deep(h1) {
  @apply text-xl font-bold mb-4 mt-4 text-gray-900;
}

.message-content :deep(h2) {
  @apply text-lg font-semibold mb-3 mt-3 text-gray-900;
}

.message-content :deep(h3) {
  @apply text-base font-medium mb-2 mt-2 text-gray-900;
}

.message-content :deep(p) {
  @apply mb-3 text-gray-700;
}

.message-content :deep(ul), .message-content :deep(ol) {
  @apply mb-3 pl-5;
}

.message-content :deep(li) {
  @apply mb-1 text-gray-700;
}

.message-content :deep(table) {
  @apply w-full border-collapse border border-gray-300 mb-4;
}

.message-content :deep(th), .message-content :deep(td) {
  @apply border border-gray-300 px-3 py-2 text-left;
}

.message-content :deep(th) {
  @apply bg-gray-100 font-medium text-gray-900;
}

.message-content :deep(code) {
  @apply bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm;
}

.message-content :deep(pre) {
  @apply bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto mb-4;
}

.message-content :deep(pre code) {
  @apply bg-transparent p-0 text-sm;
}

.message-content :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4;
}

.message-content :deep(a) {
  @apply text-blue-600 hover:text-blue-800 underline;
}

/* Mermaid container styles */
.message-content :deep(.mermaid-container) {
  @apply bg-white border border-gray-200 rounded-lg p-4 mb-4 overflow-x-auto;
}

.message-content :deep(.mermaid-container svg) {
  @apply max-w-full;
}
</style>
