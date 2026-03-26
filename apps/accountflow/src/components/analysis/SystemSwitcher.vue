<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
          </svg>
        </div>
        
        <div>
          <h3 class="text-sm font-medium text-gray-900">切换会计体系</h3>
          <p class="text-xs text-gray-500">选择不同的体系将使用不同的科目和规则进行分析</p>
        </div>
      </div>
      
      <button
        @click="$emit('close')"
        class="text-gray-400 hover:text-gray-600"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <div class="mt-4">
      <SystemSelector
        v-model="selectedSystem"
        :systems="systems"
        :loading="loading"
        placeholder="选择要切换的体系"
      />
    </div>
    
    <div v-if="selectedSystem && selectedSystem.id !== currentSystemId" class="mt-4 flex justify-end">
      <button
        @click="confirmSwitch"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
      >
        切换到 {{ selectedSystem.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AccountingSystem } from '~/types'

interface Props {
  systems: AccountingSystem[]
  currentSystemId: number
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'switch', system: AccountingSystem): void
}>()

const selectedSystem = ref<AccountingSystem | null>(null)

watch(() => props.currentSystemId, (newId) => {
  const current = props.systems.find(s => s.id === newId)
  if (current) {
    selectedSystem.value = current
  }
}, { immediate: true })

const confirmSwitch = () => {
  if (selectedSystem.value) {
    emit('switch', selectedSystem.value)
  }
}
</script>
