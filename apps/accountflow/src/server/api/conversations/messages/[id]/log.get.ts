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

    const requestLog = message.requestLog as any

    return {
      success: true,
      data: {
        requestLog: message.requestLog,
        fullPrompt: requestLog?.fullPrompt,
        systemPrompt: requestLog?.systemPrompt,
        contextMessages: requestLog?.contextMessages,
        variables: requestLog?.variables,
      },
    }
  } catch (error: any) {
    console.error('Failed to get request log:', error)
    return {
      success: false,
      error: error.message || 'Failed to get request log',
    }
  }
})
