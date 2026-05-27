import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { compareAnalysisIds } from '../../services/comparison'

const compareAnalysesSchema = z.object({
  analysisIds: z.array(z.number().int().positive()).min(2).max(4),
  view: z.enum(['entries', 'rules', 'flowcharts', 'all']).default('all'),
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const parsedBody = compareAnalysesSchema.safeParse(body)

    if (!parsedBody.success) {
      const errors = parsedBody.error.errors.map(e => e.message).join(', ')
      throw createError({
        statusCode: 400,
        message: `Invalid request body: ${errors}`,
      })
    }

    const { analysisIds, view } = parsedBody.data

    // Perform comparison
    const result = await compareAnalysisIds(analysisIds)

    // Override view if specified
    if (view) {
      result.view = view
    }

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('Analysis comparison error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to compare analyses',
    })
  }
})
