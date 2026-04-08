import { testAIConnectionSchema } from '../../utils/schemas'
import { AppError, handleError, successResponse } from '../../utils/error'
import { aiService } from '../../utils/ai-service'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { getAIProvider } from '../../db/queries/ai-providers'
import { decrypt } from '../../utils/encryption'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = testAIConnectionSchema.parse(body)
    
    let apiKey = data.apiKey
    let providerType = data.providerType || 'openai'
    
    // If apiKey is empty and providerId is provided, use stored key from database
    if (!apiKey && data.providerId) {
      const provider = await getAIProvider(data.providerId)
      if (!provider) {
        throw new AppError(404, 'Provider not found')
      }
      apiKey = decrypt(provider.apiKey)
      providerType = provider.type
    }
    
    // Validate we have an apiKey
    if (!apiKey) {
      throw new AppError(400, 'API Key is required')
    }
    
    const result = await aiService.testConnection(
      providerType,
      data.apiEndpoint,
      apiKey,
      data.model
    )
    
    if (!result.success) {
      throw new AppError(400, result.error || 'Failed to connect to AI service')
    }
    
    return successResponse({ connected: true })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
