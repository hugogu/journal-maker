import { defineEventHandler, createError, getRouterParam } from 'h3'
import { deleteAIProvider } from '../../../db/queries/ai-providers'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const id = idParam ? parseInt(idParam, 10) : null
    
    if (!id || isNaN(id)) {
      throw createError({ statusCode: 400, message: 'Invalid provider ID' })
    }

    await deleteAIProvider(id)
    return { success: true }
  } catch (error) {
    console.error('Error deleting AI provider:', error)
    throw createError({ statusCode: 500, message: 'Failed to delete AI provider' })
  }
})
