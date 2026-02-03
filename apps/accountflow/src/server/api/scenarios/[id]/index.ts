import { db } from '../../../db'
import { scenarios, journalRules, sampleTransactions, conversations, flowchartData } from '../../../db/schema'
import { updateScenarioSchema, confirmScenarioSchema } from '../../../utils/schemas'
import { AppError, handleError, successResponse } from '../../../utils/error'
import { eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, getMethod, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const scenarioId = Number(getRouterParam(event, 'id'))
    if (!scenarioId) throw new AppError(400, 'Invalid scenario ID')
    
    const method = getMethod(event)
    
    if (method === 'GET') {
      const scenario = await db.query.scenarios.findFirst({
        where: eq(scenarios.id, scenarioId)
      })
      
      if (!scenario) throw new AppError(404, 'Scenario not found')
      
      return successResponse(scenario)
    }
    
    if (method === 'PUT') {
      const body = await readBody(event)
      const data = updateScenarioSchema.parse(body)
      
      const [scenario] = await db.update(scenarios)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(scenarios.id, scenarioId))
        .returning()
      
      return successResponse(scenario)
    }
    
    if (method === 'DELETE') {
      // Delete related data first
      await db.delete(conversations).where(eq(conversations.scenarioId, scenarioId))
      await db.delete(flowchartData).where(eq(flowchartData.scenarioId, scenarioId))
      await db.delete(sampleTransactions).where(eq(sampleTransactions.scenarioId, scenarioId))
      await db.delete(journalRules).where(eq(journalRules.scenarioId, scenarioId))
      
      await db.delete(scenarios).where(eq(scenarios.id, scenarioId))
      
      return successResponse({ success: true })
    }
    
    if (method === 'POST') {
      // Check if it's a confirm action
      const body = await readBody(event)
      
      if (body.action === 'confirm') {
        const [scenario] = await db.update(scenarios)
          .set({ status: 'confirmed', updatedAt: new Date() })
          .where(eq(scenarios.id, scenarioId))
          .returning()
        
        return successResponse(scenario)
      }
    }
    
    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
