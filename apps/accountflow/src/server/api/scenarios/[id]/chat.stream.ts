import { db } from '../../../db'
import { conversations, scenarios, accounts } from '../../../db/schema'
import { sendMessageSchema } from '../../../utils/schemas'
import { AppError, handleError } from '../../../utils/error'
import { aiService } from '../../../utils/ai-service'
import { eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, readBody, setResponseStatus, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const scenarioId = Number(getRouterParam(event, 'id'))
    if (!scenarioId) throw new AppError(400, 'Invalid scenario ID')
    
    const body = await readBody(event)
    const data = sendMessageSchema.parse(body)
    
    // Get scenario
    const scenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.id, scenarioId)
    })
    if (!scenario) throw new AppError(404, 'Scenario not found')
    
    // Save user message
    // TODO: Get actual user ID from session
    const userId = 1
    await db.insert(conversations).values({
      scenarioId,
      userId,
      role: 'user',
      content: data.content,
    })
    
    // Get context for AI
    const allAccounts = await db.query.accounts.findMany({
      where: eq(accounts.companyId, scenario.companyId)
    })
    
    // Get template scenario if exists
    const templateScenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.isTemplate, true)
    })
    
    // Set up SSE headers
    setResponseStatus(event, 200)
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache')
    setHeader(event, 'Connection', 'keep-alive')
    
    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullMessage = ''
          let aiResponse: any = null
          
          // Call AI service with streaming
          aiResponse = await aiService.analyzeScenarioStream(
            data.content,
            {
              company: { name: 'Company' }, // TODO: Get actual company
              accounts: allAccounts,
              templateScenario: templateScenario ? {
                name: templateScenario.name,
                description: templateScenario.description || undefined,
                rules: []
              } : undefined,
              currentScenario: {
                name: scenario.name,
                description: scenario.description || undefined
              }
            },
            (chunk: string) => {
              fullMessage += chunk
              // Send chunk to client
              const responseData = JSON.stringify({ 
                type: 'chunk', 
                content: chunk,
                fullContent: fullMessage 
              })
              controller.enqueue(`data: ${responseData}\n\n`)
            }
          )
          
          // Send completion signal with final message
          const finalData = JSON.stringify({
            type: 'complete',
            message: aiResponse.message
          })
          controller.enqueue(`data: ${finalData}\n\n`)
          
          // Save AI response to database
          await db.insert(conversations).values({
            scenarioId,
            userId: 1, // system
            role: 'assistant',
            content: aiResponse.message,
            structuredData: null, // No structured data needed for markdown approach
          })
          
          // Send done signal
          controller.enqueue(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          controller.close()
          
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
          controller.enqueue(`data: ${errorData}\n\n`)
          controller.close()
        }
      }
    })
    
    return stream
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
