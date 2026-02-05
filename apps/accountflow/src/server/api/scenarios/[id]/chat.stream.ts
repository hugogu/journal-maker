import { db } from '../../../db'
import { conversationMessages, scenarios, accounts } from '../../../db/schema'
import { sendMessageSchema } from '../../../utils/schemas'
import { AppError, handleError } from '../../../utils/error'
import { aiService } from '../../../utils/ai-service'
import { createAnalysisArtifacts } from '../../../db/queries/analysis-artifacts'
import { parseAIResponse } from '../../../../utils/ai-response-parser'
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
    const [userMessageRecord] = await db.insert(conversationMessages).values({
      scenarioId,
      role: 'user',
      content: data.content,
      timestamp: new Date(),
    }).returning()
    
    const allAccounts = await db.query.accounts.findMany({
      where: eq(accounts.companyId, scenario.companyId)
    }) || []
    const templateScenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.isTemplate, true)
    })
    setResponseStatus(event, 200)
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache, no-transform')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no')
    // Disable compression to ensure real-time streaming
    setHeader(event, 'Content-Encoding', 'identity')
    event._handled = true
    const res = event.node.res
    
    // Send user message ID to frontend
    res.write(`data: ${JSON.stringify({ type: 'user_saved', id: userMessageRecord.id }) }\n\n`)
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
          // Flush to ensure real-time streaming
          if (typeof (res as any).flush === 'function') {
            (res as any).flush()
          }
        },
        userId,
        data.providerId,
        data.model
      )
      const finalData = JSON.stringify({ type: 'complete', message: aiResponse.message })
      res.write(`data: ${finalData}\n\n`)
      if (typeof (res as any).flush === 'function') {
        (res as any).flush()
      }
      const [assistantMessageRecord] = await db.insert(conversationMessages).values({
        scenarioId,
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        structuredData: aiResponse.structured,
        requestLog: aiResponse.requestLog,
        responseStats: aiResponse.responseStats,
      }).returning()

      const parsed = parseAIResponse(aiResponse.message)
      await createAnalysisArtifacts({
        scenarioId,
        sourceMessageId: assistantMessageRecord.id,
        subjects: parsed.subjects,
        entries: parsed.entries,
        diagrams: (parsed.diagrams || []).map((diagram) => ({
          diagramType: 'mermaid',
          payload: { mermaid: diagram },
        })),
      })
      res.write(`data: ${JSON.stringify({ type: 'done', id: assistantMessageRecord.id }) }\n\n`)
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
