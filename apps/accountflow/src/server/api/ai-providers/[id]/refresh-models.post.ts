import { defineEventHandler, createError, getRouterParam } from 'h3'
import { getAIProvider } from '../../../db/queries/ai-providers'
import { db } from '../../../db'
import { aiModels } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { decrypt } from '../../../utils/encryption'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Provider ID is required',
      })
    }

    const providerId = parseInt(id, 10)
    const provider = await getAIProvider(providerId)

    if (!provider) {
      throw createError({
        statusCode: 404,
        message: 'Provider not found',
      })
    }

    // Decrypt API key
    const apiKey = decrypt(provider.apiKey)

    // Fetch models from the AI provider API
    let models: Array<{ id: string; name: string }> = []

    try {
      const modelsUrl = `${provider.apiEndpoint.replace(/\/$/, '')}/models`
      const response = await fetch(modelsUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }

      const data = await response.json()

      // OpenAI format: { data: [{ id: "gpt-4", ... }] }
      if (data.data && Array.isArray(data.data)) {
        models = data.data.map((m: any) => ({
          id: m.id,
          name: m.id, // Use the id as name if no separate name field
        }))
      }
    } catch (fetchError) {
      console.error('Error fetching models from provider:', fetchError)
      throw createError({
        statusCode: 502,
        message: 'Failed to fetch models from AI provider. Please check the API endpoint and key.',
      })
    }

    // Delete existing models for this provider
    await db.delete(aiModels).where(eq(aiModels.providerId, providerId))

    // Insert new models
    if (models.length > 0) {
      await db.insert(aiModels).values(
        models.map((model) => ({
          providerId,
          name: model.name,
          capabilities: {},
        }))
      )
    }

    // Fetch updated provider with models
    const updatedProvider = await getAIProvider(providerId)

    return {
      success: true,
      models: updatedProvider?.models || [],
      count: models.length,
    }
  } catch (error) {
    console.error('Error refreshing AI provider models:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to refresh AI provider models',
    })
  }
})
