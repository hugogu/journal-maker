import { confirmAnalysisRequestSchema } from '../../../utils/schemas'
import { upsertConfirmedAnalysis, scenarioExists } from '../../../db/queries/confirmed-analysis'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const scenarioId = parseInt(id || '', 10)

  if (isNaN(scenarioId) || scenarioId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid scenario ID',
    })
  }

  // Check if scenario exists
  const exists = await scenarioExists(scenarioId)
  if (!exists) {
    throw createError({
      statusCode: 404,
      message: 'Scenario not found',
    })
  }

  // Parse and validate request body
  const body = await readBody(event)
  const parsed = confirmAnalysisRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors[0]?.message || 'Invalid request body',
    })
  }

  const { subjects, rules, diagramMermaid, sourceMessageId } = parsed.data

  // Upsert confirmed analysis
  const analysis = await upsertConfirmedAnalysis({
    scenarioId,
    subjects,
    rules,
    diagramMermaid,
    sourceMessageId,
  })

  return {
    success: true,
    data: analysis,
  }
})
