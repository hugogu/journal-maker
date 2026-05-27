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
const result = await $fetch(`/api/systems${query ? `?${query}` : ''}`)
      if (result?.success && result?.data) {
        systems.value = result.data
      } else {
        systems.value = []
      }
    } catch (e: any) {
      console.error('fetchSystems error:', e)
      error.value = e?.data?.message || e?.message || '加载体系列表失败'
      systems.value = []
    } finally {
      loading.value = false
    }
  }

  // Fetch single system
  const fetchSystem = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const result = await $fetch(`/api/systems/${id}`)
      if (result?.data) {
        return result.data as SystemWithStats
      }
      return null
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || '加载体系详情失败'
      return null
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
      const result = await $fetch('/api/systems', {
        method: 'POST',
        body: data
      })
      if (result?.data) {
        systems.value.push(result.data)
        return result.data
      } else {
        throw new Error('创建失败：服务器未返回数据')
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || '创建体系失败'
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
      const result = await $fetch(`/api/systems/${id}`, {
        method: 'PATCH',
        body: data
      })
      if (result?.data) {
        const index = systems.value.findIndex(s => s.id === id)
        if (index !== -1) {
          systems.value[index] = result.data
        }
        return result.data
      } else {
        throw new Error('更新失败：服务器未返回数据')
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || '更新体系失败'
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
      await $fetch(`/api/systems/${id}`, {
        method: 'DELETE'
      })
      systems.value = systems.value.filter(s => s.id !== id)
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || '删除体系失败'
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
