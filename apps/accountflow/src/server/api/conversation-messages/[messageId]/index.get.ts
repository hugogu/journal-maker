import { defineEventHandler, createError, getRouterParam } from 'h3'
import { getConversationMessageById } from '../../../db/queries/conversations'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'messageId')
    const messageId = idParam ? parseInt(idParam, 10) : null

    if (!messageId || isNaN(messageId)) {
      throw createError({ statusCode: 400, message: 'Invalid message ID' })
    }

    const message = await getConversationMessageById(messageId)
    if (!message) {
      throw createError({ statusCode: 404, message: 'Message not found' })
    }

    return { data: message }
  } catch (error) {
    console.error('Error fetching conversation message:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch conversation message'
    })
  }
})
