import { db } from '../../db'
import { aiConfigs } from '../../db/schema'
import { createAIConfigSchema, updateAIConfigSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)

    if (method === 'GET') {
      const configs = await db.query.aiConfigs.findMany()
      return successResponse(configs)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const data = createAIConfigSchema.parse(body)
      
      const [config] = await db.insert(aiConfigs).values(data).returning()
      return successResponse(config)
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
