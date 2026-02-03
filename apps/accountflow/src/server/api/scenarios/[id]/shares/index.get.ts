import { defineEventHandler, getRouterParam } from 'h3'
import { getConversationShares } from '../../../../db/queries/conversation-shares'

export default defineEventHandler(async (event) => {
  try {
    const scenarioId = getRouterParam(event, 'id')

    if (!scenarioId) {
      return {
        success: false,
        error: 'Scenario ID required'
      }
    }

    const shares = await getConversationShares(parseInt(scenarioId, 10))

    return {
      success: true,
      data: shares
    }
  } catch (error: any) {
    console.error('Failed to get shares:', error)
    return {
      success: false,
      error: error.message || 'Failed to get shares'
    }
  }
})
