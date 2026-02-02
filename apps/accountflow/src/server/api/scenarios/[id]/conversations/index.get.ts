import { defineEventHandler, createError, getRouterParam } from 'h3'
import { getConversationMessages } from '../../../db/queries/conversations'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const scenarioId = idParam ? parseInt(idParam, 10) : null
    
    if (!scenarioId || isNaN(scenarioId)) {
      throw createError({ statusCode: 400, message: 'Invalid scenario ID' })
    }

    const messages = await getConversationMessages(scenarioId)
    return { messages }
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch conversation messages'
    })
  }
})
