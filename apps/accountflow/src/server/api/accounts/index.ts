import { db } from '../../db'
import { accounts } from '../../db/schema'
import { createAccountSchema, updateAccountSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)
    const companyId = 1 // TODO: Get from session

    if (method === 'GET') {
      const allAccounts = await db.query.accounts.findMany({
        where: eq(accounts.companyId, companyId),
        orderBy: accounts.code,
      })
      return successResponse(allAccounts)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const data = createAccountSchema.parse(body)
      
      // Check for duplicate code
      const existing = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.companyId, companyId),
          eq(accounts.code, data.code)
        )
      })
      
      if (existing) {
        throw new AppError(400, '科目代码已存在')
      }
      
      const [account] = await db.insert(accounts).values({
        ...data,
        companyId,
      }).returning()
      
      return successResponse(account)
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
