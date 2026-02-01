<template>
  <div class="h-[calc(100vh-8rem)]">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <p class="text-gray-500">加载中...</p>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <!-- Chat Section -->
      <div class="card flex flex-col h-full">
        <div class="border-b pb-4 mb-4">
          <h2 class="text-lg font-semibold">{{ scenario?.name }}</h2>
          <p class="text-gray-600 text-sm">{{ scenario?.description }}</p>
        </div>
        
        <div ref="messagesContainer" class="flex-1 overflow-y-auto space-y-4 mb-4">
          <div 
            v-for="(message, idx) in messages" 
            :key="idx"
            :class="message.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-100'"
            class="max-w-[80%] rounded-lg p-3"
          >
            <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
            <div v-if="message.structured?.flowchart" class="mt-3">
              <p class="text-xs opacity-75 mb-2">流程图已更新</p>
            </div>
          </div>
          <div v-if="streaming" class="bg-gray-100 rounded-lg p-3 max-w-[80%]">
            <p class="text-sm">AI 正在思考...</p>
          </div>
        </div>
        
        <form @submit.prevent="sendMessage" class="flex gap-2">
          <textarea 
            v-model="inputMessage" 
            rows="2"
            class="input flex-1 resize-none"
            placeholder="描述业务场景细节..."
            @keydown.enter.prevent="sendMessage"
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
      
      <!-- Visualization Section -->
      <div class="card flex flex-col h-full">
        <h2 class="text-lg font-semibold mb-4">流程图</h2>
        <div class="flex-1 bg-gray-50 rounded-lg p-4 overflow-auto">
          <div v-if="flowchartCode" class="mermaid" v-html="renderedFlowchart" />
          <div v-else class="text-center text-gray-400 py-12">
            开始对话后，AI 将生成流程图
          </div>
        </div>
        
        <div class="border-t pt-4 mt-4">
          <h3 class="font-medium mb-2">建议科目</h3>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="account in suggestedAccounts" 
              :key="account.code"
              class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
            >
              {{ account.code }} {{ account.name }}
            </span>
            <span v-if="suggestedAccounts.length === 0" class="text-gray-400 text-sm">
              暂无建议
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import mermaid from 'mermaid'

const route = useRoute()
const scenarioId = route.params.id as string

const loading = ref(true)
const scenario = ref(null)
const messages = ref([])
const inputMessage = ref('')
const streaming = ref(false)
const messagesContainer = ref<HTMLElement>()
const flowchartCode = ref('')
const renderedFlowchart = ref('')
const suggestedAccounts = ref([])

onMounted(async () => {
  mermaid.initialize({ startOnLoad: false })
  
  // Load scenario
  const response = await $fetch(`/api/scenarios/${scenarioId}`)
  if (response.success) {
    scenario.value = response.data
  }
  loading.value = false
})

watch(flowchartCode, async (code) => {
  if (code) {
    try {
      const { svg } = await mermaid.render('flowchart', code)
      renderedFlowchart.value = svg
    } catch (e) {
      console.error('Mermaid render error:', e)
    }
  }
})

async function sendMessage() {
  if (!inputMessage.value.trim()) return
  
  const userMessage = inputMessage.value
  messages.value.push({ role: 'user', content: userMessage })
  inputMessage.value = ''
  streaming.value = true
  
  await nextTick()
  scrollToBottom()
  
  try {
    const response = await $fetch(`/api/scenarios/${scenarioId}/chat`, {
      method: 'POST',
      body: { content: userMessage },
    })
    
    if (response.success) {
      messages.value.push({
        role: 'assistant',
        content: response.data.message,
        structured: response.data.structured,
      })
      
      if (response.data.structured?.flowchart) {
        flowchartCode.value = generateMermaidCode(response.data.structured.flowchart)
      }
      
      if (response.data.structured?.accounts) {
        suggestedAccounts.value = response.data.structured.accounts
      }
    }
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，处理请求时出错。请稍后重试。',
    })
  } finally {
    streaming.value = false
    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function generateMermaidCode(flowchart: any) {
  let code = 'graph TD\n'
  flowchart.nodes.forEach((node: any) => {
    // Quote node ID to avoid reserved keyword conflicts (end, start, etc.)
    const nodeId = `"${node.id}"`
    if (node.type === 'decision') {
      code += `    ${nodeId}{{"${node.label}"}}\n`
    } else {
      code += `    ${nodeId}["${node.label}"]\n`
    }
  })
  flowchart.edges.forEach((edge: any) => {
    const fromId = `"${edge.from}"`
    const toId = `"${edge.to}"`
    code += `    ${fromId} -->${edge.label ? `|"${edge.label}"|` : ''} ${toId}\n`
  })
  return code
}
</script>
