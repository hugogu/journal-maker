<template>
  <div class="relative inline-block" ref="dropdownRef">
    <button
      :disabled="disabled"
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
      :class="disabled
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : 'bg-purple-50 text-purple-900 hover:bg-purple-100'"
      @click="toggleDropdown"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      导出数据
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
    >
      <button
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 transition-colors"
        @click="selectFormat('xlsx')"
      >
        <span class="font-medium">Excel (.xlsx)</span>
        <span class="block text-xs text-gray-500 mt-0.5">多工作表格式</span>
      </button>
      <button
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 transition-colors"
        @click="selectFormat('csv')"
      >
        <span class="font-medium">CSV (.csv)</span>
        <span class="block text-xs text-gray-500 mt-0.5">ZIP 压缩包</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [format: 'xlsx' | 'csv']
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectFormat(format: 'xlsx' | 'csv') {
  isOpen.value = false
  emit('select', format)
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
