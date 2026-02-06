import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { db } from '../../../../db'
import { accountingEvents, journalRules, analysisEntries } from '../../../../db/schema'
import { eq, and, sql, count } from 'drizzle-orm'
import { mergeEventsSchema } from '../../../../utils/schemas'

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

    const body = await readBody(event)
    const parsed = mergeEventsSchema.safeParse(body)

    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      }
    }

    const { sourceEventId, targetEventId } = parsed.data

    if (sourceEventId === targetEventId) {
      event.node.res.statusCode = 400
      return {
        success: false,
        error: 'Source and target events must be different'
      }
    }

    // Verify both events exist and belong to this scenario
    const sourceEvent = await db.query.accountingEvents.findFirst({
      where: and(
        eq(accountingEvents.id, sourceEventId),
        eq(accountingEvents.scenarioId, scenarioId)
      ),
    })

    const targetEvent = await db.query.accountingEvents.findFirst({
      where: and(
        eq(accountingEvents.id, targetEventId),
        eq(accountingEvents.scenarioId, scenarioId)
      ),
    })

    if (!sourceEvent || !targetEvent) {
      event.node.res.statusCode = 404
      return {
        success: false,
        error: 'Source or target event not found in this scenario'
      }
    }

    // Reassign journal_rules from source to target
    const reassignedRules = await db
      .update(journalRules)
      .set({ eventId: targetEventId, updatedAt: new Date() })
      .where(eq(journalRules.eventId, sourceEventId))
      .returning()

    // Reassign analysis_entries from source to target
    const reassignedEntries = await db
      .update(analysisEntries)
      .set({ eventId: targetEventId, updatedAt: new Date() })
      .where(eq(analysisEntries.eventId, sourceEventId))
      .returning()

    // Delete the source event
    await db
      .delete(accountingEvents)
      .where(eq(accountingEvents.id, sourceEventId))

    // Get updated counts for target event
    const [ruleCountResult] = await db
      .select({ count: count() })
      .from(journalRules)
      .where(eq(journalRules.eventId, targetEventId))

    const [entryCountResult] = await db
      .select({ count: count() })
      .from(analysisEntries)
      .where(eq(analysisEntries.eventId, targetEventId))

    return {
      success: true,
      data: {
        targetEvent: {
          id: targetEvent.id,
          eventName: targetEvent.eventName,
          ruleCount: ruleCountResult.count,
          entryCount: entryCountResult.count,
        },
        reassigned: {
          rules: reassignedRules.length,
          entries: reassignedEntries.length,
        }
      }
    }
  } catch (error: any) {
    console.error('Failed to merge accounting events:', error)
    return {
      success: false,
      error: error.message || 'Failed to merge accounting events'
    }
  }
})
