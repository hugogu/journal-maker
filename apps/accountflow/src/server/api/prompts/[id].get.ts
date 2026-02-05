import { defineEventHandler, createError, getRouterParam } from 'h3'
import { getPromptTemplate } from '../../db/queries/prompts'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const id = idParam ? parseInt(idParam, 10) : null

    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid template ID',
      })
    }

    const template = await getPromptTemplate(id)

    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Prompt template not found',
      })
    }

    return template
  } catch (error) {
    console.error('Error fetching prompt template:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch prompt template',
    })
  }
})
