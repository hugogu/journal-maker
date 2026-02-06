import { defineEventHandler, createError } from 'h3'
import { getPromptTemplates } from '../../db/queries/prompts'

export default defineEventHandler(async () => {
  try {
    const templates = await getPromptTemplates()
    return { templates }
  } catch (error) {
    console.error('Error fetching prompt templates:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch prompt templates',
    })
  }
})
