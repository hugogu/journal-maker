import { db } from '../index'
import { scenarios, journalRules, accounts } from '../schema'
import { eq, and, inArray } from 'drizzle-orm'

/**
 * Fetch confirmed journal rules and their referenced accounts for export.
 * Returns scenario metadata + rules grouped by scenario, plus deduplicated accounts.
 */
export async function getExportDataForScenarios(scenarioIds: number[], companyId: number) {
  // Fetch scenarios
  const scenarioRows = await db.query.scenarios.findMany({
    where: and(
      inArray(scenarios.id, scenarioIds),
      eq(scenarios.companyId, companyId),
    ),
  })

  // Fetch confirmed rules for all requested scenarios
  const confirmedRules = await db.query.journalRules.findMany({
    where: and(
      inArray(journalRules.scenarioId, scenarioIds),
      eq(journalRules.status, 'confirmed'),
    ),
  })

  // Extract unique account codes from rules' debitSide/creditSide
  const accountCodes = new Set<string>()
  for (const rule of confirmedRules) {
    extractCodesFromSide(rule.debitSide, accountCodes)
    extractCodesFromSide(rule.creditSide, accountCodes)
  }

  // Fetch referenced accounts
  const codesArray = Array.from(accountCodes)
  const accountRows = codesArray.length > 0
    ? await db.query.accounts.findMany({
        where: and(
          eq(accounts.companyId, companyId),
          inArray(accounts.code, codesArray),
        ),
      })
    : []

  // Group rules by scenario
  const scenarioMap = new Map(scenarioRows.map((s) => [s.id, s]))
  const rulesByScenario = new Map<number, typeof confirmedRules>()
  for (const rule of confirmedRules) {
    const existing = rulesByScenario.get(rule.scenarioId) || []
    existing.push(rule)
    rulesByScenario.set(rule.scenarioId, existing)
  }

  const scenariosWithRules = scenarioRows
    .filter((s) => rulesByScenario.has(s.id))
    .map((s) => ({
      scenario: s,
      rules: rulesByScenario.get(s.id) || [],
    }))

  return {
    scenariosWithRules,
    accounts: accountRows,
    skippedScenarios: scenarioRows.filter((s) => !rulesByScenario.has(s.id)),
  }
}

function extractCodesFromSide(side: unknown, codes: Set<string>) {
  if (!side || typeof side !== 'object') return
  const obj = side as Record<string, unknown>

  if (Array.isArray(obj.entries)) {
    for (const entry of obj.entries) {
      if (entry && typeof entry === 'object' && 'accountCode' in entry) {
        codes.add(String((entry as Record<string, unknown>).accountCode))
      }
    }
  } else if (typeof obj.accountCode === 'string') {
    codes.add(obj.accountCode)
  }
}
