import { describe, it, expect, beforeEach, vi } from 'vitest'
import { assembleSystemPrompt } from '../apps/accountflow/src/server/utils/prompt-assembler'

// Mock the database
const mockAccounts = [
  {
    id: 1,
    companyId: 1,
    code: '1001',
    name: 'Cash',
    type: 'asset' as const,
    direction: 'debit' as const,
    description: 'Cash account',
    parentId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    companyId: 1,
    code: '1002',
    name: 'Accounts Receivable',
    type: 'asset' as const,
    direction: 'debit' as const,
    description: 'AR account',
    parentId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    companyId: 1,
    code: '2001',
    name: 'Accounts Payable',
    type: 'liability' as const,
    direction: 'credit' as const,
    description: 'AP account',
    parentId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    companyId: 1,
    code: '4001',
    name: 'Revenue',
    type: 'revenue' as const,
    direction: 'credit' as const,
    description: 'Revenue account',
    parentId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

vi.mock('../apps/accountflow/src/server/db', () => ({
  db: {
    query: {
      accounts: {
        findMany: vi.fn(async () => mockAccounts),
      },
    },
  },
}))

describe('assembleSystemPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should assemble a basic system prompt with accounts', async () => {
    const prompt = await assembleSystemPrompt(1)

    expect(prompt).toBeDefined()
    expect(prompt).toContain('You are an accounting AI assistant')
    expect(prompt).toContain('1001:Cash')
    expect(prompt).toContain('1002:Accounts Receivable')
    expect(prompt).toContain('2001:Accounts Payable')
    expect(prompt).toContain('4001:Revenue')
  })

  it('should include scenario ID when provided', async () => {
    const prompt = await assembleSystemPrompt(1, 42)

    expect(prompt).toBeDefined()
    expect(prompt).toContain('Scenario ID: 42')
  })

  it('should not exceed 1500 characters', async () => {
    const prompt = await assembleSystemPrompt(1)

    expect(prompt.length).toBeLessThanOrEqual(1500)
  })

  it('should format accounts as code:name pairs', async () => {
    const prompt = await assembleSystemPrompt(1)

    expect(prompt).toMatch(/\d{4}:\w+/)
    expect(prompt).toContain('1001:Cash')
    expect(prompt).toContain(', 1002:Accounts Receivable, ')
  })

  it('should truncate accounts list if it exceeds character limit', async () => {
    // Mock a large number of accounts
    const manyAccounts = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      companyId: 1,
      code: `${1000 + i}`,
      name: `Account ${i + 1} with a very long descriptive name that takes up space`,
      type: 'asset' as const,
      direction: 'debit' as const,
      description: null,
      parentId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    const { db } = await import('../apps/accountflow/src/server/db')
    vi.mocked(db.query.accounts.findMany).mockResolvedValueOnce(manyAccounts as any)

    const prompt = await assembleSystemPrompt(1)

    expect(prompt.length).toBeLessThanOrEqual(1500)
    expect(prompt).toContain('... (truncated)')
  })

  it('should handle empty accounts list', async () => {
    const { db } = await import('../apps/accountflow/src/server/db')
    vi.mocked(db.query.accounts.findMany).mockResolvedValueOnce([])

    const prompt = await assembleSystemPrompt(1)

    expect(prompt).toBeDefined()
    expect(prompt).toContain('You are an accounting AI assistant')
    expect(prompt.length).toBeLessThanOrEqual(1500)
  })

  it('should handle both companyId and scenarioId parameters', async () => {
    const prompt = await assembleSystemPrompt(1, 100)

    expect(prompt).toBeDefined()
    expect(prompt).toContain('Scenario ID: 100')
    expect(prompt).toContain('1001:Cash')
    expect(prompt.length).toBeLessThanOrEqual(1500)
  })

  it('should maintain account order from database', async () => {
    const prompt = await assembleSystemPrompt(1)

    const cashIndex = prompt.indexOf('1001:Cash')
    const arIndex = prompt.indexOf('1002:Accounts Receivable')
    const apIndex = prompt.indexOf('2001:Accounts Payable')

    expect(cashIndex).toBeGreaterThan(-1)
    expect(arIndex).toBeGreaterThan(cashIndex)
    expect(apIndex).toBeGreaterThan(arIndex)
  })
})
