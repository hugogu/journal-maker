import { defineEventHandler, createError, getRouterParam } from 'h3'
import { getAIProvider } from '../../../db/queries/ai-providers'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Provider ID is required'
      })
    }

    const provider = await getAIProvider(parseInt(id, 10))

    if (!provider) {
      throw createError({
        statusCode: 404,
        message: 'Provider not found'
      })
    }

    return {
      success: true,
      models: (provider.models || []).map(model => ({
        id: model.name, // Use model name as ID for selection
        name: model.name
      }))
    }
  } catch (error) {
    console.error('Error fetching AI provider models:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch AI provider models'
    })
  }
})
