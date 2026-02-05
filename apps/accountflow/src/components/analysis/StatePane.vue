<template>
  <div class="card flex flex-col h-full">
    <!-- Header -->
    <div class="border-b pb-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">分析结果</h2>
          <p class="text-gray-600 text-sm">
            <template v-if="hasContent">
              已确认的会计科目、规则和流程图
            </template>
            <template v-else>
              暂无确认的分析结果
            </template>
          </p>
        </div>
        <button
          v-if="hasContent"
          @click="handleClear"
          :disabled="clearing"
          class="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 disabled:opacity-50"
          title="清空分析结果"
        >
          <svg v-if="clearing" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto space-y-6">
      <!-- Empty State -->
      <div v-if="!hasContent && !loading" class="flex flex-col items-center justify-center h-full text-gray-400">
        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
        </svg>
        <p class="text-center">
          与 AI 对话后，点击消息旁的<br>
          <span class="inline-flex items-center text-emerald-600">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            确认按钮
          </span>
          <br>将分析结果保存到此处
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Confirmed Content -->
      <template v-if="hasContent && !loading">
        <!-- Accounting Subjects -->
        <div v-if="data.subjects && data.subjects.length > 0">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            会计科目 ({{ data.subjects.length }})
          </h3>
          <AccountingSubjectList :subjects="data.subjects" />
        </div>

        <!-- Accounting Rules -->
        <div v-if="data.rules && data.rules.length > 0">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            会计规则 ({{ data.rules.length }})
          </h3>
          <div class="space-y-3">
            <AccountingRuleCard
              v-for="rule in data.rules"
              :key="rule.id"
              :rule="rule"
            />
          </div>
        </div>

        <!-- Flow Diagram -->
        <div v-if="data.diagramMermaid">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
            资金/信息流图
          </h3>
          <FlowDiagramViewer :mermaid-code="data.diagramMermaid" />
        </div>

        <!-- Confirmed At -->
        <div v-if="data.confirmedAt" class="text-xs text-gray-400 text-right pt-4 border-t">
          确认时间: {{ formatDate(data.confirmedAt) }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AccountingSubjectList from './AccountingSubjectList.vue'
import AccountingRuleCard from './AccountingRuleCard.vue'
import FlowDiagramViewer from './FlowDiagramViewer.vue'
import type { ConfirmedAnalysisState } from '../../composables/useConfirmedAnalysis'

const props = defineProps<{
  data: ConfirmedAnalysisState
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'clear'): void
}>()

const clearing = ref(false)

const hasContent = computed(() => {
  return (
    (props.data.subjects && props.data.subjects.length > 0) ||
    (props.data.rules && props.data.rules.length > 0) ||
    (props.data.diagramMermaid && props.data.diagramMermaid.trim().length > 0)
  )
})

async function handleClear() {
  if (!confirm('确定要清空所有已确认的分析结果吗？')) return

  clearing.value = true
  try {
    emit('clear')
  } finally {
    setTimeout(() => {
      clearing.value = false
    }, 500)
  }
}

function formatDate(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
