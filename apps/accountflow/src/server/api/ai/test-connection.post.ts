import { testAIConnectionSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { aiService } from '../../utils/ai-service'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = testAIConnectionSchema.parse(body)
    
    const isConnected = await aiService.testConnection(
      data.providerType || 'openai',
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
