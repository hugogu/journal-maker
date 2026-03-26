import { db } from '../../../db'
import { accountingSystems, systemAccounts, systemRules, systemPreferences, accounts, journalRules } from '../../../schema'
import { AppError, handleError, successResponse } from '../../../utils/error'
import { eq, and } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const systemId = Number(getRouterParam(event, 'id'))
    const companyId = 1 // TODO: Get from session

    if (!systemId) throw new AppError(400, 'Invalid system ID')

    // Get system
    const system = await db.query.accountingSystems.findFirst({
      where: and(
        eq(accountingSystems.id, systemId),
        eq(accountingSystems.companyId, companyId)
      ),
    })

    if (!system) {
      throw new AppError(404, '体系不存在')
    }

    // Get accounts with hierarchy
    const systemAccountsData = await db.query.systemAccounts.findMany({
      where: eq(systemAccounts.systemId, systemId),
      with: {
        account: true,
      },
    })

    const accountsList = systemAccountsData.map(sa => sa.account)

    // Build account hierarchy
    const buildHierarchy = (accounts: any[], parentId: number | null = null): any[] => {
      return accounts
        .filter(a => a.parentId === parentId)
        .map(account => ({
          ...account,
          children: buildHierarchy(accounts, account.id),
        }))
    }

    const accountHierarchy = buildHierarchy(accountsList)

    // Get rules with account details
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

    const rulesWithAccounts = systemRulesData.map(sr => ({
      id: sr.rule.id,
      name: sr.rule.ruleKey,
      description: sr.rule.eventDescription,
      debitAccount: sr.rule.debitAccount ? {
        id: sr.rule.debitAccount.id,
        code: sr.rule.debitAccount.code,
        name: sr.rule.debitAccount.name,
      } : null,
      creditAccount: sr.rule.creditAccount ? {
        id: sr.rule.creditAccount.id,
        code: sr.rule.creditAccount.code,
        name: sr.rule.creditAccount.name,
      } : null,
      conditions: sr.rule.conditions,
    }))

    // Get preferences
    const preferencesData = await db.query.systemPreferences.findMany({
      where: eq(systemPreferences.systemId, systemId),
    })

    const preferences = preferencesData.reduce((acc, pref) => {
      acc[pref.key] = pref.value
      return acc
    }, {} as Record<string, any>)

    return successResponse({
      system: {
        id: system.id,
        name: system.name,
        description: system.description,
        type: system.type,
        status: system.status,
      },
      accounts: accountHierarchy,
      rules: rulesWithAccounts,
      preferences,
    })
  } catch (error) {
    return handleError(event, error)
  }
})
