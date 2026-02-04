import { deleteConfirmedAnalysis, scenarioExists } from '../../../db/queries/confirmed-analysis'

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

  // Delete confirmed analysis
  const deleted = await deleteConfirmedAnalysis(scenarioId)

  if (!deleted) {
    return {
      success: true,
      message: 'No confirmed analysis to clear',
    }
  }

  return {
    success: true,
    message: 'Confirmed analysis cleared',
  }
})
