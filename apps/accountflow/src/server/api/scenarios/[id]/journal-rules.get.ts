import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { journalRules } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const scenarioIdParam = getRouterParam(event, 'id')
    
    if (!scenarioIdParam) {
      return {
        success: false,
        error: 'Scenario ID required'
      }
    }

    const scenarioId = parseInt(scenarioIdParam, 10)
    
    if (isNaN(scenarioId)) {
      return {
        success: false,
        error: 'Invalid scenario ID'
      }
    }

    // Get all journal rules for this scenario
    const rules = await db.query.journalRules.findMany({
      where: eq(journalRules.scenarioId, scenarioId),
      orderBy: (journalRules, { desc }) => [desc(journalRules.createdAt)]
    })

    return {
      success: true,
      data: rules
    }
  } catch (error: any) {
    console.error('Failed to get journal rules:', error)
    return {
      success: false,
      error: error.message || 'Failed to get journal rules'
    }
  }
})
