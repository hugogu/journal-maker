// ============================================================================
// This file provides backward compatibility with the old confirmed_analysis API
// It delegates to the new normalized storage in analysis.ts
// ============================================================================

import { eq } from 'drizzle-orm'
import { db } from '../index'
import { scenarios } from '../schema'
import type { AccountingSubject, AccountingRule } from '../../../types'
import {
  getConfirmedAnalysis as getConfirmedAnalysisNew,
  saveAndConfirmAnalysis,
  clearConfirmedAnalysis,
} from './analysis'

export interface ConfirmedAnalysisData {
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
 * Delegates to new normalized storage
 */
export async function getConfirmedAnalysis(scenarioId: number): Promise<ConfirmedAnalysisData | null> {
  const result = await getConfirmedAnalysisNew(scenarioId)

  if (!result || result.subjects.length === 0) {
    return null
  }

  return {
    scenarioId: result.scenarioId || scenarioId,
    subjects: result.subjects,
    rules: result.rules,
    diagramMermaid: result.diagramMermaid,
    sourceMessageId: result.sourceMessageId,
    confirmedAt: result.confirmedAt,
    updatedAt: result.updatedAt,
  }
}

/**
 * Create or update confirmed analysis (upsert)
 * Delegates to new normalized storage
 */
export async function upsertConfirmedAnalysis(
  input: UpsertConfirmedAnalysisInput
): Promise<ConfirmedAnalysisData> {
  const result = await saveAndConfirmAnalysis(
    input.scenarioId,
    input.subjects,
    input.rules,
    input.diagramMermaid,
    input.sourceMessageId
  )

  return {
    scenarioId: result.scenarioId || input.scenarioId,
    subjects: result.subjects,
    rules: result.rules,
    diagramMermaid: result.diagramMermaid,
    sourceMessageId: result.sourceMessageId,
    confirmedAt: result.confirmedAt,
    updatedAt: result.updatedAt,
  }
}

/**
 * Delete confirmed analysis for a scenario
 * Delegates to new normalized storage
 */
export async function deleteConfirmedAnalysis(scenarioId: number): Promise<boolean> {
  try {
    await clearConfirmedAnalysis(scenarioId)
    return true
  } catch (error) {
    return false
  }
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
