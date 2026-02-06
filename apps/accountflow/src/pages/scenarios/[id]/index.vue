<template>
  <div v-if="scenario" class="max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">{{ scenario.name }}</h1>
      <p class="text-gray-600 mt-2">{{ scenario.description || '暂无描述' }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="card text-center">
        <p class="text-sm text-gray-600">状态</p>
        <p class="text-lg font-semibold mt-1">{{ statusText(scenario.status) }}</p>
      </div>
      <div class="card text-center">
        <p class="text-sm text-gray-600">类型</p>
        <p class="text-lg font-semibold mt-1">{{ scenario.isTemplate ? '模板' : '普通场景' }}</p>
      </div>
      <div class="card text-center">
        <p class="text-sm text-gray-600">创建时间</p>
        <p class="text-lg font-semibold mt-1">{{ formatDate(scenario.createdAt) }}</p>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">快捷操作</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NuxtLink :to="`/scenarios/${scenario.id}/analyze`" class="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors">
          <p class="font-medium text-blue-900">AI 分析</p>
          <p class="text-sm text-blue-700 mt-1">与AI对话分析场景</p>
        </NuxtLink>
        <NuxtLink :to="`/scenarios/${scenario.id}/transactions`" class="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
          <p class="font-medium text-green-900">示例交易</p>
          <p class="text-sm text-green-700 mt-1">查看示例记账数据</p>
        </NuxtLink>
        <button class="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors" @click="exportData('json')">
          <p class="font-medium text-purple-900">导出数据</p>
          <p class="text-sm text-purple-700 mt-1">下载分析结果</p>
        </button>
        <button 
          v-if="scenario.status === 'draft'" 
          class="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors"
          @click="confirmScenario"
        >
          <p class="font-medium text-orange-900">确认场景</p>
          <p class="text-sm text-orange-700 mt-1">标记为已确认</p>
        </button>
      </div>
    </div>

    <!-- Accounting Events Section -->
    <div v-if="accountingEvents.events.value.length > 0" class="mt-6">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">会计事件</h2>
          <span class="text-sm text-gray-400">{{ accountingEvents.events.value.length }} 个事件</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="evt in accountingEvents.events.value"
            :key="evt.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <!-- Inline edit for event name -->
                <div v-if="editingEventId === evt.id" class="space-y-2">
                  <input
                    v-model="editEventName"
                    class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="事件名称"
                    @keyup.enter="saveEventEdit(evt.id)"
                    @keyup.escape="cancelEventEdit"
                  />
                  <input
                    v-model="editEventDescription"
                    class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="事件描述（可选）"
                    @keyup.enter="saveEventEdit(evt.id)"
                    @keyup.escape="cancelEventEdit"
                  />
                  <div class="flex gap-2">
                    <button @click="saveEventEdit(evt.id)" class="text-xs text-blue-600 hover:text-blue-700">保存</button>
                    <button @click="cancelEventEdit" class="text-xs text-gray-400 hover:text-gray-500">取消</button>
                  </div>
                </div>
                <template v-else>
                  <h3 class="font-medium text-gray-900 truncate">{{ evt.eventName }}</h3>
                  <p v-if="evt.description" class="text-sm text-gray-500 mt-1 line-clamp-2">{{ evt.description }}</p>
                </template>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span v-if="evt.eventType" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{{ evt.eventType }}</span>
                <span class="text-xs text-gray-400">{{ evt.ruleCount }} 规则 · {{ evt.entryCount }} 分录</span>
                <button
                  v-if="editingEventId !== evt.id"
                  @click="startEventEdit(evt)"
                  class="text-gray-400 hover:text-blue-600 p-1"
                  title="编辑事件"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Merge action -->
            <div v-if="mergeSourceId === evt.id" class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-xs text-gray-500 mb-2">选择合并目标事件：</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="target in accountingEvents.events.value.filter(e => e.id !== evt.id)"
                  :key="target.id"
                  @click="executeMerge(evt.id, target.id)"
                  class="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
                >
                  → {{ target.eventName }}
                </button>
                <button @click="mergeSourceId = null" class="text-xs px-2 py-1 text-gray-400 hover:text-gray-500">取消</button>
              </div>
            </div>
            <div v-else-if="accountingEvents.events.value.length > 1" class="mt-2">
              <button
                @click="mergeSourceId = evt.id"
                class="text-xs text-gray-400 hover:text-orange-600 transition-colors"
              >
                合并到其他事件…
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmed Analysis Section -->
    <div v-if="hasConfirmedAnalysis" class="mt-6">
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">已确认的分析结果</h2>

        <!-- Accounting Subjects -->
        <div v-if="confirmedAnalysis.data.value.subjects && confirmedAnalysis.data.value.subjects.length > 0" class="mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            会计科目 ({{ confirmedAnalysis.data.value.subjects.length }})
          </h3>
          <AccountingSubjectList :subjects="subjectsWithStatus" />
        </div>

        <!-- Accounting Rules -->
        <div v-if="confirmedAnalysis.data.value.rules && confirmedAnalysis.data.value.rules.length > 0" class="mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            会计规则 ({{ confirmedAnalysis.data.value.rules.length }})
          </h3>
          <div class="space-y-3">
            <AccountingRuleCard
              v-for="rule in confirmedAnalysis.data.value.rules"
              :key="rule.id"
              :rule="rule"
            />
          </div>
        </div>

        <!-- Flow Diagram -->
        <div v-if="confirmedAnalysis.data.value.diagramMermaid">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
            资金/信息流图
          </h3>
          <FlowDiagramViewer :mermaid-code="confirmedAnalysis.data.value.diagramMermaid" />
        </div>

        <!-- Empty State -->
        <div v-if="!confirmedAnalysis.data.value.subjects?.length && !confirmedAnalysis.data.value.rules?.length && !confirmedAnalysis.data.value.diagramMermaid" class="text-center py-8 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
          <p>暂无已确认的分析结果</p>
          <p class="text-sm mt-2">前往 <NuxtLink :to="`/scenarios/${scenario.id}/analyze`" class="text-blue-600 hover:underline">AI 分析</NuxtLink> 页面与 AI 对话并确认分析结果</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <p class="text-gray-500">加载中...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirmedAnalysis } from '../../../composables/useConfirmedAnalysis'
import { useAccountingEvents } from '../../../composables/useAccountingEvents'
import AccountingSubjectList from '../../../components/analysis/AccountingSubjectList.vue'
import AccountingRuleCard from '../../../components/analysis/AccountingRuleCard.vue'
import FlowDiagramViewer from '../../../components/analysis/FlowDiagramViewer.vue'
import type { Account } from '../../../types'

interface Scenario {
  id: number
  name: string
  description?: string
  status: string
  isTemplate?: boolean
  createdAt: string
}

const route = useRoute()
const router = useRouter()
const scenario = ref<Scenario | null>(null)
const scenarioId = parseInt(route.params.id as string, 10)

// Load confirmed analysis
const confirmedAnalysis = useConfirmedAnalysis(scenarioId)
const accountingEvents = useAccountingEvents(scenarioId)
const existingAccounts = ref<Account[]>([])

// Event editing state
const editingEventId = ref<number | null>(null)
const editEventName = ref('')
const editEventDescription = ref('')
const mergeSourceId = ref<number | null>(null)

// Check if there's any confirmed analysis
const hasConfirmedAnalysis = computed(() => {
  return !confirmedAnalysis.loading.value && (
    (confirmedAnalysis.data.value.subjects && confirmedAnalysis.data.value.subjects.length > 0) ||
    (confirmedAnalysis.data.value.rules && confirmedAnalysis.data.value.rules.length > 0) ||
    !!confirmedAnalysis.data.value.diagramMermaid
  )
})

// Compute subjects with status
const subjectsWithStatus = computed(() => {
  if (!confirmedAnalysis.data.value.subjects) return []

  return confirmedAnalysis.data.value.subjects.map(subject => {
    const existing = existingAccounts.value.find(
      account => account.code === subject.code
    )
    return {
      ...subject,
      isExisting: !!existing,
      existingAccount: existing
    }
  })
})

// Load existing accounts
async function loadExistingAccounts() {
  try {
    const response = await $fetch<{ success: boolean; data: Account[] }>('/api/accounts')
    if (response.success) {
      existingAccounts.value = response.data
    }
  } catch (error) {
    console.error('Failed to load existing accounts:', error)
  }
}

onMounted(async () => {
  const response = await $fetch<{ success: boolean; data: Scenario }>(`/api/scenarios/${route.params.id}`)
  if (response.success) {
    scenario.value = response.data
  }

  // Load confirmed analysis, existing accounts, and events
  await Promise.all([
    confirmedAnalysis.load(),
    loadExistingAccounts(),
    accountingEvents.list()
  ])
})

function startEventEdit(evt: { id: number; eventName: string; description: string | null }) {
  editingEventId.value = evt.id
  editEventName.value = evt.eventName
  editEventDescription.value = evt.description || ''
}

function cancelEventEdit() {
  editingEventId.value = null
  editEventName.value = ''
  editEventDescription.value = ''
}

async function saveEventEdit(eventId: number) {
  if (!editEventName.value.trim()) return
  const success = await accountingEvents.update(eventId, {
    eventName: editEventName.value.trim(),
    description: editEventDescription.value.trim() || null,
  })
  if (success) {
    cancelEventEdit()
    await accountingEvents.list()
  }
}

async function executeMerge(sourceId: number, targetId: number) {
  if (!confirm('确定要将此事件合并到目标事件吗？所有关联的规则和分录将被移动到目标事件。')) return
  await accountingEvents.merge(sourceId, targetId)
  mergeSourceId.value = null
}

function statusText(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    confirmed: '已确认',
    archived: '已归档'
  }
  return map[status] || status
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('zh-CN')
}

async function confirmScenario() {
  if (!scenario.value) return
  
  try {
    await $fetch(`/api/scenarios/${route.params.id}/confirm`, {
      method: 'POST'
    })
    scenario.value.status = 'confirmed'
    alert('场景已确认')
  } catch (e) {
    console.error('Failed to confirm scenario:', e)
    alert('操作失败')
  }
}

function exportData(format: string) {
  const url = `/api/scenarios/${route.params.id}/export?format=${format}`
  window.open(url, '_blank')
}
</script>
