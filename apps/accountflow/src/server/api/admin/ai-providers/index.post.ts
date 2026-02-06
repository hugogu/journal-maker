import { defineEventHandler, createError, readBody } from 'h3'
import { createAIProvider } from '../../../db/queries/ai-providers'
import { encrypt } from '../../../utils/encryption'
import { z } from 'zod'

const createProviderSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['openai', 'azure', 'ollama', 'custom']),
  apiEndpoint: z.string().min(1).max(500),
  apiKey: z.string().min(1),
  defaultModel: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = createProviderSchema.parse(body)

    // Encrypt the API key before storing
    const encryptedKey = encrypt(data.apiKey)

    const provider = await createAIProvider({
      name: data.name,
      type: data.type,
      apiEndpoint: data.apiEndpoint,
      apiKey: encryptedKey,
      defaultModel: data.defaultModel,
      isDefault: data.isDefault,
    })

    return { provider }
  } catch (error) {
    console.error('Error creating AI provider:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input: ' + error.errors.map((e) => e.message).join(', '),
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to create AI provider',
    })
  }
})
