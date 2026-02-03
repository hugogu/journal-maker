<template>
  <div class="provider-model-selector">
    <div class="flex items-center gap-4">
      <!-- Provider Selector -->
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
        <select
          v-model="selectedProviderId"
          @change="onProviderChange"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :disabled="loading"
        >
          <option value="">默认 Provider</option>
          <option
            v-for="provider in providers"
            :key="provider.id"
            :value="provider.id"
          >
            {{ provider.name }} ({{ provider.type }})
          </option>
        </select>
      </div>

      <!-- Model Selector -->
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">模型</label>
        <div class="flex items-center gap-2">
          <select
            v-model="selectedModel"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :disabled="loadingModels || !selectedProviderId"
          >
            <option value="">默认模型</option>
            <option
              v-for="model in availableModels"
              :key="model.id"
              :value="model.id"
            >
              {{ model.name }}
            </option>
          </select>
          <button
            v-if="selectedProviderId"
            @click="refreshModels"
            class="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            :disabled="refreshing"
            title="刷新模型列表"
          >
            <svg
              v-if="refreshing"
              class="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-2 text-sm text-red-600">
      {{ error }}
    </div>

    <!-- Selected Info -->
    <div v-if="selectedProvider && selectedModel" class="mt-2 text-xs text-gray-500">
      使用: {{ selectedProvider.name }} / {{ selectedModelName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

export interface AIProvider {
  id: string
  name: string
  type: 'openai' | 'azure' | 'ollama' | 'custom'
  defaultModel?: string
}

export interface AIModel {
  id: string
  name: string
}

const props = defineProps<{
  providers: AIProvider[]
  initialProviderId?: string
  initialModel?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  change: [providerId: string, model: string]
  refresh: [providerId: string]
}>()

const selectedProviderId = ref(props.initialProviderId || '')
const selectedModel = ref(props.initialModel || '')
const loadingModels = ref(false)
const refreshing = ref(false)
const error = ref('')
const availableModels = ref<AIModel[]>([])

const selectedProvider = computed(() => {
  return props.providers.find(p => p.id === selectedProviderId.value)
})

const selectedModelName = computed(() => {
  const model = availableModels.value.find(m => m.id === selectedModel.value)
  return model?.name || selectedModel.value
})

function onProviderChange() {
  selectedModel.value = ''
  loadModels()
  emitChange()
}

async function loadModels() {
  if (!selectedProviderId.value) {
    availableModels.value = []
    return
  }

  loadingModels.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/ai-providers/${selectedProviderId.value}/models`)
    if (!response.ok) {
      throw new Error('Failed to load models')
    }
    const data = await response.json()
    availableModels.value = data.models || []

    // Auto-select default model if available
    const provider = selectedProvider.value
    if (provider?.defaultModel && !selectedModel.value) {
      selectedModel.value = provider.defaultModel
      emitChange()
    }
  } catch (e) {
    error.value = '加载模型列表失败'
    console.error('Failed to load models:', e)
  } finally {
    loadingModels.value = false
  }
}

async function refreshModels() {
  if (!selectedProviderId.value) return

  refreshing.value = true
  error.value = ''

  try {
    const response = await fetch(`/api/ai-providers/${selectedProviderId.value}/refresh-models`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error('Failed to refresh models')
    }
    await loadModels()
    emit('refresh', selectedProviderId.value)
  } catch (e) {
    error.value = '刷新模型列表失败'
    console.error('Failed to refresh models:', e)
  } finally {
    refreshing.value = false
  }
}

function emitChange() {
  emit('change', selectedProviderId.value, selectedModel.value)
}

// Load models when provider changes
watch(selectedProviderId, () => {
  loadModels()
})

// Watch for external changes to model
watch(selectedModel, () => {
  emitChange()
})

onMounted(() => {
  if (selectedProviderId.value) {
    loadModels()
  }
})

// Expose methods for parent component
defineExpose({
  selectedProviderId,
  selectedModel,
  refreshModels
})
</script>
