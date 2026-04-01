import { db } from '../../../db'
import { accounts, systemAccounts } from '../../../db/schema'
import { updateAccountSchema } from '../../../utils/schemas'
import { AppError, handleError, successResponse } from '../../../utils/error'
import { eq, and } from 'drizzle-orm'
import { defineEventHandler, readBody, getRouterParam } from 'h3'

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

    const body = await readBody(event)
    const data = updateAccountSchema.parse(body)
    const { systemIds, ...accountData } = data as any

    // Check for duplicate code if updating code
    if (accountData.code && accountData.code !== account.code) {
      const existing = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.companyId, companyId),
          eq(accounts.code, accountData.code)
        )
      })
      
      if (existing) {
        throw new AppError(400, '科目代码已存在')
      }
    }

    // Update account
    const [updated] = await db.update(accounts)
      .set({
        ...accountData,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId))
      .returning()

    // Update system assignments if provided
    if (systemIds !== undefined) {
      // Remove all existing assignments
      await db.delete(systemAccounts)
        .where(eq(systemAccounts.accountId, accountId))

      // Add new assignments
      if (systemIds.length > 0) {
        const assignments = systemIds.map((systemId: number) => ({
          systemId,
          accountId,
        }))
        await db.insert(systemAccounts).values(assignments).onConflictDoNothing()
      }
    }

    return successResponse(updated)
  } catch (error) {
    return handleError(event, error)
  }
})
