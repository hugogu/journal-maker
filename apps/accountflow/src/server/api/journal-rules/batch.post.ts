import { defineEventHandler, readBody } from 'h3'
import { db } from '../../db'
import { journalRules, accounts } from '../../db/schema'
import { eq, like } from 'drizzle-orm'
import { findOrCreateEvent } from '../../db/queries/analysis'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { scenarioId, messageId, rules } = body

    if (!scenarioId || !messageId || !Array.isArray(rules) || rules.length === 0) {
      return {
        success: false,
        error: 'Scenario ID, message ID and rules array are required'
      }
    }

    // Process rules and resolve account codes to IDs
    const processedRules = await Promise.all(
      rules.map(async (rule: any) => {
        let debitAccountId = null
        let creditAccountId = null

        // Resolve debit account code to ID
        if (rule.debitAccountId && typeof rule.debitAccountId === 'string') {
          const debitAccount = await db.query.accounts.findFirst({
            where: like(accounts.code, rule.debitAccountId)
          })
          debitAccountId = debitAccount?.id || null
        } else if (rule.debitAccountId && typeof rule.debitAccountId === 'number') {
          debitAccountId = rule.debitAccountId
        }

        // Resolve credit account code to ID
        if (rule.creditAccountId && typeof rule.creditAccountId === 'string') {
          const creditAccount = await db.query.accounts.findFirst({
            where: like(accounts.code, rule.creditAccountId)
          })
          creditAccountId = creditAccount?.id || null
        } else if (rule.creditAccountId && typeof rule.creditAccountId === 'number') {
          creditAccountId = rule.creditAccountId
        }

        // Resolve event entity
        let eventId: number | null = null
        if (rule.eventName) {
          eventId = await findOrCreateEvent(
            Number(scenarioId),
            rule.eventName,
            rule.eventDescription || null,
            Number(messageId)
          )
        }

        return {
          scenarioId: Number(scenarioId),
          messageId: Number(messageId),
          eventId,
          ruleKey: rule.eventName || rule.id,
          eventName: rule.eventName,
          eventDescription: rule.eventDescription || null,
          debitAccountId,
          creditAccountId,
          conditions: rule.conditions || {},
          amountFormula: rule.amountFormula || null,
          debitSide: rule.debitSide || {},
          creditSide: rule.creditSide || {},
          triggerType: rule.triggerType || 'manual',
          status: 'confirmed' as const
        }
      })
    )

    // Batch insert rules
    const createdRules = await db.insert(journalRules)
      .values(processedRules)
      .returning()

    console.log('=== DEBUG: Batch Save Rules ===')
    console.log('Processed rules:', processedRules)
    console.log('Created rules:', createdRules)

    return {
      success: true,
      data: createdRules,
      message: `Successfully saved ${createdRules.length} rules`
    }
  } catch (error: any) {
    console.error('Failed to batch save journal rules:', error)
    return {
      success: false,
      error: error.message || 'Failed to save rules'
    }
  }
})
