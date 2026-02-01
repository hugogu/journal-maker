<template>
  <div class="account-picker">
    <label class="label">{{ label }}</label>
    
    <div class="relative">
      <!-- Search input -->
      <div class="relative">
        <input
          ref="searchInput"
          v-model="searchQuery"
          @input="handleSearch"
          @keydown="handleKeydown"
          @focus="showDropdown = true"
          class="input pr-8"
          :placeholder="placeholder"
        >
        <button
          v-if="selectedAccount"
          @click="clearSelection"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Dropdown -->
      <div
        v-show="showDropdown && (filteredAccounts.length > 0 || searchQuery)"
        class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
      >
        <div
          v-for="account in filteredAccounts"
          :key="account.code"
          @click="selectAccount(account)"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
          :class="{ 'bg-blue-50': selectedAccount?.code === account.code }"
        >
          <div class="flex items-center space-x-3">
            <span class="text-sm font-medium text-gray-900">{{ account.code }}</span>
            <span class="text-sm text-gray-600">{{ account.name }}</span>
          </div>
          <span 
            class="text-xs px-2 py-1 rounded-full"
            :class="getAccountTypeClass(account.type)"
          >
            {{ getAccountTypeLabel(account.type) }}
          </span>
        </div>
        
        <div
          v-if="filteredAccounts.length === 0 && searchQuery"
          class="px-4 py-2 text-gray-500 text-sm"
        >
          未找到匹配的科目
        </div>
      </div>
    </div>

    <!-- Selected account display -->
    <div
      v-if="selectedAccount"
      class="mt-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between"
    >
      <div class="flex items-center space-x-3">
        <span class="font-medium text-gray-900">{{ selectedAccount.code }}</span>
        <span class="text-gray-600">{{ selectedAccount.name }}</span>
      </div>
      <span 
        class="text-xs px-2 py-1 rounded-full"
        :class="getAccountTypeClass(selectedAccount.type)"
      >
        {{ getAccountTypeLabel(selectedAccount.type) }}
      </span>
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      class="mt-1 text-sm text-red-600"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Account {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  description?: string
}

interface Props {
  modelValue?: Account | null
  accounts: Account[]
  label?: string
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: '选择会计科目',
  placeholder: '搜索科目代码或名称...',
  disabled: false,
  allowClear: true
})

const emit = defineEmits<{
  'update:modelValue': [account: Account | null]
  'change': [account: Account | null]
}>()

const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const showDropdown = ref(false)
const selectedAccount = ref<Account | null>(props.modelValue)
const error = ref('')

const filteredAccounts = computed(() => {
  if (!searchQuery.value) {
    return props.accounts
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.accounts.filter(account => 
    account.code.toLowerCase().includes(query) ||
    account.name.toLowerCase().includes(query)
  )
})

const handleSearch = () => {
  error.value = ''
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showDropdown.value = false
    searchInput.value?.blur()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const firstMatch = filteredAccounts.value[0]
    if (firstMatch) {
      selectAccount(firstMatch)
    }
  }
}

const selectAccount = (account: Account) => {
  selectedAccount.value = account
  searchQuery.value = `${account.code} - ${account.name}`
  showDropdown.value = false
  emit('update:modelValue', account)
  emit('change', account)
  error.value = ''
}

const clearSelection = () => {
  selectedAccount.value = null
  searchQuery.value = ''
  showDropdown.value = false
  const nullValue = null as Account | null
  emit('update:modelValue', nullValue)
  emit('change', nullValue)
}

const getAccountTypeClass = (type: string) => {
  const classes = {
    asset: 'bg-green-100 text-green-800',
    liability: 'bg-red-100 text-red-800',
    equity: 'bg-blue-100 text-blue-800',
    revenue: 'bg-purple-100 text-purple-800',
    expense: 'bg-orange-100 text-orange-800'
  }
  return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getAccountTypeLabel = (type: string) => {
  const labels = {
    asset: '资产',
    liability: '负债',
    equity: '权益',
    revenue: '收入',
    expense: '费用'
  }
  return labels[type as keyof typeof labels] || type
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.account-picker')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // Initialize search query if value is set
  if (props.modelValue) {
    selectedAccount.value = props.modelValue
    searchQuery.value = `${props.modelValue.code} - ${props.modelValue.name}`
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== selectedAccount.value) {
    selectedAccount.value = newValue || null
    if (newValue) {
      searchQuery.value = `${newValue.code} - ${newValue.name}`
    } else {
      searchQuery.value = ''
    }
  }
})
</script>

<style scoped>
.account-picker {
  position: relative;
}
</style>
