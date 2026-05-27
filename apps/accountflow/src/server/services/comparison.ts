/**
 * Comparison Service - Compare analyses across different accounting systems
 */

import { db } from '../db'
import {
  analysisEntries,
  analysisSubjects,
  analysisDiagrams,
  accountingSystems,
  scenarios,
} from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import {
  compareJournalEntries,
  compareMultipleSystems,
  type JournalEntry,
  type DiffResult,
} from '../utils/diff/journal-entries'

export interface SystemAnalysis {
  systemId: number
  systemName: string
  systemType: string
  analysisId?: number
  entries: JournalEntry[]
  subjects: Array<{
    code: string
    name: string
    direction: string
  }>
  flowchart?: string
  status: 'completed' | 'failed' | 'pending' | 'none'
  createdAt?: Date
}

export interface ComparisonRequest {
  scenarioId: number
  systemIds: number[]
  view?: 'entries' | 'rules' | 'flowcharts' | 'all'
}

export interface ComparisonResponse {
  scenarioId: number
  comparisonId: string
  systems: Array<{
    systemId: number
    systemName: string
    systemType: string
    analysisId?: number
    status: string
    entries: JournalEntry[]
    subjects: Array<{
      code: string
      name: string
      direction: string
    }>
    flowchart?: string
  }>
  differences: DiffResult['differences']
  summary: DiffResult['summary']
  view: string
}

/**
 * Get analyses for a scenario across multiple systems
 */
export async function getAnalysesForComparison(
  scenarioId: number,
  systemIds: number[]
): Promise<SystemAnalysis[]> {
  const analyses: SystemAnalysis[] = []

  for (const systemId of systemIds) {
    // Get system info
    const system = await db.query.accountingSystems.findFirst({
      where: eq(accountingSystems.id, systemId),
    })

    if (!system) continue

    // Get analysis entries for this system
    const entries = await db.query.analysisEntries.findMany({
      where: and(
        eq(analysisEntries.scenarioId, scenarioId),
        eq(analysisEntries.systemId, systemId),
        eq(analysisEntries.isConfirmed, true)
      ),
    })

    // Get subjects for this system
    const subjects = await db.query.analysisSubjects.findMany({
      where: and(
        eq(analysisSubjects.scenarioId, scenarioId),
        eq(analysisSubjects.isConfirmed, true)
      ),
    })

    // Get flowchart for this system
    const diagrams = await db.query.analysisDiagrams.findMany({
      where: and(
        eq(analysisDiagrams.scenarioId, scenarioId),
        eq(analysisDiagrams.isConfirmed, true)
      ),
      orderBy: (diagrams, { desc }) => [desc(diagrams.createdAt)],
    })

    const mermaidDiagram = diagrams.find(d => d.diagramType === 'mermaid')

    // Convert entries to JournalEntry format
    const journalEntries: JournalEntry[] = entries.map(entry => ({
      id: String(entry.id),
      description: entry.description || entry.eventName || '',
      debits: entry.lines
        ?.filter(line => line.side === 'debit')
        .map(line => ({
          accountCode: line.accountCode,
          amount: line.amount || 0,
          description: line.description,
        })) || [],
      credits: entry.lines
        ?.filter(line => line.side === 'credit')
        .map(line => ({
          accountCode: line.accountCode,
          amount: line.amount || 0,
          description: line.description,
        })) || [],
    }))

    analyses.push({
      systemId: system.id,
      systemName: system.name,
      systemType: system.type,
      analysisId: entries[0]?.id,
      entries: journalEntries,
      subjects: subjects.map(s => ({
        code: s.code,
        name: s.name,
        direction: s.direction,
      })),
      flowchart: mermaidDiagram?.payload?.mermaidCode ||
        (mermaidDiagram?.payload as any)?.mermaid,
      status: entries.length > 0 ? 'completed' : 'none',
      createdAt: entries[0]?.createdAt,
    })
  }

  return analyses
}

/**
 * Compare analyses across multiple systems
 */
export async function compareAnalyses(
  request: ComparisonRequest
): Promise<ComparisonResponse> {
  const { scenarioId, systemIds, view = 'all' } = request

  // Validate system IDs
  if (systemIds.length < 2 || systemIds.length > 4) {
    throw new Error('Comparison requires 2-4 systems')
  }

  // Get analyses for all systems
  const analyses = await getAnalysesForComparison(scenarioId, systemIds)

  // Check if we have enough analyses
  const completedAnalyses = analyses.filter(a => a.status === 'completed')
  if (completedAnalyses.length < 2) {
    throw new Error(
      `Need at least 2 completed analyses, found ${completedAnalyses.length}`
    )
  }

  // Perform comparison
  const comparisonInput = analyses.map(a => ({
    systemId: String(a.systemId),
    systemName: a.systemName,
    entries: a.entries,
  }))

  const diffResult = compareMultipleSystems(comparisonInput)

  // Build response
  const response: ComparisonResponse = {
    scenarioId,
    comparisonId: generateComparisonId(),
    systems: analyses.map(a => ({
      systemId: a.systemId,
      systemName: a.systemName,
      systemType: a.systemType,
      analysisId: a.analysisId,
      status: a.status,
      entries: a.entries,
      subjects: a.subjects,
      flowchart: a.flowchart,
    })),
    differences: diffResult.differences,
    summary: diffResult.summary,
    view,
  }

  return response
}

/**
 * Compare specific analysis IDs directly
 */
export async function compareAnalysisIds(
  analysisIds: number[]
): Promise<ComparisonResponse> {
  if (analysisIds.length < 2 || analysisIds.length > 4) {
    throw new Error('Comparison requires 2-4 analyses')
  }

  // Get analyses
  const analyses: SystemAnalysis[] = []
  for (const analysisId of analysisIds) {
    const entry = await db.query.analysisEntries.findFirst({
      where: eq(analysisEntries.id, analysisId),
    })

    if (!entry) continue

    // Get system info
    const system = entry.systemId
      ? await db.query.accountingSystems.findFirst({
          where: eq(accountingSystems.id, entry.systemId),
        })
      : null

    // Get all entries for this scenario/system
    const allEntries = entry.systemId
      ? await db.query.analysisEntries.findMany({
          where: and(
            eq(analysisEntries.scenarioId, entry.scenarioId),
            eq(analysisEntries.systemId, entry.systemId),
            eq(analysisEntries.isConfirmed, true)
          ),
        })
      : [entry]

    // Get subjects
    const subjects = await db.query.analysisSubjects.findMany({
      where: and(
        eq(analysisSubjects.scenarioId, entry.scenarioId),
        eq(analysisSubjects.isConfirmed, true)
      ),
    })

    // Get flowchart
    const diagrams = await db.query.analysisDiagrams.findMany({
      where: and(
        eq(analysisDiagrams.scenarioId, entry.scenarioId),
        eq(analysisDiagrams.isConfirmed, true)
      ),
    })
    const mermaidDiagram = diagrams.find(d => d.diagramType === 'mermaid')

    // Convert to journal entries
    const journalEntries: JournalEntry[] = allEntries.map(e => ({
      id: String(e.id),
      description: e.description || e.eventName || '',
      debits: e.lines
        ?.filter(line => line.side === 'debit')
        .map(line => ({
          accountCode: line.accountCode,
          amount: line.amount || 0,
          description: line.description,
        })) || [],
      credits: e.lines
        ?.filter(line => line.side === 'credit')
        .map(line => ({
          accountCode: line.accountCode,
          amount: line.amount || 0,
          description: line.description,
        })) || [],
    }))

    analyses.push({
      systemId: system?.id || 0,
      systemName: system?.name || 'Unknown',
      systemType: system?.type || 'custom',
      analysisId: entry.id,
      entries: journalEntries,
      subjects: subjects.map(s => ({
        code: s.code,
        name: s.name,
        direction: s.direction,
      })),
      flowchart: mermaidDiagram?.payload?.mermaidCode ||
        (mermaidDiagram?.payload as any)?.mermaid,
      status: 'completed',
      createdAt: entry.createdAt,
    })
  }

  if (analyses.length < 2) {
    throw new Error(`Need at least 2 valid analyses, found ${analyses.length}`)
  }

  // Perform comparison
  const comparisonInput = analyses.map(a => ({
    systemId: String(a.systemId),
    systemName: a.systemName,
    entries: a.entries,
  }))

  const diffResult = compareMultipleSystems(comparisonInput)

  return {
    scenarioId: analyses[0]?.systemId || 0,
    comparisonId: generateComparisonId(),
    systems: analyses.map(a => ({
      systemId: a.systemId,
      systemName: a.systemName,
      systemType: a.systemType,
      analysisId: a.analysisId,
      status: a.status,
      entries: a.entries,
      subjects: a.subjects,
      flowchart: a.flowchart,
    })),
    differences: diffResult.differences,
    summary: diffResult.summary,
    view: 'all',
  }
}

/**
 * Get systems with analyses for a scenario
 */
export async function getSystemsWithAnalyses(
  scenarioId: number
): Promise<
  Array<{
    system: {
      id: number
      name: string
      type: string
      description?: string
    }
    analysis?: {
      id: number
      status: string
      createdAt: Date
    }
    hasDifferences: boolean
  }>
> {
  // Get all systems
  const allSystems = await db.query.accountingSystems.findMany({
    where: eq(accountingSystems.status, 'active'),
  })

  // Get analyses for this scenario
  const analyses = await db.query.analysisEntries.findMany({
    where: and(
      eq(analysisEntries.scenarioId, scenarioId),
      eq(analysisEntries.isConfirmed, true)
    ),
  })

  // Group analyses by system
  const analysesBySystem = new Map<number, typeof analyses>()
  for (const analysis of analyses) {
    if (!analysis.systemId) continue
    const existing = analysesBySystem.get(analysis.systemId) || []
    existing.push(analysis)
    analysesBySystem.set(analysis.systemId, existing)
  }

  // Check if there are differences (more than one system has analysis)
  const systemsWithAnalyses = analysesBySystem.size
  const hasDifferences = systemsWithAnalyses > 1

  // Build response
  return allSystems.map(system => {
    const systemAnalyses = analysesBySystem.get(system.id) || []
    const latestAnalysis = systemAnalyses.sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    )[0]

    return {
      system: {
        id: system.id,
        name: system.name,
        type: system.type,
        description: system.description || undefined,
      },
      analysis: latestAnalysis
        ? {
            id: latestAnalysis.id,
            status: 'completed',
            createdAt: latestAnalysis.createdAt || new Date(),
          }
        : undefined,
      hasDifferences,
    }
  })
}

/**
 * Generate a unique comparison ID
 */
function generateComparisonId(): string {
  return `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
