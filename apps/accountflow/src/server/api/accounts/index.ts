import { db } from '../../db'
import { accounts, scenarios, sampleTransactions, journalRules, systemAccounts } from '../../db/schema'
import { createAccountSchema, updateAccountSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { eq, and, like, inArray } from 'drizzle-orm'
import { defineEventHandler, getMethod, readBody, setResponseStatus, getRouterParam, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)
    const companyId = 1 // TODO: Get from session

    if (method === 'GET') {
      const query = getQuery(event)
      const systemId = query.systemId ? Number(query.systemId) : undefined
      
      let accountsList
      if (systemId) {
        // Get accounts for specific system
        const systemAccountsData = await db.query.systemAccounts.findMany({
          where: eq(systemAccounts.systemId, systemId),
          with: {
            account: true,
          },
        })
        accountsList = systemAccountsData.map(sa => sa.account)
      } else {
        // Get all accounts for company
        accountsList = await db.query.accounts.findMany({
          where: eq(accounts.companyId, companyId),
          orderBy: accounts.code,
        })
      }
      
      return successResponse(accountsList)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const data = createAccountSchema.parse(body)
      const { systemIds, ...accountData } = data as any
      
      // Check for duplicate code
      const existing = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.companyId, companyId),
          eq(accounts.code, accountData.code)
        )
      })
      
      if (existing) {
        throw new AppError(400, '科目代码已存在')
      }
      
      const [account] = await db.insert(accounts).values({
        ...accountData,
        companyId,
      }).returning()
      
      // Assign to systems if provided
      if (systemIds && systemIds.length > 0) {
        const assignments = systemIds.map((systemId: number) => ({
          systemId,
          accountId: account.id,
        }))
        await db.insert(systemAccounts).values(assignments).onConflictDoNothing()
      }
      
      return successResponse(account)
    }

    if (method === 'DELETE') {
      const accountId = Number(getRouterParam(event, 'id'))
      if (!accountId) throw new AppError(400, 'Invalid account ID')
      
      // Check if account exists
      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, accountId)
      })
      
      if (!account) {
        throw new AppError(404, 'Account not found')
      }
      
      // Check usage in scenarios (JSON search for account code)
      const scenariosUsingAccount = await db.query.scenarios.findMany({
        where: like(scenarios.description, `%${account.code}%`)
      })
      
      // Check usage in sample transactions
      const transactionsUsingAccount = await db.query.sampleTransactions.findMany({
        where: like(sampleTransactions.entries, `%${account.code}%`)
      })
      
      // Check usage in journal rules
      const debitRulesUsingAccount = await db.query.journalRules.findMany({
        where: eq(journalRules.debitAccountId, accountId)
      })
      
      const creditRulesUsingAccount = await db.query.journalRules.findMany({
        where: eq(journalRules.creditAccountId, accountId)
      })
      const scenarioIds = await db.select({ id: scenarios.id })
        .from(scenarios)
        .where(eq(scenarios.companyId, companyId))

      const candidateRules = scenarioIds.length
        ? await db.query.journalRules.findMany({
            where: inArray(journalRules.scenarioId, scenarioIds.map(s => s.id))
          })
        : []

      const hasAccountReference = (value: any): boolean => {
        if (!value) return false
        if (Array.isArray(value)) return value.some(hasAccountReference)
        if (typeof value === 'object') {
          if (value.accountId === accountId || value.accountCode === account.code || value.code === account.code) {
            return true
          }
          return Object.values(value).some(hasAccountReference)
        }
        return false
      }

      const structuredRulesUsingAccount = candidateRules.filter(rule =>
        hasAccountReference(rule.debitSide) || hasAccountReference(rule.creditSide)
      )

      const rulesUsingAccount = [...debitRulesUsingAccount, ...creditRulesUsingAccount, ...structuredRulesUsingAccount]
      
      const usageCount = scenariosUsingAccount.length + transactionsUsingAccount.length + rulesUsingAccount.length
      
      if (usageCount > 0) {
        throw new AppError(400, `无法删除科目：该科目被 ${usageCount} 个地方使用（场景：${scenariosUsingAccount.length}，交易：${transactionsUsingAccount.length}，规则：${rulesUsingAccount.length}）`)
      }
      
      // Delete the account
      await db.delete(accounts).where(eq(accounts.id, accountId))
      
      return successResponse({ message: '科目已删除' })
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
