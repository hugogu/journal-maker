<template>
  <div class="flow-diagram-viewer">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-600 mb-2">流程图渲染失败</p>
      <details class="text-xs text-gray-500">
        <summary class="cursor-pointer hover:text-gray-700">查看原始代码</summary>
        <pre class="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">{{ mermaidCode }}</pre>
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
import mermaid from 'mermaid'

const props = defineProps<{
  mermaidCode: string
}>()

const diagramContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref(false)

let mermaidInitialized = false

function initMermaid() {
  if (mermaidInitialized) return

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
  if (!props.mermaidCode || !diagramContainer.value) return

  loading.value = true
  error.value = false

  try {
    initMermaid()

    // Clear previous content
    diagramContainer.value.innerHTML = ''

    // Generate unique ID for this render
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Render the diagram
    const { svg } = await mermaid.render(id, props.mermaidCode)

    if (diagramContainer.value) {
      diagramContainer.value.innerHTML = svg
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
  renderDiagram()
})

watch(() => props.mermaidCode, async () => {
  await nextTick()
  renderDiagram()
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
