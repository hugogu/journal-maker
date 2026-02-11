import ExcelJS from 'exceljs'
import type { ExportPayload } from './types'

const ACCOUNT_HEADERS = [
  'Account Code',
  'Account Name',
  'Account Type',
  'Normal Direction',
  'Description',
  'Active',
]

const RULE_HEADERS = [
  'Scenario',
  'Event Name',
  'Event Description',
  'Rule Key',
  'Side',
  'Account Code',
  'Account Name',
  'Amount Formula',
  'Conditions',
  'Trigger Type',
]

/**
 * Sanitize and truncate a worksheet name to Excel's 31-character limit.
 * Excel forbids: \ / ? * [ ] and leading/trailing apostrophes.
 */
function truncateSheetName(name: string, maxLen = 31): string {
  // Remove Excel-forbidden characters from sheet names
  const sanitized = name.replace(/[\\/?*[\]]/g, '_').replace(/^'+|'+$/g, '') || 'Sheet'
  if (sanitized.length <= maxLen) return sanitized
  return sanitized.slice(0, maxLen - 1) + '…'
}

/**
 * Deduplicate worksheet names by appending numeric suffixes.
 */
function deduplicateSheetNames(names: string[]): string[] {
  const result: string[] = []
  const counts = new Map<string, number>()

  for (const name of names) {
    const truncated = truncateSheetName(name)
    const count = counts.get(truncated) || 0
    counts.set(truncated, count + 1)

    if (count === 0) {
      result.push(truncated)
    } else {
      const suffix = ` (${count + 1})`
      result.push(truncateSheetName(name, 31 - suffix.length) + suffix)
    }
  }

  return result
}

/**
 * Build an Excel workbook from export data.
 * Returns a Buffer containing the .xlsx file.
 */
export async function buildExcelWorkbook(payload: ExportPayload): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AccountFlow'
  workbook.created = new Date()

  // Accounts worksheet
  const accountsSheet = workbook.addWorksheet('Accounts')
  accountsSheet.addRow(ACCOUNT_HEADERS)

  // Style header row
  const accountHeaderRow = accountsSheet.getRow(1)
  accountHeaderRow.font = { bold: true }
  accountHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  }

  for (const account of payload.accounts) {
    accountsSheet.addRow([
      account.accountCode,
      account.accountName,
      account.accountType,
      account.normalDirection,
      account.description,
      account.active,
    ])
  }

  // Auto-fit column widths (approximate)
  accountsSheet.columns.forEach((col) => {
    let maxLen = 10
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? '').length
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(maxLen + 2, 50)
  })

  // Rules worksheets — one per scenario
  const scenarioNames = payload.scenarios.map((s) => s.scenarioName)
  const sheetNames = deduplicateSheetNames(scenarioNames)

  for (let i = 0; i < payload.scenarios.length; i++) {
    const scenarioData = payload.scenarios[i]
    const sheetName = sheetNames[i]

    const rulesSheet = workbook.addWorksheet(sheetName)
    rulesSheet.addRow(RULE_HEADERS)

    // Style header row
    const headerRow = rulesSheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3E8FF' },
    }

    for (const rule of scenarioData.rules) {
      rulesSheet.addRow([
        rule.scenario,
        rule.eventName,
        rule.eventDescription,
        rule.ruleKey,
        rule.side,
        rule.accountCode,
        rule.accountName,
        rule.amountFormula,
        rule.conditions,
        rule.triggerType,
      ])
    }

    // Auto-fit column widths
    rulesSheet.columns.forEach((col) => {
      let maxLen = 10
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? '').length
        if (len > maxLen) maxLen = len
      })
      col.width = Math.min(maxLen + 2, 50)
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
