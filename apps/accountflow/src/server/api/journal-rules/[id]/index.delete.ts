import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { journalRules, systemRules } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const ruleId = idParam ? parseInt(idParam, 10) : null

    if (!ruleId || isNaN(ruleId)) {
      throw createError({ statusCode: 400, message: 'Invalid rule ID' })
    }

    // First, delete related system assignments
    await db.delete(systemRules).where(eq(systemRules.ruleId, ruleId))

    // Then delete the rule
    const [deletedRule] = await db
      .delete(journalRules)
      .where(eq(journalRules.id, ruleId))
      .returning()

    if (!deletedRule) {
      throw createError({ statusCode: 404, message: 'Journal rule not found' })
    }

    return {
      success: true,
      message: 'Journal rule deleted successfully',
      data: { id: ruleId },
    }
  } catch (error: any) {
    console.error('Error deleting journal rule:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Failed to delete journal rule',
    })
  }
})
