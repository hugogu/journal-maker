import type { Account, AccountingSystem } from '~/types'

export interface AccountWithSystems extends Account {
  systems?: AccountingSystem[]
}

export const useAccounts = () => {
  const accounts = ref<AccountWithSystems[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedSystemId = ref<number | null>(null)

  // Fetch accounts
  const fetchAccounts = async (systemId?: number) => {
    loading.value = true
    error.value = null

    try {
      const query = systemId ? `?systemId=${systemId}` : ''
      const { data, error: fetchError } = await useFetch<{ data: AccountWithSystems[] }>(`/api/accounts${query}`)

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch accounts')
      }

      accounts.value = data.value?.data || []
      return accounts.value
    } catch (err: any) {
      error.value = err.message || '获取科目列表失败'
      console.error('Failed to fetch accounts:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Create account
  const createAccount = async (data: {
    code: string
    name: string
    type: string
    direction: string
    description?: string
    parentId?: number
    systemIds?: number[]
  }) => {
    loading.value = true
    error.value = null

    try {
      const { data: result, error: createError } = await useFetch<{ data: AccountWithSystems }>('/api/accounts', {
        method: 'POST',
        body: data,
      })

      if (createError.value) {
        throw new Error(createError.value.message || 'Failed to create account')
      }

      if (result.value?.data) {
        accounts.value.push(result.value.data)
        return result.value.data
      }
    } catch (err: any) {
      error.value = err.message || '创建科目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update account
  const updateAccount = async (
    accountId: number,
    data: Partial<{
      code: string
      name: string
      type: string
      direction: string
      description: string
      parentId: number
      systemIds: number[]
    }>
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data: result, error: updateError } = await useFetch<{ data: AccountWithSystems }>(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        body: data,
      })

      if (updateError.value) {
        throw new Error(updateError.value.message || 'Failed to update account')
      }

      if (result.value?.data) {
        const index = accounts.value.findIndex(a => a.id === accountId)
        if (index !== -1) {
          accounts.value[index] = result.value.data
        }
        return result.value.data
      }
    } catch (err: any) {
      error.value = err.message || '更新科目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete account
  const deleteAccount = async (accountId: number) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await useFetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      })

      if (deleteError.value) {
        throw new Error(deleteError.value.message || 'Failed to delete account')
      }

      accounts.value = accounts.value.filter(a => a.id !== accountId)
    } catch (err: any) {
      error.value = err.message || '删除科目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get account systems
  const getAccountSystems = async (accountId: number) => {
    try {
      const { data, error: fetchError } = await useFetch<{ data: { systems: AccountingSystem[] } }>(`/api/accounts/${accountId}/systems`)

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch account systems')
      }

      return data.value?.data?.systems || []
    } catch (err: any) {
      console.error('Failed to fetch account systems:', err)
      return []
    }
  }

  // Filter by system
  const filterBySystem = async (systemId: number | null) => {
    selectedSystemId.value = systemId
    await fetchAccounts(systemId || undefined)
  }

  // Get filtered accounts
  const filteredAccounts = computed(() => {
    if (!selectedSystemId.value) return accounts.value
    return accounts.value.filter(account =>
      account.systems?.some(s => s.id === selectedSystemId.value)
    )
  })

  return {
    accounts: readonly(accounts),
    loading: readonly(loading),
    error: readonly(error),
    selectedSystemId: readonly(selectedSystemId),
    filteredAccounts,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountSystems,
    filterBySystem,
  }
}
