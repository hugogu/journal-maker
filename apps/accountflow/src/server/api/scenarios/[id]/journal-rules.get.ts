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

    // Get all journal rules for this scenario with event data
    const rules = await db.query.journalRules.findMany({
      where: eq(journalRules.scenarioId, scenarioId),
      with: {
        accountingEvent: true,
      },
      orderBy: (journalRules, { desc }) => [desc(journalRules.createdAt)]
    })

    // Map to include event object at top level for convenience
    const data = rules.map(rule => {
      const evt = rule.accountingEvent as { id: number; eventName: string; description: string | null; eventType: string | null } | null
      return {
        ...rule,
        event: evt ? {
          id: evt.id,
          eventName: evt.eventName,
          description: evt.description,
          eventType: evt.eventType,
        } : null,
      }
    })

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Failed to get journal rules:', error)
    return {
      success: false,
      error: error.message || 'Failed to get journal rules'
    }
  }
})
