import type { JournalRule, AccountingSystem } from '~/types'

export interface RuleWithSystems extends JournalRule {
  systems?: AccountingSystem[]
  scenario?: {
    id: number
    name: string
  }
  event?: {
    id: number
    eventName: string
    description: string
  }
  debitAccount?: {
    id: number
    code: string
    name: string
  }
  creditAccount?: {
    id: number
    code: string
    name: string
  }
}

export interface RulesFilter {
  search?: string
  scenarioId?: number
  systemId?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const useRules = () => {
  const rules = ref<RuleWithSystems[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const filter = ref<RulesFilter>({})

  // Fetch rules
  const fetchRules = async (filters?: RulesFilter) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      params.append('page', String(page.value))
      params.append('pageSize', String(pageSize.value))

      if (filters?.search) {
        params.append('search', filters.search)
      }
      if (filters?.scenarioId) {
        params.append('scenarioId', String(filters.scenarioId))
      }
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy)
        params.append('sortOrder', filters.sortOrder || 'desc')
      }

      const { data, error: fetchError } = await useFetch<{
        data: {
          rules: RuleWithSystems[]
          pagination: {
            total: number
            page: number
            pageSize: number
            totalPages: number
          }
        }
      }>(`/api/journal-rules?${params.toString()}`)

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch rules')
      }

      rules.value = data.value?.data?.rules || []
      total.value = data.value?.data?.pagination?.total || 0
      return rules.value
    } catch (err: any) {
      error.value = err.message || '获取规则列表失败'
      console.error('Failed to fetch rules:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch rules by system
  const fetchRulesBySystem = async (systemId: number) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await useFetch<{
        data: { rules: RuleWithSystems[] }
      }>(`/api/systems/${systemId}/rules`)

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch system rules')
      }

      rules.value = data.value?.data?.rules || []
      total.value = rules.value.length
      return rules.value
    } catch (err: any) {
      error.value = err.message || '获取体系规则失败'
      console.error('Failed to fetch system rules:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Create rule
  const createRule = async (data: {
    scenarioId: number
    eventName: string
    eventDescription?: string
    debitAccountId?: number
    creditAccountId?: number
    conditions?: Record<string, unknown>
    systemIds?: number[]
  }) => {
    loading.value = true
    error.value = null

    try {
      const { data: result, error: createError } = await useFetch('/api/journal-rules/batch', {
        method: 'POST',
        body: {
          scenarioId: data.scenarioId,
          rules: [{
            eventName: data.eventName,
            eventDescription: data.eventDescription,
            debitAccountId: data.debitAccountId,
            creditAccountId: data.creditAccountId,
            conditions: data.conditions,
          }],
          systemIds: data.systemIds || [],
        },
      })

      if (createError.value) {
        throw new Error(createError.value.message || 'Failed to create rule')
      }

      if ((result.value as any)?.data) {
        const newRules = (result.value as any).data
        rules.value.push(...newRules)
        return newRules
      }
    } catch (err: any) {
      error.value = err.message || '创建规则失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update rule
  const updateRule = async (
    ruleId: number,
    data: Partial<{
      debitSide: Record<string, unknown>
      creditSide: Record<string, unknown>
      triggerType: string
      status: string
      amountFormula: string
    }>
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data: result, error: updateError } = await useFetch(`/api/journal-rules/${ruleId}`, {
        method: 'PATCH',
        body: data,
      })

      if (updateError.value) {
        throw new Error(updateError.value.message || 'Failed to update rule')
      }

      if ((result.value as any)?.data) {
        const updatedRule = (result.value as any).data
        const index = rules.value.findIndex(r => r.id === ruleId)
        if (index !== -1) {
          rules.value[index] = { ...rules.value[index], ...updatedRule }
        }
        return updatedRule
      }
    } catch (err: any) {
      error.value = err.message || '更新规则失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete rule
  const deleteRule = async (ruleId: number) => {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await useFetch(`/api/journal-rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (deleteError.value) {
        throw new Error(deleteError.value.message || 'Failed to delete rule')
      }

      rules.value = rules.value.filter(r => r.id !== ruleId)
      total.value = total.value - 1
    } catch (err: any) {
      error.value = err.message || '删除规则失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Set filter
  const setFilter = async (newFilter: RulesFilter) => {
    filter.value = { ...filter.value, ...newFilter }

    // If system filter changed, fetch by system
    if (newFilter.systemId) {
      await fetchRulesBySystem(newFilter.systemId)
    } else {
      await fetchRules(filter.value)
    }
  }

  // Get filtered rules
  const filteredRules = computed(() => {
    return rules.value
  })

  return {
    rules: readonly(rules),
    loading: readonly(loading),
    error: readonly(error),
    total: readonly(total),
    page: readonly(page),
    pageSize: readonly(pageSize),
    filter: readonly(filter),
    filteredRules,
    fetchRules,
    fetchRulesBySystem,
    createRule,
    updateRule,
    deleteRule,
    setFilter,
  }
}
