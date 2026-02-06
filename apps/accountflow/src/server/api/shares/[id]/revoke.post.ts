import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { revokeConversationShare } from '../../../db/queries/conversation-shares'

export default defineEventHandler(async (event) => {
  try {
    const shareId = getRouterParam(event, 'id')

    if (!shareId) {
      return {
        success: false,
        error: 'Share ID required',
      }
    }

    const share = await revokeConversationShare(parseInt(shareId, 10))

    return {
      success: true,
      data: share,
    }
  } catch (error: any) {
    console.error('Failed to revoke share:', error)
    return {
      success: false,
      error: error.message || 'Failed to revoke share',
    }
  }
})
