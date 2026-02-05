import { db } from '../../../db'
import { conversationMessages, scenarios, accounts } from '../../../db/schema'
import { sendMessageSchema } from '../../../utils/schemas'
import { AppError, handleError, successResponse } from '../../../utils/error'
import { aiService } from '../../../utils/ai-service'
import { createAnalysisArtifacts } from '../../../db/queries/analysis-artifacts'
import { parseAIResponse } from '../../../../utils/ai-response-parser'
import { eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'

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
    await db.insert(conversationMessages).values({
      scenarioId,
      role: 'user',
      content: data.content,
      timestamp: new Date(),
    })
    
    // Get context for AI
    const allAccounts = await db.query.accounts.findMany({
      where: eq(accounts.companyId, scenario.companyId)
    })
    
    // Get template scenario if exists
    const templateScenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.isTemplate, true)
    })
    
    // Call AI service
    const aiResponse = await aiService.analyzeScenario(data.content, {
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
    })
    
    // Save AI response
    const [assistantMessageRecord] = await db.insert(conversationMessages).values({
      scenarioId,
      role: 'assistant',
      content: aiResponse.message,
      structuredData: aiResponse.structured,
      requestLog: aiResponse.requestLog,
      responseStats: aiResponse.responseStats,
      timestamp: new Date(),
    }).returning()

    const parsed = parseAIResponse(aiResponse.message)
    await createAnalysisArtifacts({
      scenarioId,
      sourceMessageId: assistantMessageRecord.id,
      subjects: parsed.subjects,
      entries: parsed.entries,
      diagrams: parsed.diagrams.map((diagram) => ({
        diagramType: 'mermaid',
        payload: { mermaid: diagram },
      })),
    })
    
    return successResponse(aiResponse)
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
