import { db } from '../../../db'
import { conversations, scenarios, accounts } from '../../../db/schema'
import { sendMessageSchema } from '../../../utils/schemas'
import { AppError, handleError, successResponse } from '../../../utils/error'
import { aiService } from '../../../utils/ai-service'
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
    
    // Call AI service
    const aiResponse = await aiService.analyzeScenario(data.content, {
      company: { name: 'Company' }, // TODO: Get actual company
      accounts: allAccounts,
      templateScenario: templateScenario ? {
        name: templateScenario.name,
        description: templateScenario.description || undefined,
        rules: []
      } : undefined
    })
    
    // Save AI response
    await db.insert(conversations).values({
      scenarioId,
      userId: 1, // system
      role: 'assistant',
      content: aiResponse.message,
      structuredData: aiResponse.structured,
    })
    
    return successResponse(aiResponse)
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
