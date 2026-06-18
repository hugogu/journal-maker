import { db } from '..'
import { journalRules, systemRules, accounts } from '../schema'
import { eq, and, inArray, like } from 'drizzle-orm'
import type { AccountingRule } from '../../../types'

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

/**
 * Save rules from analysis confirmation to journal_rules table
 * This allows rules to appear in the rule management page
 */
export async function saveRulesToJournalRules({
  scenarioId,
  rules,
  sourceMessageId,
  systemIds,
}: {
  scenarioId: number
  rules: AccountingRule[]
  sourceMessageId?: number | null
  systemIds?: number[]
}) {
  if (!rules || rules.length === 0) return []

  const createdRules = []

  for (const rule of rules) {
    // Resolve account codes to IDs
    let debitAccountId: number | null = null
    let creditAccountId: number | null = null

    if (rule.debitAccount) {
      const debitAcc = await db.query.accounts.findFirst({
        where: like(accounts.code, rule.debitAccount),
      })
      debitAccountId = debitAcc?.id || null
    }

    if (rule.creditAccount) {
      const creditAcc = await db.query.accounts.findFirst({
        where: like(accounts.code, rule.creditAccount),
      })
      creditAccountId = creditAcc?.id || null
    }

    // Generate a unique rule key
    const ruleKey = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const eventName = rule.id || rule.description.slice(0, 100)

    // Check if rule already exists for this scenario with same event name
    const existingRule = await db.query.journalRules.findFirst({
      where: and(
        eq(journalRules.scenarioId, scenarioId),
        eq(journalRules.eventName, eventName)
      ),
    })

    if (existingRule) {
      // Update existing rule
      const [updated] = await db.update(journalRules)
        .set({
          eventDescription: rule.description,
          debitAccountId,
          creditAccountId,
          debitSide: rule.debitAccount ? {
            accountCode: rule.debitAccount,
            accountName: '',
          } : null,
          creditSide: rule.creditAccount ? {
            accountCode: rule.creditAccount,
            accountName: '',
          } : null,
          conditions: rule.condition ? { condition: rule.condition } : {},
          updatedAt: new Date(),
        })
        .where(eq(journalRules.id, existingRule.id))
        .returning()

      createdRules.push(updated)

      // Update system assignments if provided
      if (systemIds && systemIds.length > 0) {
        await setRuleSystems(existingRule.id, systemIds)
      }
    } else {
      // Create new rule
      const [created] = await db.insert(journalRules)
        .values({
          scenarioId,
          messageId: sourceMessageId,
          ruleKey,
          eventName,
          eventDescription: rule.description,
          debitAccountId,
          creditAccountId,
          debitSide: rule.debitAccount ? {
            accountCode: rule.debitAccount,
            accountName: '',
          } : null,
          creditSide: rule.creditAccount ? {
            accountCode: rule.creditAccount,
            accountName: '',
          } : null,
          conditions: rule.condition ? { condition: rule.condition } : {},
          status: 'confirmed',
          triggerType: 'manual',
        })
        .returning()

      createdRules.push(created)

      // Assign to systems if provided
      if (systemIds && systemIds.length > 0 && created) {
        await assignRuleToSystems(created.id, systemIds)
      }
    }
  }

  return createdRules
}
