import { defineEventHandler, createError, readBody } from 'h3'
import { createPromptTemplate } from '../../db/queries/prompts'
import { z } from 'zod'

const createTemplateSchema = z.object({
  scenarioType: z.enum(['scenario_analysis', 'sample_generation', 'prompt_generation', 'flowchart_generation']),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  initialContent: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = createTemplateSchema.parse(body)

    const template = await createPromptTemplate({
      scenarioType: data.scenarioType,
      name: data.name,
      description: data.description || null,
      activeVersionId: null,
    })

    // Create initial version
    const { createPromptVersion } = await import('../../db/queries/prompts')
    const version = await createPromptVersion({
      templateId: template.id,
      content: data.initialContent,
      variables: [],
      createdBy: 1, // TODO: Get actual user ID from session
    })

    // Activate the initial version
    const { activatePromptVersion } = await import('../../db/queries/prompts')
    await activatePromptVersion(template.id, version.id)

    return { template, version }
  } catch (error) {
    console.error('Error creating prompt template:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to create prompt template'
    })
  }
})
