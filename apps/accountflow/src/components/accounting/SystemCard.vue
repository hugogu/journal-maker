<template>
  <div class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold text-gray-900">{{ system.name }}</h3>
          <SystemBadge :type="system.type" />
          <SystemBadge :status="system.status" />
        </div>
        
        <p v-if="system.description" class="mt-2 text-sm text-gray-600">
          {{ system.description }}
        </p>
        <p v-else class="mt-2 text-sm text-gray-400 italic">暂无描述</p>
        
        <div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            <span>{{ system.accountCount || 0 }} 科目</span>
          </div>
          
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <span>{{ system.ruleCount || 0 }} 规则</span>
          </div>
          
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <span>{{ system.analysisCount || 0 }} 分析</span>
          </div>
        </div>
      </div>
      
      <div v-if="system.type === 'custom'" class="ml-4 flex items-center gap-2">
        <button
          @click="$emit('edit', system)"
          class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
          title="编辑"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        
        <button
          @click="$emit('delete', system)"
          class="p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="删除"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SystemWithStats } from '~/composables/useSystems'

interface Props {
  system: SystemWithStats
}

defineProps<Props>()

defineEmits<{
  (e: 'edit', system: SystemWithStats): void
  (e: 'delete', system: SystemWithStats): void
}>()
</script>
