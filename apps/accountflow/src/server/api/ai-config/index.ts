import { db } from '../../db'
import { aiConfigs } from '../../db/schema'
import { createAIConfigSchema, updateAIConfigSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { eq } from 'drizzle-orm'
import { defineEventHandler, getMethod, readBody, setResponseStatus } from 'h3'

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
      
      // Always use companyId 1 for personal use
      const companyId = 1
      
      // Check if config exists for companyId 1
      const existing = await db.query.aiConfigs.findFirst({
        where: eq(aiConfigs.companyId, companyId)
      })
      
      let config
      if (existing) {
        // Update existing config for companyId 1
        [config] = await db.update(aiConfigs)
          .set({
            apiEndpoint: data.apiEndpoint,
            apiKey: data.apiKey,
            model: data.model,
            systemPrompt: data.systemPrompt,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(aiConfigs.companyId, companyId))
          .returning()
      } else {
        // Insert new config for companyId 1
        [config] = await db.insert(aiConfigs)
          .values({
            ...data,
            companyId,
            isActive: true
          })
          .returning()
      }
      return successResponse(config)
    }

    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
