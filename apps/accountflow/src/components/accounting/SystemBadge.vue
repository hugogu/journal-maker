<template>
  <span
    :class="badgeClass"
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AccountingSystemType, AccountingSystemStatus } from '~/types'

interface Props {
  type?: AccountingSystemType
  status?: AccountingSystemStatus
}

const props = defineProps<Props>()

const badgeClass = computed(() => {
  if (props.type) {
    return props.type === 'builtin' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800'
  }
  
  if (props.status) {
    return props.status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'
  }
  
  return 'bg-gray-100 text-gray-800'
})

const label = computed(() => {
  if (props.type) {
    return props.type === 'builtin' ? '内置' : '自定义'
  }
  
  if (props.status) {
    return props.status === 'active' ? '启用' : '已归档'
  }
  
  return ''
})
</script>
