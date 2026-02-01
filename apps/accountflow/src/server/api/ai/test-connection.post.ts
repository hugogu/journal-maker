import { db } from '../../db'
import { aiConfigs } from '../../db/schema'
import { testAIConnectionSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { mockAIService } from '../../utils/mock-ai'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = testAIConnectionSchema.parse(body)
    
    const isConnected = await mockAIService.testConnection(
      data.apiEndpoint,
      data.apiKey,
      data.model
    )
    
    if (!isConnected) {
      throw new AppError(400, 'Failed to connect to AI service')
    }
    
    return successResponse({ connected: true })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
