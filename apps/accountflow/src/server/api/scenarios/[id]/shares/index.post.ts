import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { createConversationShare } from '../../../../db/queries/conversation-shares'

export default defineEventHandler(async (event) => {
  try {
    const scenarioId = getRouterParam(event, 'id')
    const { name } = await readBody(event)

    if (!scenarioId) {
      return {
        success: false,
        error: 'Scenario ID required'
      }
    }

    const share = await createConversationShare(parseInt(scenarioId, 10), name)

    return {
      success: true,
      data: share
    }
  } catch (error: any) {
    console.error('Failed to create share:', error)
    return {
      success: false,
      error: error.message || 'Failed to create share'
    }
  }
})
