import type { AIProvider, AIModel } from '~/server/db/types'

export interface ProviderWithModels extends AIProvider {
  models: AIModel[]
}

export const useAIProviders = () => {
  const providers = ref<ProviderWithModels[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProviders = async () => {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch('/api/admin/ai-providers')
      if (data.value) {
        providers.value = data.value.providers
      }
    } catch (e) {
      error.value = 'Failed to fetch providers'
    } finally {
      loading.value = false
    }
  }

  const createProvider = async (data: {
    name: string
    type: 'openai' | 'azure' | 'ollama' | 'custom'
    apiEndpoint: string
    apiKey: string
    defaultModel?: string
    isDefault?: boolean
  }) => {
    loading.value = true
    try {
      await $fetch('/api/admin/ai-providers', {
        method: 'POST',
        body: data
      })
      await fetchProviders()
    } finally {
      loading.value = false
    }
  }

  const updateProvider = async (id: number, data: Partial<{
    name: string
    apiEndpoint: string
    apiKey: string
    defaultModel: string
    isDefault: boolean
    status: 'active' | 'inactive'
  }>) => {
    loading.value = true
    try {
      await $fetch(`/api/admin/ai-providers/${id}`, {
        method: 'PUT',
        body: data
      })
      await fetchProviders()
    } finally {
      loading.value = false
    }
  }

  const deleteProvider = async (id: number) => {
    loading.value = true
    try {
      await $fetch(`/api/admin/ai-providers/${id}`, { method: 'DELETE' })
      await fetchProviders()
    } finally {
      loading.value = false
    }
  }

  return {
    providers: readonly(providers),
    loading: readonly(loading),
    error: readonly(error),
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider
  }
}
