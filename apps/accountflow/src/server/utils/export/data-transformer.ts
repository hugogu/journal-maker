import type { ExportRuleRow, ExportAccountRow } from './types'

/**
 * Represents a raw journal rule row from the database.
 */
interface RawJournalRule {
  ruleKey: string
  eventName: string
  eventDescription: string | null
  debitSide: unknown
  creditSide: unknown
  conditions: unknown
  amountFormula: string | null
  triggerType: string | null
  status: string
}

/**
 * Represents a raw account row from the database.
 */
interface RawAccount {
  code: string
  name: string
  type: string
  direction: string
  description: string | null
  isActive: boolean
}

/**
 * An entry line extracted from a debitSide/creditSide JSONB field.
 */
interface EntryLine {
  accountCode: string
  accountName?: string
  amountFormula?: string | null
  description?: string | null
}

/**
 * Normalize a debitSide or creditSide JSONB value into an array of entry lines.
 * Handles both legacy (single object) and normalized (entries array) formats.
 */
function normalizeEntryLines(side: unknown): EntryLine[] {
  if (!side || typeof side !== 'object') return []

  const obj = side as Record<string, unknown>

  // Normalized format: { entries: [...] }
  if (Array.isArray(obj.entries)) {
    return obj.entries.filter(
      (e): e is EntryLine => !!e && typeof e === 'object' && 'accountCode' in (e as Record<string, unknown>)
    )
  }

  // Legacy format: { accountCode, accountName, amountFormula }
  if (typeof obj.accountCode === 'string') {
    return [obj as unknown as EntryLine]
  }

  return []
}

/**
 * Flatten a single journal rule into export rows.
 * Each entry line (debit or credit) becomes its own row.
 */
export function flattenRuleToRows(rule: RawJournalRule, scenarioName: string): ExportRuleRow[] {
  const rows: ExportRuleRow[] = []
  const conditionsStr = rule.conditions ? JSON.stringify(rule.conditions) : ''

  const debitLines = normalizeEntryLines(rule.debitSide)
  for (const line of debitLines) {
    rows.push({
      scenario: scenarioName,
      eventName: rule.eventName,
      eventDescription: rule.eventDescription ?? '',
      ruleKey: rule.ruleKey,
      side: 'Debit',
      accountCode: line.accountCode,
      accountName: line.accountName ?? '',
      amountFormula: line.amountFormula ?? rule.amountFormula ?? '',
      conditions: conditionsStr,
      triggerType: rule.triggerType ?? '',
    })
  }

  const creditLines = normalizeEntryLines(rule.creditSide)
  for (const line of creditLines) {
    rows.push({
      scenario: scenarioName,
      eventName: rule.eventName,
      eventDescription: rule.eventDescription ?? '',
      ruleKey: rule.ruleKey,
      side: 'Credit',
      accountCode: line.accountCode,
      accountName: line.accountName ?? '',
      amountFormula: line.amountFormula ?? rule.amountFormula ?? '',
      conditions: conditionsStr,
      triggerType: rule.triggerType ?? '',
    })
  }

  return rows
}

/**
 * Map a raw account to an export account row.
 */
export function mapAccountToRow(account: RawAccount): ExportAccountRow {
  return {
    accountCode: account.code,
    accountName: account.name,
    accountType: account.type,
    normalDirection: account.direction,
    description: account.description ?? '',
    active: account.isActive ? 'Yes' : 'No',
  }
}

/**
 * Extract unique account codes referenced in the debitSide/creditSide of rules.
 */
export function extractAccountCodes(rules: RawJournalRule[]): string[] {
  const codes = new Set<string>()
  for (const rule of rules) {
    for (const line of normalizeEntryLines(rule.debitSide)) {
      codes.add(line.accountCode)
    }
    for (const line of normalizeEntryLines(rule.creditSide)) {
      codes.add(line.accountCode)
    }
  }
  return Array.from(codes)
}

/**
 * Sanitize a filename by removing filesystem-unsafe characters
 * while preserving Unicode (Chinese) characters.
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'export'
}
