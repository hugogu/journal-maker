import { db } from '../db'
import { accounts, systemAccounts } from '../schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function getAccountsByCompany(companyId: number) {
  return db.query.accounts.findMany({
    where: eq(accounts.companyId, companyId),
    orderBy: accounts.code,
  })
}

export async function getAccountsBySystem(systemId: number, companyId: number) {
  const systemAccountsData = await db.query.systemAccounts.findMany({
    where: eq(systemAccounts.systemId, systemId),
    with: {
      account: true,
    },
  })

  return systemAccountsData.map(sa => sa.account)
}

export async function getAccountById(accountId: number, companyId: number) {
  return db.query.accounts.findFirst({
    where: and(
      eq(accounts.id, accountId),
      eq(accounts.companyId, companyId)
    ),
  })
}

export async function getAccountSystems(accountId: number) {
  return db.query.systemAccounts.findMany({
    where: eq(systemAccounts.accountId, accountId),
    with: {
      system: true,
    },
  })
}

export async function assignAccountToSystems(accountId: number, systemIds: number[]) {
  const values = systemIds.map(systemId => ({
    systemId,
    accountId,
  }))

  await db.insert(systemAccounts)
    .values(values)
    .onConflictDoNothing()
}

export async function removeAccountFromSystems(accountId: number, systemIds: number[]) {
  await db.delete(systemAccounts)
    .where(
      and(
        eq(systemAccounts.accountId, accountId),
        inArray(systemAccounts.systemId, systemIds)
      )
    )
}

export async function setAccountSystems(accountId: number, systemIds: number[]) {
  // Remove all existing assignments
  await db.delete(systemAccounts)
    .where(eq(systemAccounts.accountId, accountId))

  // Add new assignments
  if (systemIds.length > 0) {
    const values = systemIds.map(systemId => ({
      systemId,
      accountId,
    }))

    await db.insert(systemAccounts)
      .values(values)
      .onConflictDoNothing()
  }
}

export async function getAccountsNotInSystem(systemId: number, companyId: number) {
  // Get all accounts for company
  const allAccounts = await getAccountsByCompany(companyId)

  // Get accounts already in system
  const systemAccountIds = await db.query.systemAccounts.findMany({
    where: eq(systemAccounts.systemId, systemId),
  }).then(sas => sas.map(sa => sa.accountId))

  // Filter out accounts already in system
  return allAccounts.filter(account => !systemAccountIds.includes(account.id))
}
