import { db } from '../index'
import { analysisSubjects, analysisEntries, analysisDiagrams } from '../schema'
import { eq, and, desc } from 'drizzle-orm'
import type { AccountingSubject, AccountingRule, AnalysisEntryLine } from '../../../types'

// ============================================================================
// ANALYSIS SUBJECTS
// ============================================================================

export async function getAnalysisSubjects(scenarioId: number, confirmedOnly = false) {
  const conditions = confirmedOnly
    ? and(eq(analysisSubjects.scenarioId, scenarioId), eq(analysisSubjects.isConfirmed, true))
    : eq(analysisSubjects.scenarioId, scenarioId)

  return db.query.analysisSubjects.findMany({
    where: conditions,
    orderBy: [analysisSubjects.code],
  })
}

export async function saveAnalysisSubjects(
  scenarioId: number,
  subjects: AccountingSubject[],
  sourceMessageId?: number
) {
  const results = []

  for (const subject of subjects) {
    // Use upsert pattern: try to update, if not exists then insert
    const existing = await db.query.analysisSubjects.findFirst({
      where: and(
        eq(analysisSubjects.scenarioId, scenarioId),
        eq(analysisSubjects.code, subject.code)
      ),
    })

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(analysisSubjects)
        .set({
          name: subject.name,
          direction: subject.direction,
          description: subject.description || null,
          sourceMessageId: sourceMessageId || existing.sourceMessageId,
          updatedAt: new Date(),
        })
        .where(eq(analysisSubjects.id, existing.id))
        .returning()
      results.push(updated)
    } else {
      // Insert new
      const [inserted] = await db
        .insert(analysisSubjects)
        .values({
          scenarioId,
          sourceMessageId: sourceMessageId || null,
          code: subject.code,
          name: subject.name,
          direction: subject.direction,
          description: subject.description || null,
          isConfirmed: false,
        })
        .returning()
      results.push(inserted)
    }
  }

  return results
}

export async function confirmAnalysisSubjects(scenarioId: number) {
  return db
    .update(analysisSubjects)
    .set({ isConfirmed: true, updatedAt: new Date() })
    .where(eq(analysisSubjects.scenarioId, scenarioId))
    .returning()
}

export async function deleteAnalysisSubjects(scenarioId: number) {
  return db
    .delete(analysisSubjects)
    .where(eq(analysisSubjects.scenarioId, scenarioId))
}

// ============================================================================
// ANALYSIS ENTRIES (RULES)
// ============================================================================

export async function getAnalysisEntries(scenarioId: number, confirmedOnly = false) {
  const conditions = confirmedOnly
    ? and(eq(analysisEntries.scenarioId, scenarioId), eq(analysisEntries.isConfirmed, true))
    : eq(analysisEntries.scenarioId, scenarioId)

  return db.query.analysisEntries.findMany({
    where: conditions,
    orderBy: [analysisEntries.entryId],
  })
}

export async function saveAnalysisEntries(
  scenarioId: number,
  rules: AccountingRule[],
  sourceMessageId?: number
) {
  const results = []

  for (const rule of rules) {
    // Convert AccountingRule to AnalysisEntry format
    const lines: AnalysisEntryLine[] = []

    if (rule.debitAccount) {
      lines.push({
        side: 'debit',
        accountCode: rule.debitAccount,
        description: rule.description,
      })
    }

    if (rule.creditAccount) {
      lines.push({
        side: 'credit',
        accountCode: rule.creditAccount,
        description: rule.description,
      })
    }

    // Use rule.event or rule.id as entryId, ensure it's not empty
    const entryId = rule.event || rule.id
    if (!entryId) {
      console.warn('Skipping rule without event or id:', rule)
      continue
    }

    // Use upsert pattern
    const existing = await db.query.analysisEntries.findFirst({
      where: and(
        eq(analysisEntries.scenarioId, scenarioId),
        eq(analysisEntries.entryId, entryId)
      ),
    })

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(analysisEntries)
        .set({
          description: rule.description,
          lines,
          metadata: rule.condition ? { condition: rule.condition } : null,
          sourceMessageId: sourceMessageId || existing.sourceMessageId,
          updatedAt: new Date(),
        })
        .where(eq(analysisEntries.id, existing.id))
        .returning()
      results.push(updated)
    } else {
      // Insert new
      const [inserted] = await db
        .insert(analysisEntries)
        .values({
          scenarioId,
          sourceMessageId: sourceMessageId || null,
          entryId,
          description: rule.description,
          lines,
          metadata: rule.condition ? { condition: rule.condition } : null,
          isConfirmed: false,
        })
        .returning()
      results.push(inserted)
    }
  }

  return results
}

export async function confirmAnalysisEntries(scenarioId: number) {
  return db
    .update(analysisEntries)
    .set({ isConfirmed: true, updatedAt: new Date() })
    .where(eq(analysisEntries.scenarioId, scenarioId))
    .returning()
}

export async function deleteAnalysisEntries(scenarioId: number) {
  return db
    .delete(analysisEntries)
    .where(eq(analysisEntries.scenarioId, scenarioId))
}

// ============================================================================
// ANALYSIS DIAGRAMS
// ============================================================================

export async function getAnalysisDiagrams(scenarioId: number, confirmedOnly = false) {
  const conditions = confirmedOnly
    ? and(eq(analysisDiagrams.scenarioId, scenarioId), eq(analysisDiagrams.isConfirmed, true))
    : eq(analysisDiagrams.scenarioId, scenarioId)

  return db.query.analysisDiagrams.findMany({
    where: conditions,
    orderBy: [desc(analysisDiagrams.createdAt)],
  })
}

export async function saveAnalysisDiagram(
  scenarioId: number,
  diagramType: 'mermaid' | 'chart' | 'table',
  payload: Record<string, any>,
  sourceMessageId?: number,
  title?: string
) {
  const [diagram] = await db
    .insert(analysisDiagrams)
    .values({
      scenarioId,
      sourceMessageId: sourceMessageId || null,
      diagramType,
      title: title || null,
      payload,
      isConfirmed: false,
    })
    .returning()

  return diagram
}

export async function confirmAnalysisDiagrams(scenarioId: number) {
  return db
    .update(analysisDiagrams)
    .set({ isConfirmed: true, updatedAt: new Date() })
    .where(eq(analysisDiagrams.scenarioId, scenarioId))
    .returning()
}

export async function deleteAnalysisDiagrams(scenarioId: number) {
  return db
    .delete(analysisDiagrams)
    .where(eq(analysisDiagrams.scenarioId, scenarioId))
}

// ============================================================================
// AGGREGATE OPERATIONS
// ============================================================================

/**
 * Get all confirmed analysis artifacts for a scenario (subjects, entries, diagrams)
 * Returns in a format compatible with UI components
 */
export async function getConfirmedAnalysis(scenarioId: number) {
  const subjects = await getAnalysisSubjects(scenarioId, true)
  const entries = await getAnalysisEntries(scenarioId, true)
  const diagrams = await getAnalysisDiagrams(scenarioId, true)

  // Convert database types to UI types
  const uiSubjects: AccountingSubject[] = subjects.map(s => ({
    code: s.code,
    name: s.name,
    direction: s.direction as 'debit' | 'credit',
    description: s.description || undefined,
  }))

  const uiRules: AccountingRule[] = entries.map(e => {
    const debitLine = e.lines.find(l => l.side === 'debit')
    const creditLine = e.lines.find(l => l.side === 'credit')

    return {
      id: e.entryId,
      description: e.description || '',
      condition: e.metadata?.condition || undefined,
      debitAccount: debitLine?.accountCode || undefined,
      creditAccount: creditLine?.accountCode || undefined,
    }
  })

  const mermaidDiagram = diagrams.find(d => d.diagramType === 'mermaid')

  return {
    scenarioId,
    subjects: uiSubjects,
    rules: uiRules,
    diagramMermaid: mermaidDiagram?.payload?.mermaidCode || null,
    sourceMessageId: subjects[0]?.sourceMessageId || null,
    confirmedAt: subjects[0]?.updatedAt || new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Save and confirm all analysis artifacts from a confirmation action
 */
export async function saveAndConfirmAnalysis(
  scenarioId: number,
  subjects: AccountingSubject[],
  rules: AccountingRule[],
  diagramMermaid?: string | null,
  sourceMessageId?: number
) {
  // Soft delete existing confirmed data (set is_confirmed = false)
  await softDeleteConfirmedSubjects(scenarioId)
  await softDeleteConfirmedEntries(scenarioId)
  await softDeleteConfirmedDiagrams(scenarioId)

  // Delete unconfirmed data (hard delete)
  await deleteUnconfirmedSubjects(scenarioId)
  await deleteUnconfirmedEntries(scenarioId)
  await deleteUnconfirmedDiagrams(scenarioId)

  // Save new data
  await saveAnalysisSubjects(scenarioId, subjects, sourceMessageId)
  await saveAnalysisEntries(scenarioId, rules, sourceMessageId)

  if (diagramMermaid) {
    await saveAnalysisDiagram(
      scenarioId,
      'mermaid',
      { mermaidCode: diagramMermaid },
      sourceMessageId
    )
  }

  // Confirm all new data
  await confirmAnalysisSubjects(scenarioId)
  await confirmAnalysisEntries(scenarioId)
  await confirmAnalysisDiagrams(scenarioId)

  return getConfirmedAnalysis(scenarioId)
}

/**
 * Clear all confirmed analysis for a scenario
 */
export async function clearConfirmedAnalysis(scenarioId: number) {
  await deleteAnalysisSubjects(scenarioId)
  await deleteAnalysisEntries(scenarioId)
  await deleteAnalysisDiagrams(scenarioId)
}

// ============================================================================
// SOFT DELETE FUNCTIONS (set is_confirmed = false)
// ============================================================================

export async function softDeleteConfirmedSubjects(scenarioId: number) {
  return db
    .update(analysisSubjects)
    .set({ isConfirmed: false })
    .where(and(
      eq(analysisSubjects.scenarioId, scenarioId),
      eq(analysisSubjects.isConfirmed, true)
    ))
}

export async function softDeleteConfirmedEntries(scenarioId: number) {
  return db
    .update(analysisEntries)
    .set({ isConfirmed: false })
    .where(and(
      eq(analysisEntries.scenarioId, scenarioId),
      eq(analysisEntries.isConfirmed, true)
    ))
}

export async function softDeleteConfirmedDiagrams(scenarioId: number) {
  return db
    .update(analysisDiagrams)
    .set({ isConfirmed: false })
    .where(and(
      eq(analysisDiagrams.scenarioId, scenarioId),
      eq(analysisDiagrams.isConfirmed, true)
    ))
}

// ============================================================================
// HARD DELETE FUNCTIONS (delete unconfirmed data)
// ============================================================================

export async function deleteUnconfirmedSubjects(scenarioId: number) {
  return db
    .delete(analysisSubjects)
    .where(and(
      eq(analysisSubjects.scenarioId, scenarioId),
      eq(analysisSubjects.isConfirmed, false)
    ))
}

export async function deleteUnconfirmedEntries(scenarioId: number) {
  return db
    .delete(analysisEntries)
    .where(and(
      eq(analysisEntries.scenarioId, scenarioId),
      eq(analysisEntries.isConfirmed, false)
    ))
}

export async function deleteUnconfirmedDiagrams(scenarioId: number) {
  return db
    .delete(analysisDiagrams)
    .where(and(
      eq(analysisDiagrams.scenarioId, scenarioId),
      eq(analysisDiagrams.isConfirmed, false)
    ))
}
