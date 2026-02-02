import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { createConversationMessage } from '../../../../db/queries/conversations'
import { z } from 'zod'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  requestLog: z.any().optional(),
  responseStats: z.any().optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const scenarioId = idParam ? parseInt(idParam, 10) : null
    
    if (!scenarioId || isNaN(scenarioId)) {
      throw createError({ statusCode: 400, message: 'Invalid scenario ID' })
    }

    const body = await readBody(event)
    const data = messageSchema.parse(body)

    const message = await createConversationMessage({
      scenarioId,
      ...data
    })

    return { message }
  } catch (error) {
    console.error('Error creating conversation message:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to create conversation message'
    })
  }
})
