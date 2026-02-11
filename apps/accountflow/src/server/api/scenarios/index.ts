import { db } from '../../db'
import { scenarios } from '../../db/schema'
import { createScenarioSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)

    if (method === 'GET') {
      const allScenarios = await db.query.scenarios.findMany({
        orderBy: desc(scenarios.createdAt),
      })
      return successResponse(allScenarios)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const data = createScenarioSchema.parse(body)
      
      // TODO: Get actual user ID from session
      const userId = 1
      
      const [scenario] = await db.insert(scenarios).values({
        ...data,
        companyId: 1, // TODO: Get from session
        createdBy: userId,
      }).returning()
      
      return successResponse(scenario)
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
