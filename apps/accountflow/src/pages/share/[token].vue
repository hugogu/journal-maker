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
          :key="message.id || index"
          class="mb-4"
        >
          <div :class="message.role === 'user' ? 'user-message' : 'assistant-message'">
            <div class="flex items-center mb-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                   :class="message.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'">
                {{ message.role === 'user' ? '你' : 'AI' }}
              </div>
              <div class="font-medium text-sm">
                {{ message.role === 'user' ? '用户' : 'AI助手' }}
              </div>
            </div>
            <div class="message-content markdown-content" v-html="renderMarkdown(message.content)"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'

const route = useRoute()
const token = route.params.token as string

const loading = ref(true)
const error = ref('')
const sharedData = ref<any>(null)

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
    const diagramId = `mermaid-${Date.now()}-${idx}`
    const encodedContent = encodeURIComponent(token.content)
    return `<div class="mermaid-container" id="${diagramId}" data-content="${encodedContent}"></div>`
  }
  
  return defaultRender(tokens, idx, options, env, renderer)
}

onMounted(async () => {
  try {
    const response = await fetch(`/api/shares/${token}`)
    const data = await response.json()
    console.log('Share API response:', data)
    
    if (data.success && data.data) {
      sharedData.value = data.data
      // Render mermaid diagrams after data loads
      await nextTick()
      setTimeout(() => {
        renderMermaidDiagrams()
      }, 100)
    } else {
      error.value = typeof data.error === 'string' ? data.error : '加载失败'
    }
  } catch (e) {
    console.error('Share page error:', e)
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

function renderMermaidDiagrams() {
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
  
  const containers = document.querySelectorAll('.mermaid-container')
  console.log(`Found ${containers.length} mermaid containers`)
  
  containers.forEach(async (container, index) => {
    try {
      const encodedContent = container.getAttribute('data-content')
      if (!encodedContent) return
      
      let content = decodeURIComponent(encodedContent)
      if (!content.trim()) return
      
      // Sanitize: Replace parentheses within square brackets (node labels) with #40; and #41;
      // This preserves Mermaid syntax while handling Chinese text with parentheses
      content = content.replace(/\[([^\]]*)\]/g, (match, label) => {
        const sanitized = label.replace(/\(/g, '#40;').replace(/\)/g, '#41;')
        return `[${sanitized}]`
      })
      
      const diagramId = `mermaid-${Date.now()}-${index}`
      const { svg } = await mermaid.render(diagramId, content.trim())
      container.innerHTML = svg
      console.log(`Diagram ${diagramId} rendered successfully`)
    } catch (error) {
      console.error(`Mermaid rendering error for container ${index}:`, error)
      const encodedContent = container.getAttribute('data-content')
      if (encodedContent) {
        // SECURITY: Create elements safely to prevent XSS
        const errorDiv = document.createElement('div')
        errorDiv.className = 'text-red-500 text-sm'
        errorDiv.textContent = '图表渲染失败'

        const pre = document.createElement('pre')
        pre.className = 'bg-gray-100 p-2 mt-2 text-xs overflow-x-auto'
        const code = document.createElement('code')
        code.textContent = decodeURIComponent(encodedContent) // textContent auto-escapes
        pre.appendChild(code)

        container.innerHTML = ''
        container.appendChild(errorDiv)
        container.appendChild(pre)
      }
    }
  })
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
</style>
