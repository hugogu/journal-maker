import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { conversationMessages } from '../../../../db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const scenarioIdParam = getRouterParam(event, 'scenarioId')
    const messageIdParam = getRouterParam(event, 'messageId')

    const scenarioId = scenarioIdParam ? parseInt(scenarioIdParam, 10) : null
    const messageId = messageIdParam ? parseInt(messageIdParam, 10) : null

    if (!scenarioId || isNaN(scenarioId) || !messageId || isNaN(messageId)) {
      throw createError({ statusCode: 400, message: 'Invalid scenario ID or message ID' })
    }

    // Delete the message, ensuring it belongs to the specified scenario
    const result = await db
      .delete(conversationMessages)
      .where(
        and(eq(conversationMessages.id, messageId), eq(conversationMessages.scenarioId, scenarioId))
      )
      .returning()

    if (result.length === 0) {
      throw createError({ statusCode: 404, message: 'Message not found' })
    }

    return {
      success: true,
      message: 'Message deleted successfully',
    }
  } catch (error: any) {
    console.error('Error deleting message:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to delete message',
    })
  }
})
