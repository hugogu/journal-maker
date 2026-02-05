import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { activatePromptVersion, getPromptTemplate } from '../../../db/queries/prompts'
import { z } from 'zod'

const activateSchema = z.object({
  versionId: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const templateId = idParam ? parseInt(idParam, 10) : null

    if (!templateId || isNaN(templateId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid template ID',
      })
    }

    // Verify template exists
    const template = await getPromptTemplate(templateId)
    if (!template) {
      throw createError({
        statusCode: 404,
        message: 'Prompt template not found',
      })
    }

    const body = await readBody(event)
    const { versionId } = activateSchema.parse(body)

    // Verify the version belongs to this template
    const versionExists = template.versions.some((v) => v.id === versionId)
    if (!versionExists) {
      throw createError({
        statusCode: 400,
        message: 'Version does not belong to this template',
      })
    }

    const updated = await activatePromptVersion(templateId, versionId)

    return { template: updated }
  } catch (error) {
    console.error('Error activating prompt version:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input: ' + error.errors.map((e) => e.message).join(', '),
      })
    }
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to activate prompt version',
    })
  }
})
