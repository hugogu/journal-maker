import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { createPromptVersion, getPromptTemplate, extractVariables } from '../../../db/queries/prompts'
import { z } from 'zod'

const createVersionSchema = z.object({
  content: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const templateId = idParam ? parseInt(idParam, 10) : null
    
    if (!templateId || isNaN(templateId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid template ID'
      })
    }

    // Verify template exists
    const template = await getPromptTemplate(templateId)
    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Prompt template not found'
      })
    }

    const body = await readBody(event)
    const data = createVersionSchema.parse(body)

    // Extract variables from content
    const variables = extractVariables(data.content)

    const version = await createPromptVersion({
      templateId,
      content: data.content,
      variables,
      createdBy: 1, // TODO: Get actual user ID from session
    })

    return { version }
  } catch (error) {
    console.error('Error creating prompt version:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      })
    }
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to create prompt version'
    })
  }
})
