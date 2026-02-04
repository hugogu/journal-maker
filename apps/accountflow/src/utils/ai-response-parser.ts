import type { AccountingSubject, AccountingRule, ParsedAnalysis } from '../types'

/**
 * Parse AI response content to extract structured analysis data
 * Supports:
 * - Mermaid code blocks (```mermaid ... ```)
 * - JSON blocks for subjects and rules
 * - Fallback text extraction for tables
 */
export function parseAIResponse(content: string): ParsedAnalysis {
  return {
    subjects: extractSubjects(content),
    rules: extractRules(content),
    diagrams: extractMermaidDiagrams(content),
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
 * Extract accounting rules from AI response
 */
export function extractRules(content: string): AccountingRule[] {
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
 * Check if parsed analysis has any extractable content
 */
export function hasExtractableContent(parsed: ParsedAnalysis): boolean {
  return (
    parsed.subjects.length > 0 ||
    parsed.rules.length > 0 ||
    parsed.diagrams.length > 0
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
    // Pattern: 1. 规则描述：借记xxx，贷记xxx
    /(\d+)\.\s*([^：:]+)[：:]\s*借记\s*(\S+)\s*[，,]\s*贷记\s*(\S+)/g,
    // Pattern: - 规则描述
    /[-•]\s*规则\s*(\d+)?[：:]?\s*(.+?)(?=\n[-•]|\n\n|$)/g,
  ]

  for (const pattern of rulePatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      if (match.length >= 3) {
        rules.push({
          id: `RULE-${match[1] || rules.length + 1}`.padStart(3, '0'),
          description: match[2]?.trim() || match[0].trim(),
          debitAccount: match[3]?.trim(),
          creditAccount: match[4]?.trim(),
        })
      }
    }
  }

  return rules
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
