import { db } from '..'
import { journalRules, systemRules } from '../schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function getRulesByScenario(scenarioId: number) {
  return db.query.journalRules.findMany({
    where: eq(journalRules.scenarioId, scenarioId),
    with: {
      debitAccount: true,
      creditAccount: true,
    },
  })
}

export async function getRulesBySystem(systemId: number) {
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

  return systemRulesData.map(sr => sr.rule)
}

export async function getRuleById(ruleId: number) {
  return db.query.journalRules.findFirst({
    where: eq(journalRules.id, ruleId),
    with: {
      debitAccount: true,
      creditAccount: true,
    },
  })
}

export async function getRuleSystems(ruleId: number) {
  return db.query.systemRules.findMany({
    where: eq(systemRules.ruleId, ruleId),
    with: {
      system: true,
    },
  })
}

export async function assignRuleToSystems(ruleId: number, systemIds: number[]) {
  const values = systemIds.map(systemId => ({
    systemId,
    ruleId,
  }))

  await db.insert(systemRules)
    .values(values)
    .onConflictDoNothing()
}

export async function removeRuleFromSystems(ruleId: number, systemIds: number[]) {
  await db.delete(systemRules)
    .where(
      and(
        eq(systemRules.ruleId, ruleId),
        inArray(systemRules.systemId, systemIds)
      )
    )
}

export async function setRuleSystems(ruleId: number, systemIds: number[]) {
  // Remove all existing assignments
  await db.delete(systemRules)
    .where(eq(systemRules.ruleId, ruleId))

  // Add new assignments
  if (systemIds.length > 0) {
    const values = systemIds.map(systemId => ({
      systemId,
      ruleId,
    }))

    await db.insert(systemRules)
      .values(values)
      .onConflictDoNothing()
  }
}
