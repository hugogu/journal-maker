import { eq } from 'drizzle-orm'
import { db } from '../index'
import { confirmedAnalysis, scenarios } from '../schema'
import type { AccountingSubject, AccountingRule } from '../../../types'

export interface ConfirmedAnalysisData {
  id: number
  scenarioId: number
  subjects: AccountingSubject[]
  rules: AccountingRule[]
  diagramMermaid: string | null
  sourceMessageId: number | null
  confirmedAt: Date
  updatedAt: Date
}

export interface UpsertConfirmedAnalysisInput {
  scenarioId: number
  subjects: AccountingSubject[]
  rules: AccountingRule[]
  diagramMermaid?: string | null
  sourceMessageId?: number | null
}

/**
 * Get confirmed analysis for a scenario
 */
export async function getConfirmedAnalysis(
  scenarioId: number
): Promise<ConfirmedAnalysisData | null> {
  const result = await db
    .select()
    .from(confirmedAnalysis)
    .where(eq(confirmedAnalysis.scenarioId, scenarioId))
    .limit(1)

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  return {
    id: row.id,
    scenarioId: row.scenarioId,
    subjects: (row.subjects as AccountingSubject[]) || [],
    rules: (row.rules as AccountingRule[]) || [],
    diagramMermaid: row.diagramMermaid,
    sourceMessageId: row.sourceMessageId,
    confirmedAt: row.confirmedAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * Create or update confirmed analysis (upsert)
 */
export async function upsertConfirmedAnalysis(
  input: UpsertConfirmedAnalysisInput
): Promise<ConfirmedAnalysisData> {
  const now = new Date()

  // Check if exists
  const existing = await getConfirmedAnalysis(input.scenarioId)

  if (existing) {
    // Update existing record
    const result = await db
      .update(confirmedAnalysis)
      .set({
        subjects: input.subjects,
        rules: input.rules,
        diagramMermaid: input.diagramMermaid ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        updatedAt: now,
      })
      .where(eq(confirmedAnalysis.scenarioId, input.scenarioId))
      .returning()

    const row = result[0]
    return {
      id: row.id,
      scenarioId: row.scenarioId,
      subjects: (row.subjects as AccountingSubject[]) || [],
      rules: (row.rules as AccountingRule[]) || [],
      diagramMermaid: row.diagramMermaid,
      sourceMessageId: row.sourceMessageId,
      confirmedAt: row.confirmedAt,
      updatedAt: row.updatedAt,
    }
  } else {
    // Insert new record
    const result = await db
      .insert(confirmedAnalysis)
      .values({
        scenarioId: input.scenarioId,
        subjects: input.subjects,
        rules: input.rules,
        diagramMermaid: input.diagramMermaid ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        confirmedAt: now,
        updatedAt: now,
      })
      .returning()

    const row = result[0]
    return {
      id: row.id,
      scenarioId: row.scenarioId,
      subjects: (row.subjects as AccountingSubject[]) || [],
      rules: (row.rules as AccountingRule[]) || [],
      diagramMermaid: row.diagramMermaid,
      sourceMessageId: row.sourceMessageId,
      confirmedAt: row.confirmedAt,
      updatedAt: row.updatedAt,
    }
  }
}

/**
 * Delete confirmed analysis for a scenario
 */
export async function deleteConfirmedAnalysis(scenarioId: number): Promise<boolean> {
  const result = await db
    .delete(confirmedAnalysis)
    .where(eq(confirmedAnalysis.scenarioId, scenarioId))
    .returning({ id: confirmedAnalysis.id })

  return result.length > 0
}

/**
 * Check if scenario exists
 */
export async function scenarioExists(scenarioId: number): Promise<boolean> {
  const result = await db
    .select({ id: scenarios.id })
    .from(scenarios)
    .where(eq(scenarios.id, scenarioId))
    .limit(1)

  return result.length > 0
}
