import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { db } from '../../../db'
import { journalRules } from '../../../db/schema'
import { structuredJournalRuleSchema } from '../../../utils/schemas'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'ruleId')
    const ruleId = idParam ? parseInt(idParam, 10) : null

    if (!ruleId || isNaN(ruleId)) {
      throw createError({ statusCode: 400, message: 'Invalid rule ID' })
    }

    const body = await readBody(event)
    const data = structuredJournalRuleSchema.parse(body)

    const [updatedRule] = await db
      .update(journalRules)
      .set({
        debitSide: data.debitSide,
        creditSide: data.creditSide,
        triggerType: data.triggerType,
        status: data.status,
        amountFormula: data.amountFormula ?? null,
        updatedAt: new Date(),
      })
      .where(eq(journalRules.id, ruleId))
      .returning()

    if (!updatedRule) {
      throw createError({ statusCode: 404, message: 'Journal rule not found' })
    }

    return { data: updatedRule }
  } catch (error: any) {
    console.error('Error updating journal rule:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Failed to update journal rule',
    })
  }
})
