import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { db } from '../../../../db'
import { accountingEvents } from '../../../../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { updateEventSchema } from '../../../../utils/schemas'

export default defineEventHandler(async (event) => {
  try {
    const scenarioIdParam = getRouterParam(event, 'id')
    const eventIdParam = getRouterParam(event, 'eventId')

    if (!scenarioIdParam || !eventIdParam) {
      return {
        success: false,
        error: 'Scenario ID and Event ID required'
      }
    }

    const scenarioId = parseInt(scenarioIdParam, 10)
    const eventId = parseInt(eventIdParam, 10)

    if (isNaN(scenarioId) || isNaN(eventId)) {
      return {
        success: false,
        error: 'Invalid scenario ID or event ID'
      }
    }

    const body = await readBody(event)
    const parsed = updateEventSchema.safeParse(body)

    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      }
    }

    const { eventName, description, eventType } = parsed.data

    // Verify the event exists and belongs to this scenario
    const existing = await db.query.accountingEvents.findFirst({
      where: and(
        eq(accountingEvents.id, eventId),
        eq(accountingEvents.scenarioId, scenarioId)
      ),
    })

    if (!existing) {
      event.node.res.statusCode = 404
      return {
        success: false,
        error: 'Event not found'
      }
    }

    // If renaming, check for name conflict within the same scenario
    if (eventName && eventName !== existing.eventName) {
      const conflict = await db.query.accountingEvents.findFirst({
        where: and(
          eq(accountingEvents.scenarioId, scenarioId),
          sql`LOWER(${accountingEvents.eventName}) = LOWER(${eventName})`
        ),
      })

      if (conflict && conflict.id !== eventId) {
        event.node.res.statusCode = 409
        return {
          success: false,
          error: `Event name "${eventName}" already exists in this scenario`
        }
      }
    }

    // Build update payload
    const updateData: Record<string, any> = { updatedAt: new Date() }
    if (eventName !== undefined) updateData.eventName = eventName
    if (description !== undefined) updateData.description = description
    if (eventType !== undefined) updateData.eventType = eventType

    const [updated] = await db
      .update(accountingEvents)
      .set(updateData)
      .where(eq(accountingEvents.id, eventId))
      .returning()

    return {
      success: true,
      data: updated
    }
  } catch (error: any) {
    console.error('Failed to update accounting event:', error)
    return {
      success: false,
      error: error.message || 'Failed to update accounting event'
    }
  }
})
