import { ref, computed, readonly } from 'vue'
import type { AccountingSubject, AccountingRule, ConfirmedAnalysis } from '../types'

export interface ConfirmedAnalysisState {
  id: number | null
  subjects: AccountingSubject[]
  rules: AccountingRule[]
  diagramMermaid: string | null
  sourceMessageId: number | null
  confirmedAt: Date | null
  updatedAt: Date | null
}

export const useConfirmedAnalysis = (scenarioId: number) => {
  const data = ref<ConfirmedAnalysisState>({
    id: null,
    subjects: [],
    rules: [],
    diagramMermaid: null,
    sourceMessageId: null,
    confirmedAt: null,
    updatedAt: null,
  })
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const hasContent = computed(() => {
    return (
      data.value.subjects.length > 0 ||
      data.value.rules.length > 0 ||
      (data.value.diagramMermaid && data.value.diagramMermaid.trim().length > 0)
    )
  })

  /**
   * Load confirmed analysis from API
   */
  const load = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: ConfirmedAnalysis | null }>(
        `/api/scenarios/${scenarioId}/confirmed-analysis`
      )

      if (response.success && response.data) {
        data.value = {
          id: response.data.id,
          subjects: response.data.subjects || [],
          rules: response.data.rules || [],
          diagramMermaid: response.data.diagramMermaid,
          sourceMessageId: response.data.sourceMessageId,
          confirmedAt: response.data.confirmedAt ? new Date(response.data.confirmedAt) : null,
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : null,
        }
      } else {
        // No confirmed analysis yet - reset to empty state
        data.value = {
          id: null,
          subjects: [],
          rules: [],
          diagramMermaid: null,
          sourceMessageId: null,
          confirmedAt: null,
          updatedAt: null,
        }
      }
    } catch (e) {
      error.value = 'Failed to load confirmed analysis'
      console.error('useConfirmedAnalysis load error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Save/confirm analysis to API
   */
  const save = async (input: {
    subjects: AccountingSubject[]
    rules: AccountingRule[]
    diagramMermaid?: string | null
    sourceMessageId?: number | null
  }) => {
    loading.value = true
    saving.value = true
    error.value = null

    // Filter out any invalid entries
    const validSubjects = input.subjects.filter(s => s && s.code && s.name && s.direction)
    const validRules = input.rules.filter(r => r && r.id && r.description)

    try {
      const response = await $fetch<{ success: boolean; data: ConfirmedAnalysis }>(
        `/api/scenarios/${scenarioId}/confirmed-analysis`,
        {
          method: 'POST',
          body: {
            subjects: validSubjects,
            rules: validRules,
            diagramMermaid: input.diagramMermaid ?? null,
            sourceMessageId: input.sourceMessageId ?? null,
          },
        }
      )

      if (response.success && response.data) {
        data.value = {
          id: response.data.id,
          subjects: response.data.subjects || [],
          rules: response.data.rules || [],
          diagramMermaid: response.data.diagramMermaid,
          sourceMessageId: response.data.sourceMessageId,
          confirmedAt: response.data.confirmedAt ? new Date(response.data.confirmedAt) : null,
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : null,
        }
        return true
      }
      return false
    } catch (e) {
      error.value = 'Failed to save confirmed analysis'
      console.error('useConfirmedAnalysis save error:', e)
      return false
    } finally {
      loading.value = false
      saving.value = false
    }
  }

  /**
   * Clear/delete confirmed analysis
   */
  const clear = async () => {
    loading.value = true
    saving.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; message: string }>(
        `/api/scenarios/${scenarioId}/confirmed-analysis`,
        {
          method: 'DELETE',
        }
      )

      if (response.success) {
        data.value = {
          id: null,
          subjects: [],
          rules: [],
          diagramMermaid: null,
          sourceMessageId: null,
          confirmedAt: null,
          updatedAt: null,
        }
        return true
      }
      return false
    } catch (e) {
      error.value = 'Failed to clear confirmed analysis'
      console.error('useConfirmedAnalysis clear error:', e)
      return false
    } finally {
      loading.value = false
      saving.value = false
    }
  }

  /**
   * Refresh data from API
   */
  const refresh = () => load()

  return {
    data: readonly(data),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    hasContent,
    load,
    save,
    clear,
    refresh,
  }
}
