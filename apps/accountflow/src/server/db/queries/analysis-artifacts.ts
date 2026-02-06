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
  subjects?: Array<{ code: string; name: string; direction: 'debit' | 'credit' | 'both'; description?: string | null; metadata?: any }>
  entries?: Array<{ eventName?: string | null; lines: any; description?: string | null; amount?: number | null; currency?: string | null; metadata?: any }>
  diagrams?: Array<{ diagramType: 'mermaid' | 'chart' | 'table'; payload: any; metadata?: any }>
}) {
  const { scenarioId, sourceMessageId } = params

  // For subjects, use upsert to avoid duplicates
  const createdSubjects = params.subjects?.length
    ? await Promise.all(
        params.subjects.map(async (subject) => {
          try {
            const [result] = await db.insert(analysisSubjects).values({
              scenarioId,
              sourceMessageId: sourceMessageId || null,
              ...subject,
            }).returning()
            return result
          } catch (error: any) {
            // If duplicate constraint error, fetch existing record
            if (error.code === '23505' || (error.cause && error.cause.code === '23505')) {
              console.log(`Duplicate subject detected: ${subject.code}, fetching existing record`)
              const existing = await db.select().from(analysisSubjects)
                .where(and(
                  eq(analysisSubjects.scenarioId, scenarioId),
                  eq(analysisSubjects.code, subject.code)
                ))
                .limit(1)
              return existing[0]
            }
            console.error('Unexpected error inserting subject:', error)
            throw error
          }
        })
      )
    : []

  const createdEntries = params.entries?.length
    ? await Promise.all(
        params.entries.map(async (entry, index) => {
          try {
            const [result] = await db.insert(analysisEntries).values({
              scenarioId,
              sourceMessageId: sourceMessageId || null,
              entryId: `entry_${Date.now()}_${index}`, // Generate unique entryId
              eventName: entry.eventName || null, // Track which event this entry belongs to
              lines: entry.lines,
              description: entry.description || null,
              amount: entry.amount ? entry.amount.toString() : null,
              currency: entry.currency || null, // Only set if provided (not defaulting to CNY)
              metadata: entry.metadata || null,
            }).returning()
            return result
          } catch (error: any) {
            // If duplicate constraint error, fetch existing record
            if (error.code === '23505' || (error.cause && error.cause.code === '23505')) {
              console.log(`Duplicate entry detected, fetching existing record`)
              const existing = await db.select().from(analysisEntries)
                .where(and(
                  eq(analysisEntries.scenarioId, scenarioId),
                  eq(analysisEntries.entryId, `entry_${Date.now()}_${index}`)
                ))
                .limit(1)
              return existing[0]
            }
            console.error('Unexpected error inserting entry:', error)
            throw error
          }
        })
      )
    : []

  const createdDiagrams = params.diagrams?.length
    ? await db.insert(analysisDiagrams).values(
        params.diagrams.map((diagram) => ({
          scenarioId,
          sourceMessageId: sourceMessageId || null,
          ...diagram,
        }))
      ).returning()
    : []

  return { subjects: createdSubjects, entries: createdEntries, diagrams: createdDiagrams }
}
