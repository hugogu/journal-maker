/**
 * Diff algorithm for journal entries comparison across accounting systems
 */

export interface LineItem {
  accountId?: number
  accountCode: string
  accountName?: string
  amount: number
  description?: string
}

export interface JournalEntry {
  id?: string
  date?: string
  description: string
  debits: LineItem[]
  credits: LineItem[]
}

export interface ComparedLineItem extends LineItem {
  diffStatus: 'identical' | 'modified' | 'added' | 'removed'
  diffDetails?: {
    field: string
    otherValues: Record<string, number | string>
  }
}

export interface ComparedEntry extends Omit<JournalEntry, 'debits' | 'credits'> {
  debits: ComparedLineItem[]
  credits: ComparedLineItem[]
  diffStatus: 'identical' | 'modified' | 'added' | 'removed'
}

export interface DiffResult {
  entries: ComparedEntry[]
  summary: {
    totalDifferences: number
    accountDifferences: number
    amountDifferences: number
    timingDifferences: number
    ruleDifferences: number
  }
  differences: Array<{
    type: 'account' | 'amount' | 'timing' | 'rule' | 'entry'
    severity: 'high' | 'medium' | 'low'
    description: string
    systems: string[]
    entryId?: string
    explanation?: {
      cause: 'different_accounts' | 'different_rules' | 'different_preferences' | 'system_specific'
      details: string
    }
  }>
}

/**
 * Compare two sets of journal entries
 */
export function compareJournalEntries(
  entriesA: JournalEntry[],
  entriesB: JournalEntry[],
  systemAId: string,
  systemBId: string
): DiffResult {
  const comparedEntries: ComparedEntry[] = []
  const differences: DiffResult['differences'] = []
  let accountDiffs = 0
  let amountDiffs = 0
  let timingDiffs = 0
  let ruleDiffs = 0

  // Create maps for faster lookup
  const entriesBMap = new Map(entriesB.map(e => [getEntryKey(e), e]))
  const processedBKeys = new Set<string>()

  // Compare entries from A against B
  for (const entryA of entriesA) {
    const key = getEntryKey(entryA)
    const entryB = entriesBMap.get(key)

    if (!entryB) {
      // Entry exists in A but not in B (removed in B)
      comparedEntries.push({
        ...entryA,
        debits: entryA.debits.map(d => ({ ...d, diffStatus: 'removed' })),
        credits: entryA.credits.map(c => ({ ...c, diffStatus: 'removed' })),
        diffStatus: 'removed',
      })
      differences.push({
        type: 'entry',
        severity: 'high',
        description: `Entry "${entryA.description}" exists in system ${systemAId} but not in system ${systemBId}`,
        systems: [systemAId, systemBId],
        explanation: {
          cause: 'system_specific',
          details: 'Entry handling differs between accounting systems',
        },
      })
      ruleDiffs++
    } else {
      processedBKeys.add(key)
      const compared = compareEntry(entryA, entryB, systemAId, systemBId)
      comparedEntries.push(compared.entry)
      differences.push(...compared.differences)
      accountDiffs += compared.accountDiffCount
      amountDiffs += compared.amountDiffCount
      timingDiffs += compared.timingDiffCount
    }
  }

  // Find entries that exist only in B (added in B)
  for (const entryB of entriesB) {
    const key = getEntryKey(entryB)
    if (!processedBKeys.has(key)) {
      comparedEntries.push({
        ...entryB,
        debits: entryB.debits.map(d => ({ ...d, diffStatus: 'added' })),
        credits: entryB.credits.map(c => ({ ...c, diffStatus: 'added' })),
        diffStatus: 'added',
      })
      differences.push({
        type: 'entry',
        severity: 'high',
        description: `Entry "${entryB.description}" exists in system ${systemBId} but not in system ${systemAId}`,
        systems: [systemAId, systemBId],
        explanation: {
          cause: 'system_specific',
          details: 'Entry handling differs between accounting systems',
        },
      })
      ruleDiffs++
    }
  }

  return {
    entries: comparedEntries,
    summary: {
      totalDifferences: differences.length,
      accountDifferences: accountDiffs,
      amountDifferences: amountDiffs,
      timingDifferences: timingDiffs,
      ruleDifferences: ruleDiffs,
    },
    differences,
  }
}

/**
 * Generate a unique key for an entry based on description and date
 */
function getEntryKey(entry: JournalEntry): string {
  const date = entry.date || ''
  const desc = entry.description || ''
  return `${date}_${desc}`.toLowerCase().trim()
}

/**
 * Compare two individual entries
 */
function compareEntry(
  entryA: JournalEntry,
  entryB: JournalEntry,
  systemAId: string,
  systemBId: string
): {
  entry: ComparedEntry
  differences: DiffResult['differences']
  accountDiffCount: number
  amountDiffCount: number
  timingDiffCount: number
} {
  const comparedDebits: ComparedLineItem[] = []
  const comparedCredits: ComparedLineItem[] = []
  const differences: DiffResult['differences'] = []
  let accountDiffCount = 0
  let amountDiffCount = 0
  let timingDiffCount = 0

  // Compare debits
  const debitComparison = compareLineItems(
    entryA.debits,
    entryB.debits,
    systemAId,
    systemBId,
    'debit'
  )
  comparedDebits.push(...debitComparison.items)
  differences.push(...debitComparison.differences)
  accountDiffCount += debitComparison.accountDiffCount
  amountDiffCount += debitComparison.amountDiffCount

  // Compare credits
  const creditComparison = compareLineItems(
    entryA.credits,
    entryB.credits,
    systemAId,
    systemBId,
    'credit'
  )
  comparedCredits.push(...creditComparison.items)
  differences.push(...creditComparison.differences)
  accountDiffCount += creditComparison.accountDiffCount
  amountDiffCount += creditComparison.amountDiffCount

  // Check for timing differences (date)
  if (entryA.date !== entryB.date) {
    timingDiffCount++
    differences.push({
      type: 'timing',
      severity: 'medium',
      description: `Timing difference for "${entryA.description}": ${entryA.date || 'N/A'} vs ${entryB.date || 'N/A'}`,
      systems: [systemAId, systemBId],
      explanation: {
        cause: 'different_preferences',
        details: 'Different recognition timing rules between systems',
      },
    })
  }

  // Determine overall entry diff status
  let diffStatus: ComparedEntry['diffStatus'] = 'identical'
  if (comparedDebits.some(d => d.diffStatus !== 'identical') ||
      comparedCredits.some(c => c.diffStatus !== 'identical')) {
    diffStatus = 'modified'
  }

  return {
    entry: {
      ...entryA,
      debits: comparedDebits,
      credits: comparedCredits,
      diffStatus,
    },
    differences,
    accountDiffCount,
    amountDiffCount,
    timingDiffCount,
  }
}

/**
 * Compare line items (debits or credits)
 */
function compareLineItems(
  itemsA: LineItem[],
  itemsB: LineItem[],
  systemAId: string,
  systemBId: string,
  side: 'debit' | 'credit'
): {
  items: ComparedLineItem[]
  differences: DiffResult['differences']
  accountDiffCount: number
  amountDiffCount: number
} {
  const comparedItems: ComparedLineItem[] = []
  const differences: DiffResult['differences'] = []
  let accountDiffCount = 0
  let amountDiffCount = 0

  // Create maps by account code
  const itemsBMap = new Map(itemsB.map(i => [i.accountCode, i]))
  const processedBCodes = new Set<string>()

  // Compare items from A against B
  for (const itemA of itemsA) {
    const itemB = itemsBMap.get(itemA.accountCode)

    if (!itemB) {
      // Account exists in A but not in B
      comparedItems.push({
        ...itemA,
        diffStatus: 'removed',
      })
      differences.push({
        type: 'account',
        severity: 'high',
        description: `${side === 'debit' ? 'Debit' : 'Credit'} account ${itemA.accountCode} exists in system ${systemAId} but not in system ${systemBId}`,
        systems: [systemAId, systemBId],
        explanation: {
          cause: 'different_accounts',
          details: 'Different account mappings between systems',
        },
      })
      accountDiffCount++
    } else {
      processedBCodes.add(itemA.accountCode)
      const compared = compareLineItem(itemA, itemB, systemAId, systemBId)
      comparedItems.push(compared.item)
      if (compared.difference) {
        differences.push(compared.difference)
        amountDiffCount++
      }
    }
  }

  // Find items that exist only in B
  for (const itemB of itemsB) {
    if (!processedBCodes.has(itemB.accountCode)) {
      comparedItems.push({
        ...itemB,
        diffStatus: 'added',
      })
      differences.push({
        type: 'account',
        severity: 'high',
        description: `${side === 'debit' ? 'Debit' : 'Credit'} account ${itemB.accountCode} exists in system ${systemBId} but not in system ${systemAId}`,
        systems: [systemAId, systemBId],
        explanation: {
          cause: 'different_accounts',
          details: 'Different account mappings between systems',
        },
      })
      accountDiffCount++
    }
  }

  return {
    items: comparedItems,
    differences,
    accountDiffCount,
    amountDiffCount,
  }
}

/**
 * Compare two line items
 */
function compareLineItem(
  itemA: LineItem,
  itemB: LineItem,
  systemAId: string,
  systemBId: string
): {
  item: ComparedLineItem
  difference: DiffResult['differences'][0] | null
} {
  const amountDiff = Math.abs(itemA.amount - itemB.amount) > 0.01
  const descDiff = itemA.description !== itemB.description

  if (!amountDiff && !descDiff) {
    return {
      item: { ...itemA, diffStatus: 'identical' },
      difference: null,
    }
  }

  const diffDetails: ComparedLineItem['diffDetails'] = {
    field: amountDiff ? 'amount' : 'description',
    otherValues: {
      [systemAId]: amountDiff ? itemA.amount : itemA.description || '',
      [systemBId]: amountDiff ? itemB.amount : itemB.description || '',
    },
  }

  const difference: DiffResult['differences'][0] = {
    type: amountDiff ? 'amount' : 'rule',
    severity: amountDiff ? 'high' : 'low',
    description: amountDiff
      ? `Amount difference for account ${itemA.accountCode}: ${itemA.amount} vs ${itemB.amount}`
      : `Description difference for account ${itemA.accountCode}`,
    systems: [systemAId, systemBId],
    explanation: {
      cause: amountDiff ? 'different_rules' : 'different_preferences',
      details: amountDiff
        ? 'Different amount calculation rules between systems'
        : 'Different description conventions between systems',
    },
  }

  return {
    item: {
      ...itemA,
      diffStatus: 'modified',
      diffDetails,
    },
    difference,
  }
}

/**
 * Compare analyses across multiple systems
 */
export function compareMultipleSystems(
  analyses: Array<{
    systemId: string
    systemName: string
    entries: JournalEntry[]
  }>
): DiffResult & {
  systemComparisons: Array<{
    systemA: { id: string; name: string }
    systemB: { id: string; name: string }
    result: DiffResult
  }>
} {
  const systemComparisons: Array<{
    systemA: { id: string; name: string }
    systemB: { id: string; name: string }
    result: DiffResult
  }> = []

  // Compare each pair of systems
  for (let i = 0; i < analyses.length; i++) {
    for (let j = i + 1; j < analyses.length; j++) {
      const result = compareJournalEntries(
        analyses[i].entries,
        analyses[j].entries,
        analyses[i].systemId,
        analyses[j].systemId
      )
      systemComparisons.push({
        systemA: { id: analyses[i].systemId, name: analyses[i].systemName },
        systemB: { id: analyses[j].systemId, name: analyses[j].systemName },
        result,
      })
    }
  }

  // Aggregate differences from all comparisons
  const allDifferences = systemComparisons.flatMap(sc => sc.result.differences)
  const uniqueDifferences = deduplicateDifferences(allDifferences)

  // Calculate aggregate summary
  const summary = systemComparisons.reduce(
    (acc, sc) => ({
      totalDifferences: acc.totalDifferences + sc.result.summary.totalDifferences,
      accountDifferences: acc.accountDifferences + sc.result.summary.accountDifferences,
      amountDifferences: acc.amountDifferences + sc.result.summary.amountDifferences,
      timingDifferences: acc.timingDifferences + sc.result.summary.timingDifferences,
      ruleDifferences: acc.ruleDifferences + sc.result.summary.ruleDifferences,
    }),
    {
      totalDifferences: 0,
      accountDifferences: 0,
      amountDifferences: 0,
      timingDifferences: 0,
      ruleDifferences: 0,
    }
  )

  return {
    entries: systemComparisons[0]?.result.entries || [],
    summary,
    differences: uniqueDifferences,
    systemComparisons,
  }
}

/**
 * Deduplicate differences based on description
 */
function deduplicateDifferences(
  differences: DiffResult['differences']
): DiffResult['differences'] {
  const seen = new Set<string>()
  return differences.filter(d => {
    const key = `${d.type}_${d.description}_${d.systems.sort().join(',')}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
