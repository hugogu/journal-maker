import { defineEventHandler, createError, getQuery } from 'h3'
import { db } from '../../db'
import { journalRules, scenarios, accountingEvents } from '../../db/schema'
import { eq, like, desc, asc, sql, and, or } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 20
    const search = (query.search as string) || ''
    const scenarioId = query.scenarioId ? parseInt(query.scenarioId as string) : undefined
    const sortBy = (query.sortBy as string) || 'createdAt'
    const sortOrder = (query.sortOrder as string) || 'desc'

    // Build where conditions
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          like(journalRules.eventName, `%${search}%`),
          like(journalRules.eventDescription, `%${search}%`),
          like(journalRules.ruleKey, `%${search}%`)
        )
      )
    }
    
    if (scenarioId) {
      conditions.push(eq(journalRules.scenarioId, scenarioId))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(journalRules)
      .where(whereClause)
    
    const total = countResult[0]?.count || 0

    // Get rules with related data
    const rules = await db.query.journalRules.findMany({
      where: whereClause,
      with: {
        scenario: {
          columns: {
            id: true,
            name: true,
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
          },
        },
        creditAccount: {
          columns: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: sortOrder === 'asc' ? asc(journalRules.createdAt) : desc(journalRules.createdAt),
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    return {
      success: true,
      data: {
        rules,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  } catch (error: any) {
    console.error('Error fetching journal rules:', error)
    throw createError({
      statusCode: 500,
      message: error?.message || 'Failed to fetch journal rules',
    })
  }
})
