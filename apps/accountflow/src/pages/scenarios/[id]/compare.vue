<template>
  <div class="compare-page">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-2">
        <NuxtLink
          :to="`/scenarios/${scenarioId}`"
          class="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Icon name="arrow-left" class="w-4 h-4" />
          返回场景
        </NuxtLink>
      </div>
      <h1 class="text-2xl font-bold">体系对比</h1>
      <p class="text-gray-600 mt-1">
        对比不同会计体系下的分析结果差异
      </p>
    </div>

    <!-- System Selection -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">选择要对比的体系</h2>

      <div v-if="systemsWithAnalyses.length === 0" class="text-gray-500 text-center py-8">
        <Icon name="system" class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无可对比的体系</p>
        <p class="text-sm mt-1">请先在不同体系下进行分析</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="systemInfo in systemsWithAnalyses"
          :key="systemInfo.system.id"
          class="flex items-center gap-3 p-3 border rounded-lg transition-colors"
          :class="[
            selectedSystemIds.includes(systemInfo.system.id)
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300',
            !systemInfo.analysis ? 'opacity-50' : '',
          ]"
        >
          <input
            type="checkbox"
            :id="`system-${systemInfo.system.id}`"
            :value="systemInfo.system.id"
            v-model="selectedSystemIds"
            :disabled="!systemInfo.analysis"
            class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <div class="flex-1">
            <label
              :for="`system-${systemInfo.system.id}`"
              class="font-medium cursor-pointer flex items-center gap-2"
            >
              {{ systemInfo.system.name }}
              <span
                class="system-indicator text-xs"
                :class="systemInfo.system.type === 'builtin' ? 'system-indicator--builtin' : 'system-indicator--custom'"
              >
                {{ systemInfo.system.type === 'builtin' ? '内置' : '自定义' }}
              </span>
            </label>
            <p class="text-sm text-gray-500">
              <span v-if="systemInfo.analysis">
                已分析 · {{ formatDate(systemInfo.analysis.createdAt) }}
              </span>
              <span v-else class="text-orange-600">
                尚未在此体系下进行分析
              </span>
            </p>
          </div>
          <div v-if="systemInfo.hasDifferences" class="flex items-center gap-1 text-yellow-600">
            <Icon name="warning" class="w-4 h-4" />
            <span class="text-sm">有差异</span>
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center gap-4">
        <button
          @click="performComparison"
          :disabled="selectedSystemIds.length < 2 || isLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Icon v-if="isLoading" name="loading" class="w-4 h-4 animate-spin" />
          <Icon v-else name="compare" class="w-4 h-4" />
          {{ isLoading ? '对比中...' : '开始对比' }}
        </button>
        <span class="text-sm text-gray-500">
          已选择 {{ selectedSystemIds.length }} 个体系（至少选择 2 个）
        </span>
      </div>
    </div>

    <!-- Comparison Results -->
    <div v-if="result" class="bg-white rounded-lg border border-gray-200 p-6">
      <SystemComparison
        :scenario-id="scenarioId"
        :system-ids="selectedSystemIds"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useComparison } from '~/composables/useComparison'
import SystemComparison from '~/components/analysis/SystemComparison.vue'

const route = useRoute()
const scenarioId = parseInt(route.params.id as string)

const {
  isLoading,
  result,
  getSystemsWithAnalyses,
} = useComparison()

const systemsWithAnalyses = ref<Array<{
  system: {
    id: number
    name: string
    type: string
    description?: string
  }
  analysis?: {
    id: number
    status: string
    createdAt: Date
  }
  hasDifferences: boolean
}>>([])

const selectedSystemIds = ref<number[]>([])

onMounted(async () => {
  const data = await getSystemsWithAnalyses(scenarioId)
  if (data) {
    systemsWithAnalyses.value = data.systems
  }
})

async function performComparison() {
  if (selectedSystemIds.value.length < 2) {
    return
  }
  // The comparison will be triggered by the SystemComparison component
  // which watches for systemIds changes
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
@import '~/assets/styles/comparison.css';

.compare-page {
  @apply max-w-7xl mx-auto px-4 py-6;
}
</style>
