import { db } from '../../../db'
import { accountingSystems, systemRules, journalRules } from '../../../db/schema'
import { AppError, handleError, successResponse } from '../../../utils/error'
import { eq, and, inArray } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, readBody, getMethod } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const systemId = Number(getRouterParam(event, 'id'))
    const companyId = 1 // TODO: Get from session
    const method = getMethod(event)

    if (!systemId) throw new AppError(400, 'Invalid system ID')

    // Verify system exists
    const system = await db.query.accountingSystems.findFirst({
      where: and(
        eq(accountingSystems.id, systemId),
        eq(accountingSystems.companyId, companyId)
      ),
    })

    if (!system) {
      throw new AppError(404, '体系不存在')
    }

    // GET /api/systems/:id/rules - List rules for system
    if (method === 'GET') {
      const systemRulesData = await db.query.systemRules.findMany({
        where: eq(systemRules.systemId, systemId),
        with: {
          rule: {
            with: {
              debitAccount: true,
              creditAccount: true,
            },
          },
        },
      })

      const rules = systemRulesData.map(sr => ({
        ...sr.rule,
        debitAccount: sr.rule.debitAccount,
        creditAccount: sr.rule.creditAccount,
      }))

      return successResponse({ rules })
    }

    // POST /api/systems/:id/rules - Assign rules to system
    if (method === 'POST') {
      const body = await readBody(event)
      const { ruleIds } = body

      if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
        throw new AppError(400, 'ruleIds must be a non-empty array')
      }

      // Verify all rules exist
      const existingRules = await db.query.journalRules.findMany({
        where: inArray(journalRules.id, ruleIds),
      })

      if (existingRules.length !== ruleIds.length) {
        throw new AppError(400, '部分规则不存在')
      }

      // Insert assignments (ignore duplicates)
      const values = ruleIds.map(ruleId => ({
        systemId,
        ruleId,
      }))

      await db.insert(systemRules)
        .values(values)
        .onConflictDoNothing()

      return successResponse({ success: true, assigned: ruleIds.length })
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    return handleError(event, error)
  }
})
