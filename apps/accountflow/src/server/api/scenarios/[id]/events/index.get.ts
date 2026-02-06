import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { accountingEvents, journalRules, analysisEntries } from '../../../../db/schema'
import { eq, sql, count } from 'drizzle-orm'

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

    // Get events with rule and entry counts via subqueries
    const events = await db
      .select({
        id: accountingEvents.id,
        scenarioId: accountingEvents.scenarioId,
        eventName: accountingEvents.eventName,
        description: accountingEvents.description,
        eventType: accountingEvents.eventType,
        isConfirmed: accountingEvents.isConfirmed,
        createdAt: accountingEvents.createdAt,
        updatedAt: accountingEvents.updatedAt,
        ruleCount: sql<number>`COALESCE((
          SELECT ${count()} FROM ${journalRules}
          WHERE ${journalRules.eventId} = ${accountingEvents.id}
        ), 0)`.as('rule_count'),
        entryCount: sql<number>`COALESCE((
          SELECT ${count()} FROM ${analysisEntries}
          WHERE ${analysisEntries.eventId} = ${accountingEvents.id}
        ), 0)`.as('entry_count'),
      })
      .from(accountingEvents)
      .where(eq(accountingEvents.scenarioId, scenarioId))
      .orderBy(accountingEvents.eventName)

    return {
      success: true,
      data: events
    }
  } catch (error: any) {
    console.error('Failed to get accounting events:', error)
    return {
      success: false,
      error: error.message || 'Failed to get accounting events'
    }
  }
})
