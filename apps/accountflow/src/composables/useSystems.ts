import type { AccountingSystem } from '~/types'

export interface SystemWithStats extends AccountingSystem {
  accountCount?: number
  ruleCount?: number
  analysisCount?: number
}

export const useSystems = () => {
  const systems = ref<SystemWithStats[]>([])
  const currentSystem = ref<AccountingSystem | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all systems
  const fetchSystems = async (filters?: { type?: string; status?: string }) => {
    loading.value = true
    error.value = null
    try {
      const query = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
      const { data } = await useFetch(`/api/systems${query ? `?${query}` : ''}`)
      if (data.value?.data) {
        systems.value = data.value.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || '加载体系列表失败'
    } finally {
      loading.value = false
    }
  }

  // Fetch single system
  const fetchSystem = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch(`/api/systems/${id}`)
      if (data.value?.data) {
        return data.value.data as SystemWithStats
      }
    } catch (e: any) {
      error.value = e?.data?.message || '加载体系详情失败'
    } finally {
      loading.value = false
    }
  }

  // Create system
  const createSystem = async (data: {
    name: string
    description?: string
  }) => {
    loading.value = true
    error.value = null
    try {
      const { data: result } = await useFetch('/api/systems', {
        method: 'POST',
        body: data
      })
      if (result.value?.data) {
        systems.value.push(result.value.data)
        return result.value.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || '创建体系失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Update system
  const updateSystem = async (id: number, data: {
    name?: string
    description?: string
    status?: 'active' | 'archived'
  }) => {
    loading.value = true
    error.value = null
    try {
      const { data: result } = await useFetch(`/api/systems/${id}`, {
        method: 'PATCH',
        body: data
      })
      if (result.value?.data) {
        const index = systems.value.findIndex(s => s.id === id)
        if (index !== -1) {
          systems.value[index] = result.value.data
        }
        return result.value.data
      }
    } catch (e: any) {
      error.value = e?.data?.message || '更新体系失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Delete system
  const deleteSystem = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await useFetch(`/api/systems/${id}`, {
        method: 'DELETE'
      })
      systems.value = systems.value.filter(s => s.id !== id)
    } catch (e: any) {
      error.value = e?.data?.message || '删除体系失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Set current system
  const setCurrentSystem = (system: AccountingSystem | null) => {
    currentSystem.value = system
  }

  return {
    systems: readonly(systems),
    currentSystem: readonly(currentSystem),
    loading: readonly(loading),
    error: readonly(error),
    fetchSystems,
    fetchSystem,
    createSystem,
    updateSystem,
    deleteSystem,
    setCurrentSystem
  }
}
