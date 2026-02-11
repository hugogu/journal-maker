import archiver from 'archiver'
import type { ExportPayload } from './types'

const BOM = '\uFEFF'

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
 * Escape a CSV field per RFC 4180.
 * Fields containing commas, double quotes, or newlines are wrapped in double quotes.
 * Double quotes within fields are escaped as "".
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Build a CSV string from headers and rows of string values.
 * Includes UTF-8 BOM for Excel compatibility.
 */
export function buildCsvString(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',')
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(','))
  return BOM + [headerLine, ...dataLines].join('\r\n') + '\r\n'
}

/**
 * Build the accounts CSV content from export payload.
 */
function buildAccountsCsv(payload: ExportPayload): string {
  const rows = payload.accounts.map((a) => [
    a.accountCode,
    a.accountName,
    a.accountType,
    a.normalDirection,
    a.description,
    a.active,
  ])
  return buildCsvString(ACCOUNT_HEADERS, rows)
}

/**
 * Build a rules CSV content for one scenario.
 */
function buildRulesCsv(rules: ExportPayload['scenarios'][0]['rules']): string {
  const rows = rules.map((r) => [
    r.scenario,
    r.eventName,
    r.eventDescription,
    r.ruleKey,
    r.side,
    r.accountCode,
    r.accountName,
    r.amountFormula,
    r.conditions,
    r.triggerType,
  ])
  return buildCsvString(RULE_HEADERS, rows)
}

/**
 * Build a ZIP buffer containing CSV files for the export payload.
 * For single scenario: accounts.csv + rules.csv
 * For multi-scenario: accounts.csv + {scenario-name}-rules.csv per scenario
 */
export async function buildCsvZipBuffer(payload: ExportPayload, sanitizeFilename: (name: string) => string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    // Add accounts CSV
    const accountsCsv = buildAccountsCsv(payload)
    archive.append(accountsCsv, { name: 'accounts.csv' })

    // Add rules CSV(s)
    if (payload.scenarios.length === 1) {
      const rulesCsv = buildRulesCsv(payload.scenarios[0].rules)
      archive.append(rulesCsv, { name: 'rules.csv' })
    } else {
      for (const scenario of payload.scenarios) {
        const rulesCsv = buildRulesCsv(scenario.rules)
        const safeName = sanitizeFilename(scenario.scenarioName)
        archive.append(rulesCsv, { name: `${safeName}-rules.csv` })
      }
    }

    archive.finalize()
  })
}
