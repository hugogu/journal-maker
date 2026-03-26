<template>
  <div class="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
    </svg>
    
    <div class="flex flex-col">
      <span class="text-xs text-blue-600 font-medium">当前会计体系</span>
      <span class="text-sm font-semibold text-blue-900">{{ systemName }}</span>
    </div>
    
    <button
      v-if="showChangeButton"
      @click="$emit('change')"
      class="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
    >
      切换
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  systemName: string
  showChangeButton?: boolean
}

withDefaults(defineProps<Props>(), {
  showChangeButton: true
})

defineEmits<{
  (e: 'change'): void
}>()
</script>
