import { defineEventHandler, createError, readBody } from 'h3'
import { aiService } from '../../utils/ai-service'
import { createError as createH3Error } from 'h3'

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

    const systemPrompt = `You are an expert at writing system prompts for AI assistants. 
Your task is to generate a high-quality system prompt based on the user's requirements.

The prompt should:
1. Be clear and specific about the AI's role
2. Include relevant context and constraints
3. Specify the expected output format
4. Use {{variableName}} syntax for dynamic variables where appropriate

Respond with only the generated prompt text, no explanations.`

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
