<template>
  <div class="analysis-actions">
    <div class="flex items-center gap-3">
      <!-- Compare Button -->
      <button
        v-if="showCompareButton"
        @click="goToComparison"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Icon name="compare" class="w-4 h-4" />
        对比其他体系
      </button>

      <!-- System Selector for Analysis -->
      <div class="relative">
        <label class="text-sm font-medium text-gray-700 mr-2">当前体系:</label>
        <select
          v-model="selectedSystemId"
          @change="onSystemChange"
          class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option
            v-for="system in availableSystems"
            :key="system.id"
            :value="system.id"
          >
            {{ system.name }}
          </option>
        </select>
      </div>

      <!-- System Info Badge -->
      <span
        v-if="currentSystem"
        class="system-indicator"
        :class="currentSystem.type === 'builtin' ? 'system-indicator--builtin' : 'system-indicator--custom'"
      >
        {{ currentSystem.type === 'builtin' ? '内置' : '自定义' }}
      </span>
    </div>

    <!-- System Change Warning -->
    <div
      v-if="showSystemChangeWarning"
      class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800"
    >
      <div class="flex items-start gap-2">
        <Icon name="warning" class="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p class="font-medium">切换体系将重新分析</p>
          <p class="mt-1">
            切换会计体系后，当前分析结果将被保留，但新的分析将使用所选体系的科目和规则。
          </p>
        </div>
      </div>
    </div>

    <!-- Other Systems Status -->
    <div v-if="otherSystemsWithAnalyses.length > 0" class="mt-3 text-sm text-gray-600">
      <p>
        其他体系分析状态:
        <span
          v-for="(system, index) in otherSystemsWithAnalyses"
          :key="system.system.id"
          class="inline-flex items-center gap-1"
        >
          <span class="font-medium">{{ system.system.name }}</span>
          <span
            v-if="system.analysis"
            class="text-green-600"
          >
            <Icon name="check" class="w-3 h-3 inline" />
            已分析
          </span>
          <span v-else class="text-gray-400">未分析</span>
          <span v-if="index < otherSystemsWithAnalyses.length - 1" class="mx-1">·</span>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSystems } from '~/composables/useSystems'
import { useComparison } from '~/composables/useComparison'

const props = defineProps<{
  scenarioId: number
  currentSystemId?: number
}>()

const emit = defineEmits<{
  (e: 'systemChange', systemId: number): void
}>()

const router = useRouter()
const { systems, fetchSystems } = useSystems()
const { getSystemsWithAnalyses } = useComparison()

const selectedSystemId = ref<number | undefined>(props.currentSystemId)
const systemsWithAnalyses = ref<Array<{
  system: {
    id: number
    name: string
    type: string
  }
  analysis?: {
    id: number
    status: string
    createdAt: Date
  }
}>>([])
const showSystemChangeWarning = ref(false)

onMounted(async () => {
  await fetchSystems()
  const data = await getSystemsWithAnalyses(props.scenarioId)
  if (data) {
    systemsWithAnalyses.value = data.systems
  }
})

const availableSystems = computed(() => {
  return systems.value.filter(s => s.status === 'active')
})

const currentSystem = computed(() => {
  return availableSystems.value.find(s => s.id === selectedSystemId.value)
})

const otherSystemsWithAnalyses = computed(() => {
  return systemsWithAnalyses.value.filter(
    s => s.system.id !== selectedSystemId.value
  )
})

const showCompareButton = computed(() => {
  // Show compare button if there are at least 2 systems with analyses
  const analyzedCount = systemsWithAnalyses.value.filter(s => s.analysis).length
  return analyzedCount >= 2
})

function onSystemChange() {
  if (selectedSystemId.value !== props.currentSystemId) {
    showSystemChangeWarning.value = true
    emit('systemChange', selectedSystemId.value!)
  } else {
    showSystemChangeWarning.value = false
  }
}

function goToComparison() {
  router.push(`/scenarios/${props.scenarioId}/compare`)
}
</script>

<style scoped>
@import '~/assets/styles/comparison.css';

.analysis-actions {
  @apply w-full;
}
</style>
