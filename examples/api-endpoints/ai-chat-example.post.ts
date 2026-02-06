/**
 * Example API endpoint showing how to use the new callChat and assembleSystemPrompt
 * This demonstrates a refactored approach to AI-powered journal rule generation
 */

import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../../db'
import { scenarios } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { aiService } from '../../../utils/ai-service'
import { assembleSystemPrompt } from '../../../utils/prompt-assembler'
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

    // BEFORE: Manually building account list
    // const allAccounts = await db.query.accounts.findMany(...)
    // const accountsList = allAccounts.map(a => `${a.code} ${a.name}`).join(', ')
    // const systemPrompt = `You are an accounting expert. Available accounts: ${accountsList}...`

    // AFTER: Use assembleSystemPrompt for consistent, length-limited prompts
    const systemPrompt = await assembleSystemPrompt(scenario.companyId, scenarioId)

    // Prepare messages
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      {
        role: 'user' as const,
        content: userMessage,
      },
    ]

    // Get available tools/functions for function calling
    const tools = enableFunctionCalling ? getAvailableTools() : undefined

    // BEFORE: Creating adapter and calling directly
    // const adapter = await getAdapter(...)
    // const response = await adapter.chatCompletion({
    //   model: model,
    //   messages: messages,
    //   tools: tools,
    //   temperature: 0.7
    // })

    // AFTER: Use callChat for simplified, unified API
    const response = await aiService.callChat(messages, {
      userId: 1, // TODO: Get from session
      tools,
      temperature: 0.7,
    })

    // Process any function calls
    const functionCallResults = []
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
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
      message: response.content,
      functionCalls: functionCallResults,
      usage: response.usage,
      model: response.model,
    })
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
