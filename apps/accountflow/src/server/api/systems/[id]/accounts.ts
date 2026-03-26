import { db } from '../../../db'
import { accountingSystems, systemAccounts, accounts } from '../../../schema'
import { assignAccountsSchema } from '../../../utils/schemas'
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

    // GET /api/systems/:id/accounts - List accounts for system
    if (method === 'GET') {
      const systemAccountsData = await db.query.systemAccounts.findMany({
        where: eq(systemAccounts.systemId, systemId),
        with: {
          account: true,
        },
      })

      const accounts = systemAccountsData.map(sa => sa.account)

      return successResponse({ accounts })
    }

    // POST /api/systems/:id/accounts - Assign accounts to system
    if (method === 'POST') {
      const body = await readBody(event)
      const data = assignAccountsSchema.parse(body)

      // Verify all accounts exist and belong to company
      const existingAccounts = await db.query.accounts.findMany({
        where: and(
          eq(accounts.companyId, companyId),
          inArray(accounts.id, data.accountIds)
        ),
      })

      if (existingAccounts.length !== data.accountIds.length) {
        throw new AppError(400, '部分科目不存在')
      }

      // Insert assignments (ignore duplicates)
      const values = data.accountIds.map(accountId => ({
        systemId,
        accountId,
      }))

      await db.insert(systemAccounts)
        .values(values)
        .onConflictDoNothing()

      return successResponse({ success: true, assigned: data.accountIds.length })
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    return handleError(event, error)
  }
})
