import { db } from '../../../../db'
import { scenarios, accounts, journalRules, sampleTransactions, conversations } from '../../../../db/schema'
import { AppError, handleError, successResponse } from '../../../../utils/error'
import { aiService } from '../../../../utils/ai-service'
import { eq } from 'drizzle-orm'
import { createSampleTransactionSchema } from '../../../../utils/schemas'

export default defineEventHandler(async (event) => {
  try {
    const scenarioId = Number(getRouterParam(event, 'id'))
    if (!scenarioId) throw new AppError(400, 'Invalid scenario ID')
    
    const method = getMethod(event)
    
    if (method === 'GET') {
      const transactions = await db.query.sampleTransactions.findMany({
        where: eq(sampleTransactions.scenarioId, scenarioId),
        orderBy: (tx, { desc }) => desc(tx.createdAt)
      })
      return successResponse(transactions)
    }
    
    if (method === 'POST') {
      const body = await readBody(event)
      
      // Check if auto-generation or manual
      if (body.autoGenerate) {
        // Get scenario and rules
        const scenario = await db.query.scenarios.findFirst({
          where: eq(scenarios.id, scenarioId)
        })
        if (!scenario) throw new AppError(404, 'Scenario not found')
        
        const rules = await db.query.journalRules.findMany({
          where: eq(journalRules.scenarioId, scenarioId)
        })
        
        const allAccounts = await db.query.accounts.findMany({
          where: eq(accounts.companyId, scenario.companyId)
        })
        
        // Generate sample using AI
        const resolveAccount = (side: any, fallbackId?: number | null) => {
          if (side?.accountId) return String(side.accountId)
          if (side?.accountCode) return String(side.accountCode)
          if (side?.account?.code) return String(side.account.code)
          if (fallbackId) return String(fallbackId)
          return ''
        }

        const generated = await aiService.generateSampleTransaction(
          scenario.description || scenario.name,
          rules.map(r => ({
            event: r.eventName,
            debit: resolveAccount(r.debitSide, r.debitAccountId),
            credit: resolveAccount(r.creditSide, r.creditAccountId),
            description: r.eventDescription || ''
          })),
          allAccounts
        )
        
        const [transaction] = await db.insert(sampleTransactions).values({
          scenarioId,
          description: generated.description,
          entries: generated.entries,
          generatedBy: 'ai'
        }).returning()
        
        return successResponse(transaction)
      }
      
      // Manual creation
      const data = createSampleTransactionSchema.parse(body)
      const [transaction] = await db.insert(sampleTransactions).values({
        ...data,
        scenarioId,
        generatedBy: 'manual'
      }).returning()
      
      return successResponse(transaction)
    }
    
    throw new AppError(405, 'Method not allowed')
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
