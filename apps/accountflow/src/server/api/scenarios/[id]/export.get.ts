import { db } from '../../../db'
import { scenarios, accounts, journalRules, sampleTransactions, conversationMessages } from '../../../db/schema'
import { AppError, handleError } from '../../../utils/error'
import { eq } from 'drizzle-orm'
import { getExportDataForScenarios } from '../../../db/queries/export'
import { flattenRuleToRows, mapAccountToRow, sanitizeFilename } from '../../../utils/export/data-transformer'
import { buildExcelWorkbook } from '../../../utils/export/excel-builder'
import { buildCsvZipBuffer } from '../../../utils/export/csv-builder'
import type { ExportPayload } from '../../../utils/export/types'

export default defineEventHandler(async (event) => {
  try {
    const scenarioId = Number(getRouterParam(event, 'id'))
    if (!scenarioId) throw new AppError(400, 'Invalid scenario ID')

    const query = getQuery(event)
    const format = (query.format as string) || 'json'

    if (!['json', 'xlsx', 'csv'].includes(format)) {
      throw new AppError(400, `Invalid format: ${format}. Must be json, xlsx, or csv.`)
    }

    // Get scenario
    const scenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.id, scenarioId)
    })
    if (!scenario) throw new AppError(404, 'Scenario not found')

    // JSON format: keep original behavior
    if (format === 'json') {
      const allAccounts = await db.query.accounts.findMany({
        where: eq(accounts.companyId, scenario.companyId)
      })

      const rules = await db.query.journalRules.findMany({
        where: eq(journalRules.scenarioId, scenarioId)
      })

      const transactions = await db.query.sampleTransactions.findMany({
        where: eq(sampleTransactions.scenarioId, scenarioId)
      })

      const chatHistory = await db.query.conversationMessages.findMany({
        where: eq(conversationMessages.scenarioId, scenarioId),
        orderBy: (c, { asc }) => asc(c.timestamp)
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
          debitSide: r.debitSide,
          creditSide: r.creditSide,
          triggerType: r.triggerType,
          status: r.status,
          amountFormula: r.amountFormula,
        })),
        sampleTransactions: transactions.map(t => ({
          description: t.description,
          entries: t.entries,
        })),
        analysisHistory: chatHistory.map(c => ({
          role: c.role,
          content: c.content,
          structuredData: c.structuredData,
          requestLog: c.requestLog,
          responseStats: c.responseStats,
          timestamp: c.timestamp,
          createdAt: c.createdAt,
        })),
      }

      const safeName = sanitizeFilename(scenario.name)
      setHeader(event, 'Content-Type', 'application/json')
      setHeader(event, 'Content-Disposition', `attachment; filename="${safeName}-export.json"`)
      return exportData
    }

    // xlsx/csv format: export confirmed rules + referenced accounts
    const exportResult = await getExportDataForScenarios([scenarioId], scenario.companyId)

    if (exportResult.scenariosWithRules.length === 0) {
      return { success: false, message: 'No confirmed rules to export for this scenario' }
    }

    // Transform data
    const payload: ExportPayload = {
      scenarios: exportResult.scenariosWithRules.map(({ scenario: s, rules }) => ({
        scenarioName: s.name,
        rules: rules.flatMap((r) => flattenRuleToRows(r, s.name)),
      })),
      accounts: exportResult.accounts.map(mapAccountToRow),
    }

    const safeName = sanitizeFilename(scenario.name)

    if (format === 'xlsx') {
      const buffer = await buildExcelWorkbook(payload)
      setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      setHeader(event, 'Content-Disposition', `attachment; filename="${safeName}-export.xlsx"`)
      return buffer
    }

    // CSV format: ZIP with accounts.csv + rules.csv
    const zipBuffer = await buildCsvZipBuffer(payload, sanitizeFilename)
    setHeader(event, 'Content-Type', 'application/zip')
    setHeader(event, 'Content-Disposition', `attachment; filename="${safeName}-export.zip"`)
    return zipBuffer
  } catch (error) {
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
