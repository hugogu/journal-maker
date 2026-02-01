import { db } from '../../../db'
import { scenarios, accounts, journalRules, sampleTransactions, conversations } from '../../../db/schema'
import { AppError, handleError, successResponse } from '../../../utils/error'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const scenarioId = Number(getRouterParam(event, 'id'))
    if (!scenarioId) throw new AppError(400, 'Invalid scenario ID')
    
    const query = getQuery(event)
    const format = query.format as string
    
    // Get all scenario data
    const scenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.id, scenarioId)
    })
    if (!scenario) throw new AppError(404, 'Scenario not found')
    
    const allAccounts = await db.query.accounts.findMany({
      where: eq(accounts.companyId, scenario.companyId)
    })
    
    const rules = await db.query.journalRules.findMany({
      where: eq(journalRules.scenarioId, scenarioId)
    })
    
    const transactions = await db.query.sampleTransactions.findMany({
      where: eq(sampleTransactions.scenarioId, scenarioId)
    })
    
    const chatHistory = await db.query.conversations.findMany({
      where: eq(conversations.scenarioId, scenarioId),
      orderBy: (c, { asc }) => asc(c.createdAt)
    })
    
    const exportData = {
      scenario: {
        name: scenario.name,
        description: scenario.description,
        status: scenario.status,
        createdAt: scenario.createdAt,
      },
      accounts: allAccounts.map(a => ({
        code: a.code,
        name: a.name,
        type: a.type,
        direction: a.direction,
      })),
      journalRules: rules.map(r => ({
        eventName: r.eventName,
        eventDescription: r.eventDescription,
        conditions: r.conditions,
      })),
      sampleTransactions: transactions.map(t => ({
        description: t.description,
        entries: t.entries,
      })),
      analysisHistory: chatHistory.map(c => ({
        role: c.role,
        content: c.content,
        structuredData: c.structuredData,
        createdAt: c.createdAt,
      })),
    }
    
    if (format === 'json') {
      setHeader(event, 'Content-Type', 'application/json')
      setHeader(event, 'Content-Disposition', `attachment; filename="${scenario.name}-export.json"`)
      return exportData
    }
    
    // Excel format - return JSON for now (Excel generation would need xlsx library)
    setHeader(event, 'Content-Type', 'application/json')
    setHeader(event, 'Content-Disposition', `attachment; filename="${scenario.name}-export.json"`)
    return exportData
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
