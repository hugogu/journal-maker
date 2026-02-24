import type { AccountingSubject, AccountingRule, AnalysisEntry, ParsedAnalysis } from '../types'

/**
 * Parse AI response content to extract structured analysis data
 * Supports:
 * - Mermaid code blocks (```mermaid ... ```)
 * - JSON blocks for subjects and rules
 * - Fallback text extraction for tables
 */
export function parseAIResponse(content: string): ParsedAnalysis {
  return {
    subjects: extractSubjects(content) || [],
    rules: extractRules(content) || [],
    diagrams: extractMermaidDiagrams(content) || [],
    entries: extractEntries(content) || [],
    rawContent: content,
  }
}

/**
 * Extract mermaid diagrams from markdown code blocks
 */
export function extractMermaidDiagrams(content: string): string[] {
  const diagrams: string[] = []
  const mermaidRegex = /```mermaid\s*([\s\S]*?)```/gi

  let match
  while ((match = mermaidRegex.exec(content)) !== null) {
    const diagram = match[1].trim()
    if (diagram) {
      diagrams.push(diagram)
    }
  }

  return diagrams
}

/**
 * Extract accounting subjects from AI response
 * Tries JSON format first, then falls back to table/text extraction
 */
export function extractSubjects(content: string): AccountingSubject[] {
  // Try to find structured.accounts from nested JSON format
  const structuredData = extractStructuredData(content)
  if (structuredData?.accounts && Array.isArray(structuredData.accounts)) {
    const subjects = structuredData.accounts.map((a: any) => ({
      code: a.code,
      name: a.name,
      direction: a.type === 'asset' ? 'debit' : a.type === 'liability' ? 'credit' : 'debit',
      description: a.reason,
    })).filter(isValidSubject)
    if (subjects.length > 0) return subjects
  }

  // Try to find JSON array for subjects
  const jsonSubjects = extractJSONArray<AccountingSubject>(content, 'subjects')
  if (jsonSubjects.length > 0) {
    return jsonSubjects.filter(isValidSubject)
  }

  // Try to find subjects in a JSON code block
  const jsonBlockSubjects = extractJSONFromCodeBlock<AccountingSubject[]>(content, 'subjects')
  if (jsonBlockSubjects && Array.isArray(jsonBlockSubjects)) {
    return jsonBlockSubjects.filter(isValidSubject)
  }

  // Fallback: try to extract from table format
  return extractSubjectsFromTable(content)
}

/**
 * Clean account code by removing amount information
 * Converts formats like "2202-07:1015" or "2202-07:1000;6601-01:10" to just "2202-07"
 * Returns null if format is invalid
 */
function cleanAccountCode(account: string | undefined): string | undefined {
  if (!account) return undefined
  
  // Handle multiple accounts (semicolon separated) - take only the first one
  const firstAccount = account.split(';')[0].trim()
  
  // Remove amount suffix (colon followed by number)
  // Match pattern like "2202-07:1015" -> extract "2202-07"
  const cleanCode = firstAccount.replace(/:\d+$/, '').trim()
  
  // Validate the cleaned code (should be alphanumeric with optional hyphens)
  if (!/^\w[\w\-]*$/.test(cleanCode)) {
    console.warn(`[cleanAccountCode] Invalid account code after cleaning: "${cleanCode}" (original: "${account}")`)
    return undefined
  }
  
  return cleanCode
}

/**
 * Extract accounting rules from AI response
 */
export function extractRules(content: string): AccountingRule[] {
  // Try to find structured.rules from nested JSON format
  const structuredData = extractStructuredData(content)
  if (structuredData?.rules && Array.isArray(structuredData.rules)) {
    const rules = structuredData.rules.map((r: any, index: number) => {
      // Extract event name from various possible formats
      const eventName = r.event?.name || r.event || r.eventName || undefined
      
      // Clean account codes (remove amount information)
      const rawDebit = r.debit || r.debitAccount
      const rawCredit = r.credit || r.creditAccount
      const debitAccount = cleanAccountCode(rawDebit)
      const creditAccount = cleanAccountCode(rawCredit)

      // Log if we had to clean the data
      if ((rawDebit && rawDebit !== debitAccount) || (rawCredit && rawCredit !== creditAccount)) {
        console.log(`[extractRules] Rule ${index + 1} cleaned account codes:`, {
          id: r.id,
          rawDebit: rawDebit,
          cleanedDebit: debitAccount,
          rawCredit: rawCredit,
          cleanedCredit: creditAccount
        })
      }

      return {
        id: r.id || `RULE-${String(index + 1).padStart(3, '0')}`,
        event: eventName,
        description: r.description || r.event?.description || '',
        condition: r.condition || r.event?.condition,
        debitAccount,
        creditAccount,
      }
    }).filter(isValidRule)
    if (rules.length > 0) return rules
  }

  // Try to find JSON array for rules
  const jsonRules = extractJSONArray<AccountingRule>(content, 'rules')
  if (jsonRules.length > 0) {
    return jsonRules.filter(isValidRule)
  }

  // Try to find rules in a JSON code block
  const jsonBlockRules = extractJSONFromCodeBlock<AccountingRule[]>(content, 'rules')
  if (jsonBlockRules && Array.isArray(jsonBlockRules)) {
    return jsonBlockRules.filter(isValidRule)
  }

  // Fallback: try to extract from numbered list format
  return extractRulesFromList(content)
}

/**
 * Extract structured data from the nested JSON format
 * Looks for {"structured": {"accounts": [...], "rules": [...]}} pattern
 */
function extractStructuredData(content: string): any {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/gi

  let match
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    const jsonContent = match[1].trim()
    try {
      const parsed = JSON.parse(jsonContent)
      if (parsed.structured) {
        return parsed.structured
      }
    } catch {
      // Continue to next block
    }
  }

  return null
}

/**
 * Check if parsed analysis has any extractable content
 */
export function hasExtractableContent(parsed: ParsedAnalysis): boolean {
  return (
    parsed.subjects.length > 0 ||
    parsed.rules.length > 0 ||
    parsed.diagrams.length > 0 ||
    !!(parsed.entries && parsed.entries.length > 0)
  )
}

// --- Helper functions ---

function extractJSONArray<T>(content: string, key: string): T[] {
  // Look for patterns like "会计科目" or "subjects" followed by JSON array
  const patterns = [
    new RegExp(`["']?${key}["']?\\s*[：:]\\s*\\[([\\s\\S]*?)\\]`, 'i'),
    new RegExp(`## .*${key}.*\\s*\\n\\s*\\[([\\s\\S]*?)\\]`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      try {
        return JSON.parse(`[${match[1]}]`)
      } catch {
        // Continue to next pattern
      }
    }
  }

  return []
}

function extractJSONFromCodeBlock<T>(content: string, hint: string): T | null {
  // Find JSON code blocks that might contain subjects or rules
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/gi

  let match
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    const jsonContent = match[1].trim()
    // Check if this block seems related to what we're looking for
    const contextBefore = content.substring(Math.max(0, match.index - 100), match.index)

    if (contextBefore.toLowerCase().includes(hint) ||
        contextBefore.includes('科目') ||
        contextBefore.includes('规则')) {
      try {
        return JSON.parse(jsonContent)
      } catch {
        // Continue to next block
      }
    }
  }

  // Try any JSON array block as fallback
  const jsonBlockRegex2 = /```json\s*(\[[\s\S]*?\])```/gi
  while ((match = jsonBlockRegex2.exec(content)) !== null) {
    try {
      return JSON.parse(match[1])
    } catch {
      // Continue
    }
  }

  return null
}

function extractSubjectsFromTable(content: string): AccountingSubject[] {
  const subjects: AccountingSubject[] = []

  // Look for table rows with account info
  // Pattern: | code | name | direction |
  const tableRowRegex = /\|\s*(\d{4})\s*\|\s*([^|]+)\s*\|\s*(借|贷|debit|credit)\s*\|/gi

  let match
  while ((match = tableRowRegex.exec(content)) !== null) {
    const direction = match[3].toLowerCase()
    subjects.push({
      code: match[1].trim(),
      name: match[2].trim(),
      direction: direction === '借' || direction === 'debit' ? 'debit' : 'credit',
    })
  }

  return subjects
}

function extractRulesFromList(content: string): AccountingRule[] {
  const rules: AccountingRule[] = []

  // Look for numbered rules or bullet points with accounting rules
  const rulePatterns = [
    // Pattern: 1. 事件名：规则描述：借记xxx，贷记xxx
    /(\d+)\.\s*([^：:]+)[：:]\s*([^：:]+)[：:]\s*借记\s*(\S+)\s*[，,]\s*贷记\s*(\S+)/g,
    // Pattern: 1. 规则描述：借记xxx，贷记xxx
    /(\d+)\.\s*([^：:]+)[：:]\s*借记\s*(\S+)\s*[，,]\s*贷记\s*(\S+)/g,
    // Pattern: - 规则描述
    /[-•]\s*规则\s*(\d+)?[：:]?\s*(.+?)(?=\n[-•]|\n\n|$)/g,
  ]

  for (const pattern of rulePatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      if (match.length >= 6) {
        // Pattern with event name
        rules.push({
          id: `RULE-${match[1] || rules.length + 1}`.padStart(3, '0'),
          event: match[2]?.trim(),
          description: match[3]?.trim() || match[0].trim(),
          debitAccount: match[4]?.trim(),
          creditAccount: match[5]?.trim(),
        })
      } else if (match.length >= 5) {
        // Pattern without event name
        rules.push({
          id: `RULE-${match[1] || rules.length + 1}`.padStart(3, '0'),
          description: match[2]?.trim() || match[0].trim(),
          debitAccount: match[3]?.trim(),
          creditAccount: match[4]?.trim(),
        })
      } else if (match.length >= 3) {
        // Basic pattern
        rules.push({
          id: `RULE-${match[1] || rules.length + 1}`.padStart(3, '0'),
          description: match[2]?.trim() || match[0].trim(),
        })
      }
    }
  }

  return rules
}

function extractEntries(content: string): AnalysisEntry[] {
  const jsonEntries = extractJSONArray<AnalysisEntry>(content, 'entries')
  if (jsonEntries.length > 0) {
    return jsonEntries.filter(isValidEntry)
  }

  const jsonBlockEntries = extractJSONFromCodeBlock<AnalysisEntry[]>(content, 'entries')
  if (jsonBlockEntries && Array.isArray(jsonBlockEntries)) {
    return jsonBlockEntries.filter(isValidEntry)
  }

  return []
}

function isValidSubject(subject: unknown): subject is AccountingSubject {
  if (!subject || typeof subject !== 'object') return false
  const s = subject as Record<string, unknown>
  return (
    typeof s.code === 'string' &&
    s.code.length > 0 &&
    typeof s.name === 'string' &&
    s.name.length > 0 &&
    (s.direction === 'debit' || s.direction === 'credit')
  )
}

function isValidRule(rule: unknown): rule is AccountingRule {
  if (!rule || typeof rule !== 'object') return false
  const r = rule as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    r.id.length > 0 &&
    typeof r.description === 'string' &&
    r.description.length > 0
  )
}

function isValidEntry(entry: unknown): entry is AnalysisEntry {
  if (!entry || typeof entry !== 'object') return false
  const e = entry as Record<string, unknown>
  if (!Array.isArray(e.lines) || e.lines.length === 0) return false
  return true
}
