import { defineEventHandler, getRouterParam } from 'h3'
import { getConversationShareByToken, getConversationMessages } from '../../../db/queries'
import { db } from '../../../db'
import { scenarios } from '../../../db/schema'
import { eq } from 'drizzle-orm'

async function getScenario(id: number) {
  return db.query.scenarios.findFirst({
    where: eq(scenarios.id, id)
  })
}

export default defineEventHandler(async (event) => {
  try {
    const token = getRouterParam(event, 'token')

    if (!token) {
      return {
        success: false,
        error: 'Share token required'
      }
    }

    const share = await getConversationShareByToken(token)

    if (!share) {
      return {
        success: false,
        error: 'Share not found or revoked'
      }
    }

    // Get scenario info
    const scenario = await getScenario(share.scenarioId)

    if (!scenario) {
      return {
        success: false,
        error: 'Scenario not found'
      }
    }

    // Get messages
    const messages = await getConversationMessages(share.scenarioId)

    return {
      success: true,
      data: {
        scenario: {
          id: scenario.id,
          name: scenario.name,
          description: scenario.description
        },
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        })),
        sharedAt: share.createdAt
      }
    }
  } catch (error: any) {
    console.error('Failed to get shared conversation:', error)
    return {
      success: false,
      error: error.message || 'Failed to get shared conversation'
    }
  }
})
