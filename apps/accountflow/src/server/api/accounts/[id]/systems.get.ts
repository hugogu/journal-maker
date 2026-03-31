import { db } from '../../db'
import { accounts, systemAccounts } from '../../db/schema'
import { AppError, handleError, successResponse } from '../../utils/error'
import { eq, and } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const accountId = Number(getRouterParam(event, 'id'))
    const companyId = 1 // TODO: Get from session

    if (!accountId) throw new AppError(400, 'Invalid account ID')

    // Check if account exists
    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, accountId),
        eq(accounts.companyId, companyId)
      )
    })

    if (!account) {
      throw new AppError(404, '科目不存在')
    }

    // Get system assignments
    const systemAccountsData = await db.query.systemAccounts.findMany({
      where: eq(systemAccounts.accountId, accountId),
      with: {
        system: true,
      },
    })

    const systems = systemAccountsData.map(sa => ({
      systemId: sa.systemId,
      systemName: sa.system?.name,
      systemType: sa.system?.type,
    }))

    return successResponse(systems)
  } catch (error) {
    return handleError(event, error)
  }
})
