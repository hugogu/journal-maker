import { defineEventHandler, createError, getRouterParam, getQuery } from 'h3'
import { listAnalysisArtifacts } from '../../../../db/queries/analysis-artifacts'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const scenarioId = idParam ? parseInt(idParam, 10) : null

    if (!scenarioId || isNaN(scenarioId)) {
      throw createError({ statusCode: 400, message: 'Invalid scenario ID' })
    }

    const query = getQuery(event)
    const sourceMessageId = query.sourceMessageId ? Number(query.sourceMessageId) : undefined

    const { subjects, entries, diagrams } = await listAnalysisArtifacts({
      scenarioId,
      sourceMessageId:
        sourceMessageId && !Number.isNaN(sourceMessageId) ? sourceMessageId : undefined,
    })

    return {
      scenarioId,
      sourceMessageId: sourceMessageId ?? null,
      subjects,
      entries,
      diagrams,
    }
  } catch (error) {
    console.error('Error fetching analysis artifacts:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch analysis artifacts',
    })
  }
})
