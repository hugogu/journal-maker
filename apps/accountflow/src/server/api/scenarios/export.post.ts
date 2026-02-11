import { handleError, AppError } from '../../utils/error'
import { bulkExportSchema } from '../../utils/schemas'
import { getExportDataForScenarios } from '../../db/queries/export'
import { flattenRuleToRows, mapAccountToRow, sanitizeFilename } from '../../utils/export/data-transformer'
import { buildExcelWorkbook } from '../../utils/export/excel-builder'
import { buildCsvZipBuffer } from '../../utils/export/csv-builder'
import type { ExportPayload } from '../../utils/export/types'
import { db } from '../../db'
import { scenarios } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const parsed = bulkExportSchema.parse(body)
    const { scenarioIds, format } = parsed

    // Get company ID from first scenario (all must belong to same company)
    const firstScenario = await db.query.scenarios.findFirst({
      where: eq(scenarios.id, scenarioIds[0]),
    })
    if (!firstScenario) {
      throw new AppError(404, 'Scenario not found')
    }
    const companyId = firstScenario.companyId

    // Fetch export data
    const exportResult = await getExportDataForScenarios(scenarioIds, companyId)

    if (exportResult.scenariosWithRules.length === 0) {
      setResponseStatus(event, 400)
      return { success: false, message: 'No confirmed rules found in any selected scenario' }
    }

    // Transform data
    const payload: ExportPayload = {
      scenarios: exportResult.scenariosWithRules.map(({ scenario: s, rules }) => ({
        scenarioName: s.name,
        rules: rules.flatMap((r) => flattenRuleToRows(r, s.name)),
      })),
      accounts: exportResult.accounts.map(mapAccountToRow),
    }

    const date = new Date().toISOString().slice(0, 10)

    if (format === 'xlsx') {
      const buffer = await buildExcelWorkbook(payload)
      setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      setHeader(event, 'Content-Disposition', `attachment; filename="scenarios-export-${date}.xlsx"`)
      return buffer
    }

    // CSV format: ZIP
    const zipBuffer = await buildCsvZipBuffer(payload, sanitizeFilename)
    setHeader(event, 'Content-Type', 'application/zip')
    setHeader(event, 'Content-Disposition', `attachment; filename="scenarios-export-${date}.zip"`)
    return zipBuffer
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      setResponseStatus(event, 400)
      return { success: false, message: 'Invalid request body', errors: (error as any).issues }
    }
    const { statusCode, body } = handleError(error)
    setResponseStatus(event, statusCode)
    return body
  }
})
