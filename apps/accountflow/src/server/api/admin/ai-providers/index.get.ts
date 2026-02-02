import { defineEventHandler, createError } from 'h3'
import { getAIProviders } from '../../../db/queries/ai-providers'

export default defineEventHandler(async () => {
  try {
    const providers = await getAIProviders()
    return { providers }
  } catch (error) {
    console.error('Error fetching AI providers:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch AI providers'
    })
  }
})
