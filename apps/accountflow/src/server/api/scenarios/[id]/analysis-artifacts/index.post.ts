import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { createAnalysisArtifacts } from '../../../../db/queries/analysis-artifacts'
import { analysisArtifactsRequestSchema } from '../../../../utils/schemas'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const scenarioId = idParam ? parseInt(idParam, 10) : null

    if (!scenarioId || isNaN(scenarioId)) {
      throw createError({ statusCode: 400, message: 'Invalid scenario ID' })
    }

    const body = await readBody(event)
    const data = analysisArtifactsRequestSchema.parse(body)

    const artifacts = await createAnalysisArtifacts({
      scenarioId,
      sourceMessageId: data.sourceMessageId ?? null,
      subjects: data.subjects,
      entries: data.entries,
      diagrams: data.diagrams,
    })

    return {
      scenarioId,
      sourceMessageId: data.sourceMessageId ?? null,
      ...artifacts,
    }
  } catch (error: any) {
    console.error('Error creating analysis artifacts:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Failed to create analysis artifacts'
    })
  }
})
