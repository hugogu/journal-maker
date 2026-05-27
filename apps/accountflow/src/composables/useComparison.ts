import type { ComparisonResponse, DiffResult } from '~/server/services/comparison'

export interface ComparisonState {
  isLoading: boolean
  error: string | null
  result: ComparisonResponse | null
}

export interface ComparedSystem {
  systemId: number
  systemName: string
  systemType: string
  analysisId?: number
  status: string
  entries: Array<{
    id?: string
    description: string
    debits: Array<{
      accountCode: string
      accountName?: string
      amount: number
      diffStatus: string
    }>
    credits: Array<{
      accountCode: string
      accountName?: string
      amount: number
      diffStatus: string
    }>
    diffStatus: string
  }>
  subjects: Array<{
    code: string
    name: string
    direction: string
  }>
  flowchart?: string
}

export interface Difference {
  type: 'account' | 'amount' | 'timing' | 'rule' | 'entry'
  severity: 'high' | 'medium' | 'low'
  description: string
  systems: string[]
  explanation?: {
    cause: string
    details: string
  }
}

export const useComparison = () => {
  const state = reactive<ComparisonState>({
    isLoading: false,
    error: null,
    result: null,
  })

  const systems = computed<ComparedSystem[]>(() => {
    return state.result?.systems || []
  })

  const differences = computed<Difference[]>(() => {
    return state.result?.differences || []
  })

  const summary = computed(() => {
    return state.result?.summary || {
      totalDifferences: 0,
      accountDifferences: 0,
      amountDifferences: 0,
      timingDifferences: 0,
      ruleDifferences: 0,
    }
  })

  const hasDifferences = computed(() => {
    return summary.value.totalDifferences > 0
  })

  /**
   * Compare analyses for a scenario across multiple systems
   */
  const compareScenarioSystems = async (
    scenarioId: number,
    systemIds: number[],
    view: 'entries' | 'rules' | 'flowcharts' | 'all' = 'all'
  ) => {
    state.isLoading = true
    state.error = null

    try {
      const systemIdsParam = systemIds.join(',')
      const { data, error: fetchError } = await useFetch<ComparisonResponse>(
        `/api/scenarios/${scenarioId}/compare?systemIds=${systemIdsParam}&view=${view}`
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to compare systems')
      }

      if (data.value?.data) {
        state.result = data.value.data
        return data.value.data
      }

      throw new Error('No comparison data returned')
    } catch (err: any) {
      state.error = err.message || 'Failed to compare systems'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Compare specific analysis IDs
   */
  const compareAnalyses = async (
    analysisIds: number[],
    view: 'entries' | 'rules' | 'flowcharts' | 'all' = 'all'
  ) => {
    state.isLoading = true
    state.error = null

    try {
      const { data, error: fetchError } = await useFetch<ComparisonResponse>(
        '/api/analyses/compare',
        {
          method: 'POST',
          body: {
            analysisIds,
            view,
          },
        }
      )

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to compare analyses')
      }

      if (data.value?.data) {
        state.result = data.value.data
        return data.value.data
      }

      throw new Error('No comparison data returned')
    } catch (err: any) {
      state.error = err.message || 'Failed to compare analyses'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Get systems with analyses for a scenario
   */
  const getSystemsWithAnalyses = async (scenarioId: number) => {
    try {
      const { data, error: fetchError } = await useFetch<{
        systems: Array<{
          system: {
            id: number
            name: string
            type: string
            description?: string
          }
          analysis?: {
            id: number
            status: string
            createdAt: Date
          }
          hasDifferences: boolean
        }>
        total: number
        withAnalyses: number
        hasDifferences: boolean
      }>(`/api/scenarios/${scenarioId}/systems`)

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to get systems')
      }

      return data.value?.data
    } catch (err: any) {
      console.error('Failed to get systems:', err)
      return null
    }
  }

  /**
   * Clear comparison results
   */
  const clearComparison = () => {
    state.result = null
    state.error = null
  }

  /**
   * Get diff status color
   */
  const getDiffStatusColor = (status: string) => {
    switch (status) {
      case 'identical':
        return 'text-green-600'
      case 'modified':
        return 'text-yellow-600'
      case 'added':
        return 'text-blue-600'
      case 'removed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  /**
   * Get diff status background color
   */
  const getDiffStatusBg = (status: string) => {
    switch (status) {
      case 'identical':
        return 'bg-green-50'
      case 'modified':
        return 'bg-yellow-50'
      case 'added':
        return 'bg-blue-50'
      case 'removed':
        return 'bg-red-50'
      default:
        return 'bg-gray-50'
    }
  }

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return {
    isLoading: computed(() => state.isLoading),
    error: computed(() => state.error),
    result: computed(() => state.result),
    systems,
    differences,
    summary,
    hasDifferences,
    compareScenarioSystems,
    compareAnalyses,
    getSystemsWithAnalyses,
    clearComparison,
    getDiffStatusColor,
    getDiffStatusBg,
    getSeverityColor,
  }
}
