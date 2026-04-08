<template>
  <div class="w-full h-full px-4 py-3 mx-auto" style="max-width: 1920px;">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">加载场景中...</p>
      </div>
    </div>

    <!-- Content when not loading -->
    <div v-else class="flex flex-col h-full">
      <!-- System Selector Header -->
      <div class="mb-4 flex items-center justify-between bg-white rounded-lg shadow p-4">
        <div class="flex items-center gap-4">
          <h2 class="text-lg font-semibold text-gray-900">{{ scenario?.name }}</h2>
          <SystemIndicator
            v-if="selectedSystem"
            :system-name="selectedSystem.name"
            show-change-button
            @change="showSystemSwitcher = true"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">会计体系:</span>
          <SystemSelector
            v-model="selectedSystem"
            :systems="systems"
            :loading="systemsLoading"
            class="w-64"
          />
        </div>
      </div>

      <!-- Dual-pane layout with better proportions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1" style="height: calc(100% - 80px);">
        <!-- Left Pane: Chat (2/3 width) -->
        <ChatPane
          :scenario="scenario"
          :scenario-id="scenarioId"
          :system-id="selectedSystem?.id"
          @confirm="handleConfirm"
          @show-share="showShareModal = true"
          @show-log="showLog"
          @show-stats="showStats"
          class="lg:col-span-2"
        />

        <!-- Right Pane: Confirmed Analysis State (1/3 width) -->
        <StatePane
          :data="confirmedAnalysis.data.value"
          :loading="confirmedAnalysis.loading.value"
          :scenario-id="scenarioIdNum"
          :source-message-id="confirmedAnalysis.data.value?.sourceMessageId"
          @clear="handleClear"
        />
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

    <!-- System Switcher Modal -->
    <div v-if="showSystemSwitcher" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-lg w-full">
        <SystemSwitcher
          :systems="systems"
          :current-system-id="selectedSystem?.id"
          :loading="systemsLoading"
          @close="showSystemSwitcher = false"
          @switch="handleSystemSwitch"
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
import SystemIndicator from '../../../components/analysis/SystemIndicator.vue'
import SystemSelector from '../../../components/accounting/SystemSelector.vue'
import SystemSwitcher from '../../../components/analysis/SystemSwitcher.vue'
import RequestLogViewer from '../../../components/conversation/RequestLogViewer.vue'
import ResponseStatsViewer from '../../../components/conversation/ResponseStatsViewer.vue'
import ShareManager from '../../../components/conversation/ShareManager.vue'
import { useConfirmedAnalysis } from '../../../composables/useConfirmedAnalysis'
import { useSystems } from '../../../composables/useSystems'
import { useToast } from '../../../composables/useToast'
import type { ParsedAnalysis, AccountingSystem } from '../../../types'

const toast = useToast()

const route = useRoute()
const scenarioId = route.params.id as string
const scenarioIdNum = parseInt(scenarioId, 10)

const loading = ref(true)
const scenario = ref<any>(null)

// System state
const { systems, loading: systemsLoading, fetchSystems } = useSystems()
const selectedSystem = ref<AccountingSystem | null>(null)
const showSystemSwitcher = ref(false)

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

  // Load systems and select first active one
  await fetchSystems({ status: 'active' })
  if (systems.value.length > 0) {
    selectedSystem.value = systems.value[0]
  }

  // Load existing confirmed analysis
  await confirmedAnalysis.load()

  loading.value = false
})

function handleSystemSwitch(system: AccountingSystem) {
  selectedSystem.value = system
  showSystemSwitcher.value = false
  toast.success(`已切换到 ${system.name}`)
}

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
  // Prioritize LR (funds/information flow) diagram over TD (business process flow)
  // LR diagrams are typically the second one, so we search for it specifically
  let selectedDiagram = data.parsed.diagrams.length > 0 ? data.parsed.diagrams[0] : null
  const lrDiagram = data.parsed.diagrams.find(d => d.includes('flowchart LR') || d.includes('flowchart RL'))
  if (lrDiagram) {
    selectedDiagram = lrDiagram
  }

  const success = await confirmedAnalysis.save({
    subjects: data.parsed.subjects,
    rules: data.parsed.rules,
    diagramMermaid: selectedDiagram,
    sourceMessageId: data.messageId ?? null,
    systemId: selectedSystem.value?.id
  })

  if (!success) {
    toast.error('保存分析结果失败，请重试')
  } else {
    toast.success('分析结果已保存')
  }
}

async function handleClear() {
  const success = await confirmedAnalysis.clear()

  if (!success) {
    toast.error('清空分析结果失败，请重试')
  } else {
    toast.success('分析结果已清空')
  }
}
</script>
