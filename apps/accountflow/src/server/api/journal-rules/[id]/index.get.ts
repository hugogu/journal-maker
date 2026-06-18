import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { journalRules } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const ruleId = idParam ? parseInt(idParam, 10) : null

    if (!ruleId || isNaN(ruleId)) {
      throw createError({ statusCode: 400, message: 'Invalid rule ID' })
    }

    const rule = await db.query.journalRules.findFirst({
      where: eq(journalRules.id, ruleId),
      with: {
        scenario: {
          columns: {
            id: true,
            name: true,
            description: true,
          },
        },
        event: {
          columns: {
            id: true,
            eventName: true,
            description: true,
          },
        },
        debitAccount: {
          columns: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        creditAccount: {
          columns: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        systems: {
          with: {
            system: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!rule) {
      throw createError({ statusCode: 404, message: 'Journal rule not found' })
    }

    return {
      success: true,
      data: rule,
    }
  } catch (error: any) {
    console.error('Error fetching journal rule:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      message: error?.message || 'Failed to fetch journal rule',
    })
  }
})
