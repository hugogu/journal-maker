import { db } from '../../../db'
import { conversationMessages, scenarios, accounts } from '../../../db/schema'
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
    const scenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.id, scenarioId)
    })
    if (!scenario) throw new AppError(404, 'Scenario not found')
    const userId = 1
    await db.insert(conversationMessages).values({
      scenarioId,
      role: 'user',
      content: data.content,
      timestamp: new Date(),
    })
    const allAccounts = await db.query.accounts.findMany({
      where: eq(accounts.companyId, scenario.companyId)
    })
    const templateScenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.isTemplate, true)
    })
    setResponseStatus(event, 200)
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache, no-transform')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no')
    event._handled = true
    const res = event.node.res
    let fullMessage = ''
    let aiResponse: any = null
    try {
      aiResponse = await aiService.analyzeScenarioStream(
        data.content,
        {
          company: { name: 'Company' },
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
          const responseData = JSON.stringify({ type: 'chunk', content: chunk })
          res.write(`data: ${responseData}\n\n`)
        }
      )
      const finalData = JSON.stringify({ type: 'complete', message: aiResponse.message })
      res.write(`data: ${finalData}\n\n`)
      await db.insert(conversationMessages).values({
        scenarioId,
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        requestLog: aiResponse.requestLog,
        responseStats: aiResponse.responseStats,
      })
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()
    } catch (error) {
      console.error('Streaming error:', error)
      const errorData = JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      res.write(`data: ${errorData}\n\n`)
      res.end()
    }
    return new Promise(() => {})
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
