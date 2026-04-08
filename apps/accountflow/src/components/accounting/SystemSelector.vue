<template>
  <div class="relative">
    <select
      :value="modelValue?.id"
      @change="handleChange"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
      :disabled="loading"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <optgroup v-if="builtinSystems.length" label="内置体系">
        <option
          v-for="system in builtinSystems"
          :key="system.id"
          :value="system.id"
        >
          {{ system.name }}
        </option>
      </optgroup>
      
      <optgroup v-if="customSystems.length" label="自定义体系">
        <option
          v-for="system in customSystems"
          :key="system.id"
          :value="system.id"
        >
          {{ system.name }}
        </option>
      </optgroup>
    </select>
    
    <div v-if="loading" class="absolute inset-y-0 right-0 flex items-center pr-2">
      <svg class="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AccountingSystem } from '~/types'

interface Props {
  modelValue: AccountingSystem | null
  systems: AccountingSystem[]
  loading?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  placeholder: '选择会计体系'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: AccountingSystem | null): void
}>()

const builtinSystems = computed(() => 
  props.systems.filter(s => s.type === 'builtin')
)

const customSystems = computed(() => 
  props.systems.filter(s => s.type === 'custom')
)

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)
  const system = props.systems.find(s => s.id === id)
  emit('update:modelValue', system || null)
}
</script>
