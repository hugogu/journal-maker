import { defineEventHandler, createError, readBody } from 'h3'
import { aiService } from '../../utils/ai-service'
import { createError as createH3Error } from 'h3'
import { getActivePromptContent } from '../../db/queries/prompts'

interface AIGenerateRequest {
  requirementDescription: string
  scenarioType: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as AIGenerateRequest

    if (!body.requirementDescription || !body.scenarioType) {
      throw createH3Error({
        statusCode: 400,
        message: 'requirementDescription and scenarioType are required',
      })
    }

    // Get the system prompt from database for prompt_generation scenario
    const systemPrompt = await getActivePromptContent('prompt_generation')
    
    if (!systemPrompt) {
      throw createH3Error({
        statusCode: 500,
        message: 'No active prompt template found for prompt_generation. Please configure one in Admin > Prompts.',
      })
    }

    const userPrompt = `Generate a system prompt for the following use case:

Scenario Type: ${body.scenarioType}
Requirements: ${body.requirementDescription}

Generate the system prompt:`

    // Use the default AI provider
    const result = await aiService.analyzeScenario(userPrompt, {
      company: { name: 'Prompt Generation' },
      accounts: [],
    })

    // Extract suggested variables from the generated content
    const variableRegex = /\{\{(\w+)\}\}/g
    const suggestedVariables: string[] = []
    let match
    while ((match = variableRegex.exec(result.message)) !== null) {
      if (!suggestedVariables.includes(match[1])) {
        suggestedVariables.push(match[1])
      }
    }

    return {
      generatedContent: result.message,
      suggestedVariables,
    }
  } catch (error) {
    console.error('Error generating prompt:', error)
    throw createH3Error({
      statusCode: 500,
      message: 'Failed to generate prompt',
    })
  }
})
