import { defineEventHandler, getRouterParam } from 'h3'
import { getConversationMessageById } from '../../../../db/queries/conversations'

export default defineEventHandler(async (event) => {
  try {
    const messageId = getRouterParam(event, 'id')

    if (!messageId) {
      return {
        success: false,
        error: 'Message ID required',
      }
    }

    const message = await getConversationMessageById(parseInt(messageId, 10))

    if (!message) {
      return {
        success: false,
        error: 'Message not found',
      }
    }

    const responseStats = message.responseStats as any

    return {
      success: true,
      data: {
        model: responseStats?.model,
        providerId: responseStats?.providerId,
        providerName: responseStats?.providerName,
        inputTokens: responseStats?.inputTokens || 0,
        outputTokens: responseStats?.outputTokens || 0,
        totalTokens: responseStats?.totalTokens || 0,
        durationMs: responseStats?.durationMs || 0,
      },
    }
  } catch (error: any) {
    console.error('Failed to get response stats:', error)
    return {
      success: false,
      error: error.message || 'Failed to get response stats',
    }
  }
})
