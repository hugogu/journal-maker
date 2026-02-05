import { db } from '../index'
import { analysisSubjects, analysisEntries, analysisDiagrams } from '../schema'
import { eq, and } from 'drizzle-orm'

export async function listAnalysisArtifacts(params: {
  scenarioId: number
  sourceMessageId?: number
}) {
  const baseWhere = params.sourceMessageId
    ? and(
        eq(analysisSubjects.scenarioId, params.scenarioId),
        eq(analysisSubjects.sourceMessageId, params.sourceMessageId)
      )
    : eq(analysisSubjects.scenarioId, params.scenarioId)

  const entriesWhere = params.sourceMessageId
    ? and(
        eq(analysisEntries.scenarioId, params.scenarioId),
        eq(analysisEntries.sourceMessageId, params.sourceMessageId)
      )
    : eq(analysisEntries.scenarioId, params.scenarioId)

  const diagramsWhere = params.sourceMessageId
    ? and(
        eq(analysisDiagrams.scenarioId, params.scenarioId),
        eq(analysisDiagrams.sourceMessageId, params.sourceMessageId)
      )
    : eq(analysisDiagrams.scenarioId, params.scenarioId)

  const [subjects, entries, diagrams] = await Promise.all([
    db.select().from(analysisSubjects).where(baseWhere),
    db.select().from(analysisEntries).where(entriesWhere),
    db.select().from(analysisDiagrams).where(diagramsWhere),
  ])

  return { subjects, entries, diagrams }
}

export async function createAnalysisArtifacts(params: {
  scenarioId: number
  sourceMessageId?: number | null
  subjects?: Array<{
    code: string
    name: string
    direction: 'debit' | 'credit' | 'both'
    description?: string | null
    metadata?: any
  }>
  entries?: Array<{
    lines: any
    description?: string | null
    amount?: number | null
    currency?: string | null
    metadata?: any
  }>
  diagrams?: Array<{ diagramType: 'mermaid' | 'chart' | 'table'; payload: any; metadata?: any }>
}) {
  const { scenarioId, sourceMessageId } = params

  const createdSubjects = params.subjects?.length
    ? await db
        .insert(analysisSubjects)
        .values(
          params.subjects.map((subject) => ({
            scenarioId,
            sourceMessageId: sourceMessageId || null,
            ...subject,
          }))
        )
        .returning()
    : []

  const createdEntries = params.entries?.length
    ? await db
        .insert(analysisEntries)
        .values(
          params.entries.map((entry) => ({
            scenarioId,
            sourceMessageId: sourceMessageId || null,
            ...entry,
          }))
        )
        .returning()
    : []

  const createdDiagrams = params.diagrams?.length
    ? await db
        .insert(analysisDiagrams)
        .values(
          params.diagrams.map((diagram) => ({
            scenarioId,
            sourceMessageId: sourceMessageId || null,
            ...diagram,
          }))
        )
        .returning()
    : []

  return { subjects: createdSubjects, entries: createdEntries, diagrams: createdDiagrams }
}
