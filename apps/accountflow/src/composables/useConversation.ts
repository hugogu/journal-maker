export interface ConversationMessage {
  id?: number
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date | string
  structuredData?: Record<string, unknown> | null
  requestLog?: Record<string, unknown> | null
  responseStats?: Record<string, unknown> | null
}

export const useConversation = (scenarioId: number) => {
  const messages = ref<ConversationMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load messages from API (and migrate from localStorage if needed)
  const loadMessages = async () => {
    loading.value = true
    error.value = null
    try {
      // Try to load from API first
      const { data } = await useFetch(`/api/scenarios/${scenarioId}/conversations`, {
        query: { includeStructured: 'true' }
      })
      if (data.value?.messages?.length) {
        messages.value = data.value.messages.map((m: any) => ({
          ...m,
          timestamp: m.timestamp || m.createdAt
        }))
      } else {
        // Try to migrate from localStorage
        await migrateFromLocalStorage()
      }
    } catch (e) {
      error.value = 'Failed to load messages'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  // Migrate old localStorage data to database
  const migrateFromLocalStorage = async () => {
    if (typeof window === 'undefined') return
    
    const storageKey = `scenario-messages-${scenarioId}`
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      try {
        const oldMessages = JSON.parse(stored)
        if (Array.isArray(oldMessages) && oldMessages.length > 0) {
          // Migrate each message to database
          for (const msg of oldMessages) {
            await saveMessage({
              role: msg.role,
              content: msg.content,
            })
          }
          // Clear localStorage after migration
          localStorage.removeItem(storageKey)
          // Reload from API
          await loadMessages()
        }
      } catch (e) {
        console.error('Failed to migrate old messages:', e)
      }
    }
  }

  // Save a message to database
  const saveMessage = async (message: Omit<ConversationMessage, 'id'>) => {
    try {
      const { data } = await useFetch(`/api/scenarios/${scenarioId}/conversations`, {
        method: 'POST',
        body: message
      })
      if (data.value?.message) {
        messages.value.push({
          ...data.value.message,
          timestamp: data.value.message.timestamp || data.value.message.createdAt
        })
      }
      return data.value?.message
    } catch (e) {
      console.error('Failed to save message:', e)
      throw e
    }
  }

  // Delete a message by index and optionally by ID
  const deleteMessage = async (index: number, messageId?: number) => {
    if (!confirm('确定要删除这条消息吗？')) return
    
    // Remove from local array first
    messages.value.splice(index, 1)
    
    // If message has an ID, delete from database
    if (messageId) {
      try {
        await $fetch(`/api/conversations/${scenarioId}/messages/${messageId}`, {
          method: 'DELETE'
        })
      } catch (e) {
        console.error('Failed to delete message:', e)
        throw e
      }
    }
  }

  // Clear all messages
  const clearMessages = async () => {
    messages.value = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`scenario-messages-${scenarioId}`)
    }
  }

  return {
    messages: readonly(messages),
    loading: readonly(loading),
    error: readonly(error),
    loadMessages,
    saveMessage,
    deleteMessage,
    clearMessages
  }
}
