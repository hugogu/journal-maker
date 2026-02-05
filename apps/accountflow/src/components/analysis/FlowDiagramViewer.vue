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
      style="min-height: 300px"
    >
      <!-- Loading Overlay -->
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>

      <!-- Expand Button -->
      <button
        v-if="!loading && mermaidCode"
        @click="showExpanded = true"
        class="absolute top-2 right-2 bg-white/90 hover:bg-white border border-gray-300 rounded-lg p-2 shadow-sm hover:shadow-md transition-all"
        title="放大查看"
      >
        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
          ></path>
        </svg>
      </button>
    </div>

    <!-- Expanded Modal -->
    <div
      v-if="showExpanded"
      class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-semibold">资金/信息流图</h3>
          <button
            @click="showExpanded = false"
            class="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div class="p-6 overflow-auto" style="max-height: calc(90vh - 80px)">
          <div ref="expandedContainer" class="bg-white rounded-lg border border-gray-200 p-4">
            <!-- Expanded diagram will be rendered here -->
          </div>
        </div>
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
  const expandedContainer = ref<HTMLElement | null>(null)
  const loading = ref(false)
  const error = ref(false)
  const showExpanded = ref(false)

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
      loading.value = false
      return
    }

    loading.value = true
    error.value = false

    try {
      await initMermaid()

      if (!mermaid) {
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

      if (diagramContainer.value && result.svg) {
        diagramContainer.value.innerHTML = result.svg
      } else {
        error.value = true
      }
    } catch (e) {
      console.error('Mermaid render error:', e)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  // Render diagram in expanded modal
  async function renderExpandedDiagram() {
    if (!props.mermaidCode || !expandedContainer.value) return

    try {
      await initMermaid()

      if (!mermaid) return

      // Clear previous content
      expandedContainer.value.innerHTML = ''

      // Generate unique ID for expanded render
      const id = `mermaid-expanded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Render the diagram
      const result = await mermaid.render(id, props.mermaidCode)

      if (expandedContainer.value && result.svg) {
        expandedContainer.value.innerHTML = result.svg
      }
    } catch (e) {
      console.error('Expanded mermaid render error:', e)
    }
  }

  // Wait for both mermaidCode and container to be ready
  async function tryRender(attempt = 0): Promise<void> {
    const maxAttempts = 5

    if (props.mermaidCode && diagramContainer.value) {
      await renderDiagram()
    } else if (props.mermaidCode && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      await tryRender(attempt + 1)
    } else if (attempt >= maxAttempts) {
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

  watch(
    () => props.mermaidCode,
    async () => {
      await nextTick()
      await tryRender()
    }
  )

  // Watch for modal opening to render expanded diagram
  watch(
    () => showExpanded.value,
    async (newValue) => {
      if (newValue) {
        await nextTick()
        setTimeout(() => {
          renderExpandedDiagram()
        }, 100)
      }
    }
  )
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

  /* Expanded modal styles */
  .expanded-container :deep(svg) {
    max-width: 100%;
    height: auto;
    min-width: 800px;
  }
</style>
