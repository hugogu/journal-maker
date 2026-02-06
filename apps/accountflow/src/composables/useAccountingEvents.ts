import { ref, readonly } from 'vue'

export interface AccountingEventItem {
  id: number
  scenarioId: number
  eventName: string
  description: string | null
  eventType: string | null
  isConfirmed: boolean
  ruleCount: number
  entryCount: number
  createdAt: string
  updatedAt: string
}

export const useAccountingEvents = (scenarioId: number) => {
  const events = ref<AccountingEventItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const list = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: AccountingEventItem[]; error?: string }>(
        `/api/scenarios/${scenarioId}/events`
      )

      if (response.success && response.data) {
        events.value = response.data
      } else {
        error.value = response.error || 'Failed to load events'
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to load events'
      console.error('useAccountingEvents list error:', e)
    } finally {
      loading.value = false
    }
  }

  const update = async (eventId: number, data: { eventName?: string; description?: string | null; eventType?: string | null }) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: AccountingEventItem; error?: string }>(
        `/api/scenarios/${scenarioId}/events/${eventId}`,
        {
          method: 'PUT',
          body: data,
        }
      )

      if (response.success && response.data) {
        // Update local state
        const idx = events.value.findIndex(e => e.id === eventId)
        if (idx !== -1) {
          events.value[idx] = { ...events.value[idx], ...response.data }
        }
        return true
      } else {
        error.value = response.error || 'Failed to update event'
        return false
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to update event'
      console.error('useAccountingEvents update error:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  const merge = async (sourceId: number, targetId: number) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: any; error?: string }>(
        `/api/scenarios/${scenarioId}/events/merge`,
        {
          method: 'POST',
          body: { sourceEventId: sourceId, targetEventId: targetId },
        }
      )

      if (response.success) {
        // Refresh list to get updated counts
        await list()
        return true
      } else {
        error.value = response.error || 'Failed to merge events'
        return false
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to merge events'
      console.error('useAccountingEvents merge error:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    events: readonly(events),
    loading: readonly(loading),
    error: readonly(error),
    list,
    update,
    merge,
  }
}
