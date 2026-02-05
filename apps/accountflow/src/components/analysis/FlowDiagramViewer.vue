<template>
  <div class="flow-diagram-viewer">
    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-sm text-red-600">流程图渲染失败</p>
    </div>

    <!-- Container (always rendered to keep ref alive) -->
    <div
      v-else
      ref="diagramContainer"
      class="mermaid-container overflow-auto bg-white rounded-lg border border-gray-200 p-4 relative"
    >
      <!-- Loading Overlay -->
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps<{
  mermaidCode: string
}>()

const diagramContainer = ref<HTMLElement | null>(null)
const loading = ref(false)
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
  console.log('FlowDiagramViewer renderDiagram called:', {
    hasMermaidCode: !!props.mermaidCode,
    mermaidCodeLength: props.mermaidCode?.length,
    hasContainer: !!diagramContainer.value,
    isClient: typeof window !== 'undefined'
  })

  if (!props.mermaidCode || !diagramContainer.value || typeof window === 'undefined') {
    console.log('FlowDiagramViewer early return:', {
      reason: !props.mermaidCode ? 'no mermaid code' : !diagramContainer.value ? 'no container' : 'server side'
    })
    loading.value = false
    return
  }

  loading.value = true
  error.value = false

  try {
    await initMermaid()

    if (!mermaid) {
      console.error('FlowDiagramViewer: Mermaid failed to initialize')
      loading.value = false
      error.value = true
      return
    }

    // Clear previous content
    diagramContainer.value.innerHTML = ''

    // Generate unique ID for this render
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Render the diagram
    const result = await mermaid.render(id, props.mermaidCode)
    console.log('FlowDiagramViewer render result:', {
      hasResult: !!result,
      hasSvg: !!result?.svg,
      svgLength: result?.svg?.length,
      hasContainer: !!diagramContainer.value
    })

    if (diagramContainer.value && result.svg) {
      diagramContainer.value.innerHTML = result.svg
      console.log('FlowDiagramViewer: SVG successfully inserted')
    } else {
      console.error('FlowDiagramViewer: Failed to insert SVG', {
        hasContainer: !!diagramContainer.value,
        hasSvg: !!result?.svg
      })
      error.value = true
    }
  } catch (e) {
    console.error('Mermaid render error:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

// Wait for both mermaidCode and container to be ready
async function tryRender(attempt = 0): Promise<void> {
  const maxAttempts = 5

  if (props.mermaidCode && diagramContainer.value) {
    await renderDiagram()
  } else if (props.mermaidCode && attempt < maxAttempts) {
    console.log(`FlowDiagramViewer: Container not ready, attempt ${attempt + 1}/${maxAttempts}`)
    await new Promise(resolve => setTimeout(resolve, 50))
    await tryRender(attempt + 1)
  } else if (attempt >= maxAttempts) {
    console.error('FlowDiagramViewer: Container never became ready after', maxAttempts, 'attempts')
    loading.value = false
    error.value = true
  } else {
    // No mermaid code, just set loading to false
    loading.value = false
  }
}

onMounted(async () => {
  await nextTick()
  await tryRender()
})

watch(() => props.mermaidCode, async () => {
  await nextTick()
  await tryRender()
})
</script>

<style scoped>
.mermaid-container {
  min-height: 200px;
}

.mermaid-container :deep(svg) {
  max-width: 100%;
  height: auto;
}

.flow-diagram-viewer {
  position: relative;
}
</style>
