<template>
  <div class="system-comparison">
    <!-- Loading State -->
    <div v-if="isLoading" class="comparison-loading">
      <div class="comparison-loading__spinner"></div>
      <p>正在比较体系差异...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="comparison-error">
      <Icon name="error" class="w-8 h-8 mb-2" />
      <p>{{ error }}</p>
    </div>

    <!-- Comparison Results -->
    <div v-else-if="result && systems.length > 0" class="comparison-results">
      <!-- Summary Header -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">
          体系对比结果
          <span v-if="hasDifferences" class="diff-status diff-status--modified ml-2">
            发现 {{ summary.totalDifferences }} 处差异
          </span>
          <span v-else class="diff-status diff-status--identical ml-2">
            完全一致
          </span>
        </h3>

        <!-- Difference Summary -->
        <div v-if="hasDifferences" class="diff-summary">
          <div class="diff-summary__item">
            <span class="diff-summary__value text-red-600">{{ summary.accountDifferences }}</span>
            <span class="diff-summary__label">科目差异</span>
          </div>
          <div class="diff-summary__item">
            <span class="diff-summary__value text-orange-600">{{ summary.amountDifferences }}</span>
            <span class="diff-summary__label">金额差异</span>
          </div>
          <div class="diff-summary__item">
            <span class="diff-summary__value text-blue-600">{{ summary.timingDifferences }}</span>
            <span class="diff-summary__label">时点差异</span>
          </div>
          <div class="diff-summary__item">
            <span class="diff-summary__value text-purple-600">{{ summary.ruleDifferences }}</span>
            <span class="diff-summary__label">规则差异</span>
          </div>
        </div>
      </div>

      <!-- Systems Grid -->
      <div class="comparison-grid" :class="`comparison-grid--${systems.length}`">
        <div
          v-for="system in systems"
          :key="system.systemId"
          class="comparison-card"
        >
          <div class="comparison-card__header">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="comparison-card__title">{{ system.systemName }}</h4>
                <span
                  class="system-indicator mt-1"
                  :class="system.systemType === 'builtin' ? 'system-indicator--builtin' : 'system-indicator--custom'"
                >
                  {{ system.systemType === 'builtin' ? '内置' : '自定义' }}
                </span>
              </div>
              <span
                v-if="system.status === 'completed'"
                class="diff-status diff-status--identical"
              >
                已分析
              </span>
              <span v-else class="diff-status diff-status--removed">
                未分析
              </span>
            </div>
          </div>

          <div class="comparison-card__body">
            <!-- Subjects -->
            <div v-if="system.subjects.length > 0" class="mb-4">
              <h5 class="text-sm font-medium text-gray-700 mb-2">会计科目</h5>
              <div class="space-y-1">
                <div
                  v-for="subject in system.subjects.slice(0, 5)"
                  :key="subject.code"
                  class="text-sm text-gray-600"
                >
                  {{ subject.code }} - {{ subject.name }}
                </div>
                <div v-if="system.subjects.length > 5" class="text-xs text-gray-500">
                  还有 {{ system.subjects.length - 5 }} 个科目...
                </div>
              </div>
            </div>

            <!-- Entries Summary -->
            <div v-if="system.entries.length > 0" class="mb-4">
              <h5 class="text-sm font-medium text-gray-700 mb-2">分录条目</h5>
              <p class="text-sm text-gray-600">
                共 {{ system.entries.length }} 条分录
              </p>
            </div>

            <!-- Flowchart -->
            <div v-if="system.flowchart">
              <h5 class="text-sm font-medium text-gray-700 mb-2">流程图</h5>
              <div class="text-sm text-green-600">
                <Icon name="check" class="w-4 h-4 inline mr-1" />
                已生成
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Differences List -->
      <div v-if="differences.length > 0" class="mt-8">
        <h4 class="text-lg font-semibold mb-4">差异详情</h4>
        <div class="bg-white rounded-lg border border-gray-200">
          <ul class="diff-list">
            <li
              v-for="(diff, index) in differences.slice(0, 10)"
              :key="index"
              class="diff-list__item"
            >
              <div class="diff-list__header">
                <span
                  class="diff-list__type"
                  :class="`diff-list__type--${diff.type}`"
                >
                  {{ getTypeLabel(diff.type) }}
                </span>
                <span
                  class="severity"
                  :class="`severity--${diff.severity}`"
                >
                  <Icon
                    :name="getSeverityIcon(diff.severity)"
                    class="severity__icon"
                  />
                  {{ getSeverityLabel(diff.severity) }}
                </span>
              </div>
              <p class="diff-list__description">{{ diff.description }}</p>
              <div v-if="diff.explanation" class="diff-list__explanation">
                <strong>原因：</strong>{{ diff.explanation.details }}
              </div>
            </li>
          </ul>
          <div v-if="differences.length > 10" class="p-4 text-center text-gray-500 text-sm border-t">
            还有 {{ differences.length - 10 }} 处差异...
          </div>
        </div>
      </div>

      <!-- Entries Comparison Table -->
      <div v-if="hasDetailedEntries" class="mt-8">
        <h4 class="text-lg font-semibold mb-4">分录对比</h4>
        <div class="overflow-x-auto">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>分录说明</th>
                <th>借方</th>
                <th>贷方</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in flattenedEntries.slice(0, 20)"
                :key="entry.id"
                class="diff-row"
                :class="`diff-row--${entry.diffStatus}`"
              >
                <td class="diff-cell">{{ entry.description }}</td>
                <td class="diff-cell">
                  <div
                    v-for="debit in entry.debits"
                    :key="debit.accountCode"
                    :class="getDiffStatusColor(debit.diffStatus)"
                  >
                    {{ debit.accountCode }}: {{ formatAmount(debit.amount) }}
                  </div>
                </td>
                <td class="diff-cell">
                  <div
                    v-for="credit in entry.credits"
                    :key="credit.accountCode"
                    :class="getDiffStatusColor(credit.diffStatus)"
                  >
                    {{ credit.accountCode }}: {{ formatAmount(credit.amount) }}
                  </div>
                </td>
                <td class="diff-cell">
                  <span
                    class="diff-status"
                    :class="`diff-status--${entry.diffStatus}`"
                  >
                    {{ getDiffStatusLabel(entry.diffStatus) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="comparison-empty">
      <Icon name="compare" class="comparison-empty__icon" />
      <p>选择至少两个体系进行对比</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComparison } from '~/composables/useComparison'

const props = defineProps<{
  scenarioId: number
  systemIds: number[]
}>()

const {
  isLoading,
  error,
  result,
  systems,
  differences,
  summary,
  hasDifferences,
  compareScenarioSystems,
  getDiffStatusColor,
} = useComparison()

// Load comparison on mount
onMounted(async () => {
  if (props.systemIds.length >= 2) {
    await compareScenarioSystems(props.scenarioId, props.systemIds)
  }
})

// Watch for systemIds changes
watch(() => props.systemIds, async (newSystemIds) => {
  if (newSystemIds.length >= 2) {
    await compareScenarioSystems(props.scenarioId, newSystemIds)
  }
}, { deep: true })

const hasDetailedEntries = computed(() => {
  return systems.value.some(s => s.entries.length > 0)
})

const flattenedEntries = computed(() => {
  const entries: Array<{
    id: string
    description: string
    debits: Array<{ accountCode: string; amount: number; diffStatus: string }>
    credits: Array<{ accountCode: string; amount: number; diffStatus: string }>
    diffStatus: string
  }> = []

  for (const system of systems.value) {
    for (const entry of system.entries) {
      entries.push({
        id: entry.id || `${system.systemId}-${entry.description}`,
        description: entry.description,
        debits: entry.debits,
        credits: entry.credits,
        diffStatus: entry.diffStatus,
      })
    }
  }

  return entries
})

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    account: '科目',
    amount: '金额',
    timing: '时点',
    rule: '规则',
    entry: '分录',
  }
  return labels[type] || type
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }
  return labels[severity] || severity
}

function getSeverityIcon(severity: string): string {
  const icons: Record<string, string> = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  }
  return icons[severity] || 'info'
}

function getDiffStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    identical: '一致',
    modified: '修改',
    added: '新增',
    removed: '删除',
  }
  return labels[status] || status
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount)
}
</script>

<style scoped>
@import '~/assets/styles/comparison.css';

.system-comparison {
  @apply w-full;
}
</style>
