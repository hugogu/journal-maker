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
      
      // Deactivate all other configs first
      await db.update(aiConfigs)
        .set({ isActive: false })
      
      // Get any existing config to update
      const existing = await db.query.aiConfigs.findFirst()
      
      let config
      if (existing) {
        // Update existing
        [config] = await db.update(aiConfigs)
          .set({
            apiEndpoint: data.apiEndpoint,
            apiKey: data.apiKey,
            model: data.model,
            systemPrompt: data.systemPrompt,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(aiConfigs.id, existing.id))
          .returning()
      } else {
        // Insert new - use a default companyId for schema compatibility
        [config] = await db.insert(aiConfigs)
          .values({
            ...data,
            companyId: 1,
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
