import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { z } from 'zod'
import { db } from '../../../db'
import { scenarios } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { compareAnalyses, getSystemsWithAnalyses } from '../../../services/comparison'

const compareQuerySchema = z.object({
  systemIds: z.string().min(1),
  view: z.enum(['entries', 'rules', 'flowcharts', 'all']).default('all'),
})

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

    // Parse query parameters
    const query = getQuery(event)
    const parsedQuery = compareQuerySchema.safeParse({
      systemIds: query.systemIds,
      view: query.view,
    })

    if (!parsedQuery.success) {
      throw createError({
        statusCode: 400,
        message: 'Invalid query parameters: systemIds is required',
      })
    }

    const { systemIds: systemIdsStr, view } = parsedQuery.data

    // Parse system IDs
    const systemIds = systemIdsStr
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id))

    if (systemIds.length < 2 || systemIds.length > 4) {
      throw createError({
        statusCode: 400,
        message: 'Comparison requires 2-4 system IDs',
      })
    }

    // Perform comparison
    const result = await compareAnalyses({
      scenarioId,
      systemIds,
      view,
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('Comparison error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to compare analyses',
    })
  }
})
