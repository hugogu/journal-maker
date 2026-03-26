import { db } from '../db'
import { accountingSystems, systemAccounts, systemRules, systemPreferences, accounts, journalRules } from '../schema'
import { eq, and, inArray, sql } from 'drizzle-orm'

export async function getSystemsByCompany(companyId: number, filters?: { type?: string; status?: string }) {
  let conditions = eq(accountingSystems.companyId, companyId)
  
  if (filters?.type) {
    conditions = and(conditions, eq(accountingSystems.type, filters.type))
  }
  
  if (filters?.status) {
    conditions = and(conditions, eq(accountingSystems.status, filters.status))
  }
  
  return db.query.accountingSystems.findMany({
    where: conditions,
    orderBy: accountingSystems.name,
  })
}

export async function getSystemById(systemId: number, companyId: number) {
  return db.query.accountingSystems.findFirst({
    where: and(
      eq(accountingSystems.id, systemId),
      eq(accountingSystems.companyId, companyId)
    ),
  })
}

export async function createSystem(data: {
  companyId: number
  name: string
  description?: string
  type: 'builtin' | 'custom'
  status: 'active' | 'archived'
}) {
  const [system] = await db.insert(accountingSystems).values(data).returning()
  return system
}

export async function updateSystem(
  systemId: number,
  data: Partial<{
    name: string
    description: string
    status: 'active' | 'archived'
  }>
) {
  const [system] = await db.update(accountingSystems)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(accountingSystems.id, systemId))
    .returning()
  return system
}

export async function deleteSystem(systemId: number) {
  await db.delete(accountingSystems)
    .where(eq(accountingSystems.id, systemId))
}

export async function checkSystemNameExists(companyId: number, name: string, excludeId?: number) {
  let conditions = and(
    eq(accountingSystems.companyId, companyId),
    sql`LOWER(${accountingSystems.name}) = LOWER(${name})`
  )
  
  if (excludeId) {
    conditions = and(conditions, sql`${accountingSystems.id} != ${excludeId}`)
  }
  
  return db.query.accountingSystems.findFirst({
    where: conditions,
  })
}

// System Accounts
export async function getAccountsBySystem(systemId: number) {
  return db.query.systemAccounts.findMany({
    where: eq(systemAccounts.systemId, systemId),
    with: {
      account: true,
    },
  })
}

export async function assignAccountsToSystem(systemId: number, accountIds: number[]) {
  const values = accountIds.map(accountId => ({
    systemId,
    accountId,
  }))
  
  await db.insert(systemAccounts)
    .values(values)
    .onConflictDoNothing()
}

export async function removeAccountsFromSystem(systemId: number, accountIds: number[]) {
  await db.delete(systemAccounts)
    .where(
      and(
        eq(systemAccounts.systemId, systemId),
        inArray(systemAccounts.accountId, accountIds)
      )
    )
}

// System Rules
export async function getRulesBySystem(systemId: number) {
  return db.query.systemRules.findMany({
    where: eq(systemRules.systemId, systemId),
    with: {
      rule: true,
    },
  })
}

export async function assignRulesToSystem(systemId: number, ruleIds: number[]) {
  const values = ruleIds.map(ruleId => ({
    systemId,
    ruleId,
  }))
  
  await db.insert(systemRules)
    .values(values)
    .onConflictDoNothing()
}

// System Preferences
export async function getPreferencesBySystem(systemId: number) {
  return db.query.systemPreferences.findMany({
    where: eq(systemPreferences.systemId, systemId),
  })
}

export async function setPreference(systemId: number, key: string, value: any) {
  await db.insert(systemPreferences)
    .values({
      systemId,
      key,
      value,
    })
    .onConflictDoUpdate({
      target: [systemPreferences.systemId, systemPreferences.key],
      set: {
        value,
        updatedAt: new Date(),
      },
    })
}

export async function deletePreference(systemId: number, key: string) {
  await db.delete(systemPreferences)
    .where(
      and(
        eq(systemPreferences.systemId, systemId),
        eq(systemPreferences.key, key)
      )
    )
}

// Get full system context for AI
export async function getSystemContext(systemId: number, companyId: number) {
  const system = await getSystemById(systemId, companyId)
  
  if (!system) return null
  
  const accountsData = await db.query.systemAccounts.findMany({
    where: eq(systemAccounts.systemId, systemId),
    with: {
      account: true,
    },
  })
  
  const rulesData = await db.query.systemRules.findMany({
    where: eq(systemRules.systemId, systemId),
    with: {
      rule: true,
    },
  })
  
  const preferencesData = await getPreferencesBySystem(systemId)
  
  return {
    system,
    accounts: accountsData.map(sa => sa.account),
    rules: rulesData.map(sr => sr.rule),
    preferences: preferencesData.reduce((acc, pref) => {
      acc[pref.key] = pref.value
      return acc
    }, {} as Record<string, any>),
  }
}
