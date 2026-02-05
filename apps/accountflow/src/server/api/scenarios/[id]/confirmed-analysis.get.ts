import { getConfirmedAnalysis, scenarioExists } from '../../../db/queries/confirmed-analysis'

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

  // Get confirmed analysis
  const analysis = await getConfirmedAnalysis(scenarioId)

  return {
    success: true,
    data: analysis,
  }
})
