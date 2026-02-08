/**
 * Validator for journal entries and accounting rules
 * Ensures entries follow basic accounting principles
 */

import type {
  JournalEntry,
  JournalRule,
  AccountingSubject,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  JournalEntryLine,
} from './types'

/**
 * Validate a journal entry
 */
export function validateJournalEntry(entry: JournalEntry): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check that both sides exist
  if (!entry.debitSide || !entry.debitSide.entries || entry.debitSide.entries.length === 0) {
    errors.push({
      type: 'MISSING_FIELD',
      message: 'Debit side must have at least one entry',
      field: 'debitSide',
    })
  }

  if (!entry.creditSide || !entry.creditSide.entries || entry.creditSide.entries.length === 0) {
    errors.push({
      type: 'MISSING_FIELD',
      message: 'Credit side must have at least one entry',
      field: 'creditSide',
    })
  }

  // If we have actual amounts (not formulas), check balance
  if (errors.length === 0) {
    const debitTotal = calculateTotal(entry.debitSide.entries)
    const creditTotal = calculateTotal(entry.creditSide.entries)

    if (debitTotal !== null && creditTotal !== null) {
      if (Math.abs(debitTotal - creditTotal) > 0.01) {
        errors.push({
          type: 'UNBALANCED',
          message: `Entry is unbalanced: debit ${debitTotal} ≠ credit ${creditTotal}`,
          details: { debitTotal, creditTotal, difference: debitTotal - creditTotal },
        })
      }
    }
  }

  // Check for missing descriptions
  if (!entry.description || entry.description.trim() === '') {
    warnings.push({
      type: 'MISSING_DESCRIPTION',
      message: 'Entry is missing a description',
      field: 'description',
      suggestion: 'Add a description to explain the transaction',
    })
  }

  // Validate each line
  entry.debitSide.entries.forEach((line, idx) => {
    validateEntryLine(line, 'debit', idx, errors, warnings)
  })

  entry.creditSide.entries.forEach((line, idx) => {
    validateEntryLine(line, 'credit', idx, errors, warnings)
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate a journal rule template
 */
export function validateJournalRule(rule: JournalRule): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check event name
  if (!rule.eventName || rule.eventName.trim() === '') {
    errors.push({
      type: 'MISSING_FIELD',
      message: 'Rule must have an event name',
      field: 'eventName',
    })
  }

  // Check sides exist
  if (!rule.debitSide || !rule.debitSide.entries || rule.debitSide.entries.length === 0) {
    errors.push({
      type: 'MISSING_FIELD',
      message: 'Debit side must have at least one entry',
      field: 'debitSide',
    })
  }

  if (!rule.creditSide || !rule.creditSide.entries || rule.creditSide.entries.length === 0) {
    errors.push({
      type: 'MISSING_FIELD',
      message: 'Credit side must have at least one entry',
      field: 'creditSide',
    })
  }

  // Validate template variables
  const usedVariables = new Set<string>()

  if (rule.debitSide?.entries) {
    rule.debitSide.entries.forEach(line => {
      extractVariables(line.amountFormula).forEach(v => usedVariables.add(v))
    })
  }

  if (rule.creditSide?.entries) {
    rule.creditSide.entries.forEach(line => {
      extractVariables(line.amountFormula).forEach(v => usedVariables.add(v))
    })
  }

  // Check if variables are documented
  if (usedVariables.size > 0 && (!rule.variables || rule.variables.length === 0)) {
    warnings.push({
      type: 'OTHER',
      message: `Rule uses variables ${Array.from(usedVariables).join(', ')} but they are not documented`,
      field: 'variables',
      suggestion: 'Add a variables field to document the expected variables',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate accounting subjects
 */
export function validateAccountingSubjects(subjects: AccountingSubject[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check for duplicate codes
  const codes = new Set<string>()
  subjects.forEach((subject, idx) => {
    if (!subject.code || subject.code.trim() === '') {
      errors.push({
        type: 'MISSING_FIELD',
        message: `Subject at index ${idx} is missing a code`,
        field: `subjects[${idx}].code`,
      })
    } else {
      if (codes.has(subject.code)) {
        errors.push({
          type: 'OTHER',
          message: `Duplicate subject code: ${subject.code}`,
          field: `subjects[${idx}].code`,
        })
      }
      codes.add(subject.code)
    }

    if (!subject.name || subject.name.trim() === '') {
      errors.push({
        type: 'MISSING_FIELD',
        message: `Subject ${subject.code} is missing a name`,
        field: `subjects[${idx}].name`,
      })
    }

    if (!subject.direction) {
      errors.push({
        type: 'MISSING_FIELD',
        message: `Subject ${subject.code} is missing a direction`,
        field: `subjects[${idx}].direction`,
      })
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate a single entry line
 */
function validateEntryLine(
  line: JournalEntryLine,
  side: 'debit' | 'credit',
  index: number,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!line.accountCode || line.accountCode.trim() === '') {
    errors.push({
      type: 'MISSING_FIELD',
      message: `${side} entry at index ${index} is missing an account code`,
      field: `${side}Side.entries[${index}].accountCode`,
    })
  }

  // Check for amount or formula
  if (!line.amount && !line.amountFormula) {
    warnings.push({
      type: 'OTHER',
      message: `${side} entry at index ${index} has no amount or formula`,
      field: `${side}Side.entries[${index}].amount`,
      suggestion: 'Provide either an amount or an amountFormula',
    })
  }

  // Validate amount is positive
  if (line.amount !== undefined && line.amount < 0) {
    errors.push({
      type: 'INVALID_AMOUNT',
      message: `${side} entry at index ${index} has negative amount`,
      field: `${side}Side.entries[${index}].amount`,
    })
  }
}

/**
 * Calculate total amount from entry lines
 * Returns null if any line uses a formula instead of a fixed amount
 */
function calculateTotal(lines: JournalEntryLine[]): number | null {
  let total = 0

  for (const line of lines) {
    if (line.amount !== undefined) {
      total += line.amount
    } else if (line.amountFormula) {
      // Has a formula, can't calculate total
      return null
    }
  }

  return total
}

/**
 * Extract variable names from a formula
 * E.g., "{{amount}} * 0.13" -> ["amount"]
 */
function extractVariables(formula?: string): string[] {
  if (!formula) return []

  const matches = formula.matchAll(/\{\{(\w+)\}\}/g)
  return Array.from(matches, m => m[1])
}

/**
 * Check if a formula is valid
 */
export function validateFormula(formula: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Basic syntax check
  const openBraces = (formula.match(/\{\{/g) || []).length
  const closeBraces = (formula.match(/\}\}/g) || []).length

  if (openBraces !== closeBraces) {
    errors.push({
      type: 'OTHER',
      message: 'Unmatched braces in formula',
      details: { openBraces, closeBraces },
    })
  }

  // Check for dangerous patterns (injection prevention)
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /import\s+/,
    /require\s*\(/,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(formula)) {
      errors.push({
        type: 'OTHER',
        message: 'Formula contains potentially dangerous code',
        details: { pattern: pattern.source },
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
