import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { scenarios } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { getSystemsWithAnalyses } from '../../../services/comparison'

export default defineEventHandler(async (event) => {
  try {
    const scenarioIdParam = getRouterParam(event, 'id')
    const scenarioId = scenarioIdParam ? parseInt(scenarioIdParam, 10) : null

    if (!scenarioId || isNaN(scenarioId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid scenario ID',
      })
    }

    // Verify scenario exists
    const scenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.id, scenarioId),
    })

    if (!scenario) {
      throw createError({
        statusCode: 404,
        message: 'Scenario not found',
      })
    }

    // Get systems with analyses
    const systems = await getSystemsWithAnalyses(scenarioId)

    return {
      success: true,
      data: {
        systems,
        total: systems.length,
        withAnalyses: systems.filter(s => s.analysis).length,
        hasDifferences: systems.some(s => s.hasDifferences),
      },
    }
  } catch (error: any) {
    console.error('Get systems error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get systems',
    })
  }
})
