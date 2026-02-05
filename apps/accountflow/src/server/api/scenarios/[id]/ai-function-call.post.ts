/**
 * Demo endpoint showing how to use function calling with schemas
 * POST /api/scenarios/[id]/ai-function-call
 * 
 * This demonstrates AI-powered rule generation using function calling
 */

import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../../db'
import { scenarios, accounts } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { AIService } from '../../../utils/ai-service'
import { getAvailableTools, validateFunctionCall } from '../../../utils/function-calling'
import { AppError, handleError, successResponse } from '../../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const scenarioId = Number(getRouterParam(event, 'id'))
    if (!scenarioId) throw new AppError(400, 'Invalid scenario ID')

    const body = await readBody(event)
    const { userMessage, enableFunctionCalling = true } = body

    if (!userMessage) {
      throw new AppError(400, 'userMessage is required')
    }

    // Get scenario
    const scenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.id, scenarioId),
    })
    if (!scenario) throw new AppError(404, 'Scenario not found')

    // Get available accounts
    const allAccounts = await db.query.accounts.findMany({
      where: eq(accounts.companyId, scenario.companyId),
      orderBy: accounts.code,
    })

    // Initialize AI service
    const aiService = new AIService()

    // Build context
    const context = {
      company: {
        name: 'Demo Company',
        industry: 'General',
      },
      accounts: allAccounts,
      currentScenario: {
        name: scenario.name,
        description: scenario.description || undefined,
      },
    }

    // Prepare messages
    const messages = [
      {
        role: 'system' as const,
        content: `You are an accounting expert helping to analyze business scenarios and create journal entry rules.
        
Available accounts:
${allAccounts.map(a => `- ${a.code} ${a.name} (${a.type}, ${a.direction})`).join('\n')}

Current scenario: ${scenario.name}
${scenario.description ? `Description: ${scenario.description}` : ''}

When proposing journal rules:
1. Use the propose_journal_rule function to create structured rule proposals
2. Include clear reasoning for your proposals
3. Specify account codes, names, and amount formulas
4. Consider standard accounting principles (debit = credit)
5. Provide alternative approaches when applicable`,
      },
      {
        role: 'user' as const,
        content: userMessage,
      },
    ]

    // Get available tools/functions for function calling
    const tools = enableFunctionCalling ? getAvailableTools() : undefined

    // Make AI request with function calling enabled
    const result = await aiService.analyze({
      scenarioId,
      companyId: scenario.companyId,
      userId: 1, // TODO: Get from session
      messages,
      tools,
    })

    // Process any function calls
    const functionCallResults = []
    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls) {
        try {
          const args = JSON.parse(toolCall.function.arguments)
          const validation = validateFunctionCall(toolCall.function.name, args)

          if (validation.success) {
            functionCallResults.push({
              toolCallId: toolCall.id,
              functionName: toolCall.function.name,
              arguments: validation.data,
              validation: 'success',
            })
          } else {
            functionCallResults.push({
              toolCallId: toolCall.id,
              functionName: toolCall.function.name,
              error: validation.error,
              validation: 'failed',
            })
          }
        } catch (error: any) {
          functionCallResults.push({
            toolCallId: toolCall.id,
            functionName: toolCall.function.name,
            error: error.message,
            validation: 'error',
          })
        }
      }
    }

    return successResponse({
      message: result.message,
      structured: result.structured,
      functionCalls: functionCallResults,
      usage: result.responseStats,
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
