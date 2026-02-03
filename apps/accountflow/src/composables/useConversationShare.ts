import { ref } from 'vue'

export interface ConversationShare {
  id: number
  scenarioId: number
  shareToken: string
  createdAt: string
  isRevoked: boolean
}

export function useConversationShare(scenarioId: number) {
  const shares = ref<ConversationShare[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchShares() {
    loading.value = true
    error.value = ''
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/shares`)
      const data = await response.json()
      if (data.success) {
        shares.value = data.data
      } else {
        error.value = data.error
      }
    } catch (e) {
      error.value = '获取分享列表失败'
    } finally {
      loading.value = false
    }
  }

  async function createShare() {
    loading.value = true
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        shares.value.unshift(data.data)
        return data.data
      } else {
        error.value = data.error
        return null
      }
    } catch (e) {
      error.value = '创建分享失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function revokeShare(shareId: number) {
    try {
      const response = await fetch(`/api/shares/${shareId}/revoke`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        const index = shares.value.findIndex(s => s.id === shareId)
        if (index !== -1) {
          shares.value[index].isRevoked = true
        }
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  function getShareUrl(shareToken: string): string {
    return `${window.location.origin}/share/${shareToken}`
  }

  return {
    shares,
    loading,
    error,
    fetchShares,
    createShare,
    revokeShare,
    getShareUrl
  }
}
