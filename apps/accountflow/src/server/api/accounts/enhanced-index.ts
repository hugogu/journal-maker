import { defineEventHandler, createError, getRouterParam, readBody, getMethod } from 'h3'
import { db } from '../../db'
import { accounts, journalRules, scenarios } from '../../db/schema'
import { SchemaValidator, DatabaseValidator } from '../../utils/schema-validator'
import { AccountSchema, JournalRuleSchema } from '../../utils/schemas'
import { eq } from 'drizzle-orm'

/**
 * Enhanced API endpoint with comprehensive schema validation
 * This replaces the existing accounts API with stronger validation
 */
export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)
    const companyId = 1 // TODO: Get from session

    if (method === 'GET') {
      const allAccounts = await db.query.accounts.findMany({
        where: eq(accounts.companyId, companyId),
        orderBy: accounts.code,
      })
      
      // Validate accounts before returning
      const validatedAccounts = SchemaValidator.validateAccounts(allAccounts)
      return { data: validatedAccounts }
    }

    if (method === 'POST') {
      const body = await readBody(event)
      
      // Get existing accounts for duplicate checking
      const existingAccounts = await db.query.accounts.findMany({
        where: eq(accounts.companyId, companyId)
      })
      
      // Validate account data with business logic
      const validatedAccount = DatabaseValidator.validateAccountForInsert(
        body,
        existingAccounts
      )
      
      // Insert validated account
      const [account] = await db.insert(accounts).values({
        ...validatedAccount,
        companyId,
      }).returning()
      
      return { data: account }
    }

    if (method === 'PUT') {
      const body = await readBody(event)
      const accountId = body.id
      
      if (!accountId) {
        throw createError({ statusCode: 400, message: 'Account ID is required for update' })
      }
      
      // Get existing account and all accounts for validation
      const existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.id, accountId)
      })
      
      if (!existingAccount) {
        throw createError({ statusCode: 404, message: 'Account not found' })
      }
      
      const allAccounts = await db.query.accounts.findMany({
        where: eq(accounts.companyId, companyId)
      })
      
      // Validate updated account data
      const validatedAccount = SchemaValidator.validateAccount(body)
      
      // Check for duplicate code (excluding current account)
      const duplicate = allAccounts.find(acc => 
        acc.code === validatedAccount.code && acc.id !== accountId
      )
      if (duplicate) {
        throw createError({ statusCode: 400, message: 'Account code already exists' })
      }
      
      // Update account
      const [updatedAccount] = await db.update(accounts)
        .set({ ...validatedAccount, updatedAt: new Date() })
        .where(eq(accounts.id, accountId))
        .returning()
      
      return { data: updatedAccount }
    }

    throw createError({ statusCode: 405, message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Error in accounts API:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Internal server error'
    })
  }
})
