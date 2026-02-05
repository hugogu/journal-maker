<template>
  <div class="flow-diagram-viewer">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
    </div>

    <!-- Error or Empty State -->
    <div v-else-if="error || !mermaidCode" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-600 mb-2">流程图渲染失败或代码为空</p>
      <details class="text-xs text-gray-500" open>
        <summary class="cursor-pointer hover:text-gray-700">查看原始代码</summary>
        <pre class="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">{{ mermaidCode || '无代码' }}</pre>
      </details>
    </div>

    <!-- Rendered Diagram -->
    <div
      v-else
      ref="diagramContainer"
      class="mermaid-container overflow-auto bg-white rounded-lg border border-gray-200 p-4"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps<{
  mermaidCode: string
}>()

const diagramContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref(false)

let mermaidInitialized = false
let mermaid: any = null

async function initMermaid() {
  if (mermaidInitialized || typeof window === 'undefined') return

  // Dynamic import for client-side only
  const mermaidModule = await import('mermaid')
  mermaid = mermaidModule.default

  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
  })
  mermaidInitialized = true
}

async function renderDiagram() {
  if (!props.mermaidCode || !diagramContainer.value || typeof window === 'undefined') {
    console.log('Mermaid: Early exit - missing code or container', {
      hasCode: !!props.mermaidCode,
      hasContainer: !!diagramContainer.value,
      hasWindow: typeof window !== 'undefined'
    })
    loading.value = false
    return
  }

  loading.value = true
  error.value = false

  console.log('Mermaid: Starting render with code:', props.mermaidCode.substring(0, 100) + '...')

  try {
    await initMermaid()

    if (!mermaid) {
      console.error('Mermaid: Failed to initialize mermaid library')
      loading.value = false
      error.value = true
      return
    }

    // Clear previous content
    diagramContainer.value.innerHTML = ''

    // Generate unique ID for this render
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log('Mermaid: Calling render with id:', id)

    // Render the diagram
    const result = await mermaid.render(id, props.mermaidCode)
    
    console.log('Mermaid: Render result:', {
      hasSvg: !!result.svg,
      svgLength: result.svg?.length,
      hasBindFunctions: !!result.bindFunctions
    })

    if (diagramContainer.value && result.svg) {
      diagramContainer.value.innerHTML = result.svg
      console.log('Mermaid: SVG injected successfully')
    } else {
      console.error('Mermaid: No SVG returned or container missing')
      error.value = true
    }
  } catch (e) {
    console.error('Mermaid render error:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await nextTick()
  // Delay slightly to ensure container is fully rendered
  setTimeout(() => {
    renderDiagram()
  }, 100)
})

watch(() => props.mermaidCode, async () => {
  await nextTick()
  // Delay to ensure DOM update is complete
  setTimeout(() => {
    renderDiagram()
  }, 100)
})
</script>

<style scoped>
.mermaid-container {
  min-height: 100px;
}

.mermaid-container :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
