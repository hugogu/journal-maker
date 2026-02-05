<template>
  <div class="container mx-auto p-6 h-full">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">加载场景中...</p>
      </div>
    </div>

    <!-- Dual-pane layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <!-- Left Pane: Chat -->
      <ChatPane
        :scenario="scenario"
        :scenario-id="scenarioId"
        @confirm="handleConfirm"
        @show-share="showShareModal = true"
        @show-log="showLog"
        @show-stats="showStats"
      />

      <!-- Right Pane: Confirmed Analysis State -->
      <StatePane
        :data="confirmedAnalysis.data.value"
        :loading="confirmedAnalysis.loading.value"
        @clear="handleClear"
      />
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
        <ShareManager :scenario-id="scenarioIdNum" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ChatPane from '../../../components/analysis/ChatPane.vue'
import StatePane from '../../../components/analysis/StatePane.vue'
import RequestLogViewer from '../../../components/conversation/RequestLogViewer.vue'
import ResponseStatsViewer from '../../../components/conversation/ResponseStatsViewer.vue'
import ShareManager from '../../../components/conversation/ShareManager.vue'
import { useConfirmedAnalysis } from '../../../composables/useConfirmedAnalysis'
import type { ParsedAnalysis } from '../../../types'

const route = useRoute()
const scenarioId = route.params.id as string
const scenarioIdNum = parseInt(scenarioId, 10)

const loading = ref(true)
const scenario = ref<any>(null)

// Modal state
const showLogModal = ref(false)
const showStatsModal = ref(false)
const showShareModal = ref(false)
const selectedMessageId = ref<number | null>(null)

// Use the confirmed analysis composable
const confirmedAnalysis = useConfirmedAnalysis(scenarioIdNum)

onMounted(async () => {
  // Load scenario details
  const response = await $fetch<{ success: boolean; data: any }>(`/api/scenarios/${scenarioId}`)
  if (response.success) {
    scenario.value = response.data
  }

  // Load existing confirmed analysis
  await confirmedAnalysis.load()

  loading.value = false
})

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

async function handleConfirm(data: { parsed: ParsedAnalysis; messageId?: number }) {
  console.log('=== CONFIRM CLICKED ===')
  console.log('Parsed analysis data:', {
    subjects: data.parsed.subjects,
    rules: data.parsed.rules,
    diagramsCount: data.parsed.diagrams.length,
    diagrams: data.parsed.diagrams,
    messageId: data.messageId
  })

  // Prioritize LR (funds/information flow) diagram over TD (business process flow)
  // LR diagrams are typically the second one, so we search for it specifically
  let selectedDiagram = data.parsed.diagrams.length > 0 ? data.parsed.diagrams[0] : null
  const lrDiagram = data.parsed.diagrams.find(d => d.includes('flowchart LR') || d.includes('flowchart RL'))
  if (lrDiagram) {
    selectedDiagram = lrDiagram
    console.log('Found LR diagram, using it instead')
  }

  console.log('Saving with diagramMermaid:', selectedDiagram ? selectedDiagram.substring(0, 100) + '...' : 'null')

  const success = await confirmedAnalysis.save({
    subjects: data.parsed.subjects,
    rules: data.parsed.rules,
    diagramMermaid: selectedDiagram,
    sourceMessageId: data.messageId ?? null,
  })

  if (!success) {
    alert('保存分析结果失败，请重试')
  } else {
    console.log('=== SAVE SUCCESSFUL ===')
    console.log('Confirmed data from composable:', {
      id: confirmedAnalysis.data.value.id,
      subjects: confirmedAnalysis.data.value.subjects?.length || 0,
      rules: confirmedAnalysis.data.value.rules?.length || 0,
      hasDiagram: !!confirmedAnalysis.data.value.diagramMermaid,
      diagramLength: confirmedAnalysis.data.value.diagramMermaid?.length,
      diagramPreview: confirmedAnalysis.data.value.diagramMermaid?.substring(0, 100) + '...'
    })
  }
}

async function handleClear() {
  const success = await confirmedAnalysis.clear()

  if (!success) {
    alert('清空分析结果失败，请重试')
  }
}
</script>
