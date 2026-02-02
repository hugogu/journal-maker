import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { updateAIProvider } from '../../../db/queries/ai-providers'
import { encrypt } from '../../../utils/encryption'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiEndpoint: z.string().min(1).max(500).optional(),
  apiKey: z.string().optional(), // Optional - if empty, won't overwrite existing key
  defaultModel: z.string().optional(),
  isDefault: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const id = idParam ? parseInt(idParam, 10) : null
    
    if (!id || isNaN(id)) {
      throw createError({ statusCode: 400, message: 'Invalid provider ID' })
    }

    const body = await readBody(event)
    const data = updateSchema.parse(body)

    // Prepare update data - only encrypt apiKey if provided and not empty
    const updateData: any = { 
      name: data.name,
      apiEndpoint: data.apiEndpoint,
      defaultModel: data.defaultModel,
      isDefault: data.isDefault,
      status: data.status,
    }
    
    // Only update apiKey if provided and not empty
    if (data.apiKey && data.apiKey.trim() !== '') {
      updateData.apiKey = encrypt(data.apiKey)
    }

    const provider = await updateAIProvider(id, updateData)
    return { provider }
  } catch (error) {
    console.error('Error updating AI provider:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      })
    }
    throw createError({ statusCode: 500, message: 'Failed to update AI provider' })
  }
})
