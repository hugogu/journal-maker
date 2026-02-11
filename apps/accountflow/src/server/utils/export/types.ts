/**
 * Export-specific TypeScript types for the data export feature.
 * Used by data-transformer, excel-builder, and csv-builder utilities.
 */

/** Flat row representing one debit or credit entry line from a journal rule */
export interface ExportRuleRow {
  scenario: string
  eventName: string
  eventDescription: string
  ruleKey: string
  side: 'Debit' | 'Credit'
  accountCode: string
  accountName: string
  amountFormula: string
  conditions: string
  triggerType: string
}

/** Flat row representing one account entry */
export interface ExportAccountRow {
  accountCode: string
  accountName: string
  accountType: string
  normalDirection: string
  description: string
  active: string
}

/** Aggregated export data for one scenario */
export interface ExportScenarioData {
  scenarioName: string
  rules: ExportRuleRow[]
}

/** Complete export payload passed to builders */
export interface ExportPayload {
  scenarios: ExportScenarioData[]
  accounts: ExportAccountRow[]
}
