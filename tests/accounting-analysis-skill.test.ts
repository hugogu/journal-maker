/**
 * Tests for Accounting Analysis Skill
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  AccountingAnalysisSkill,
  MockAIProvider,
  MemoryStorageAdapter,
  AccountingStandard,
  AccountType,
  AccountDirection,
  type AccountingSubject,
  type JournalRule,
} from '../apps/accountflow/src/skills/accounting-analysis'

describe('AccountingAnalysisSkill', () => {
  let skill: AccountingAnalysisSkill
  let mockProvider: MockAIProvider
  let memoryStorage: MemoryStorageAdapter

  beforeEach(() => {
    mockProvider = new MockAIProvider()
    memoryStorage = new MemoryStorageAdapter()
    skill = new AccountingAnalysisSkill({
      aiProvider: mockProvider,
      storage: memoryStorage,
    })
  })

  describe('analyze()', () => {
    it('should analyze a simple business scenario', async () => {
      const mockResponse = {
        subjects: [
          {
            code: '1001',
            name: '库存现金',
            direction: AccountDirection.DEBIT,
            type: AccountType.ASSET,
          },
          {
            code: '6001',
            name: '主营业务收入',
            direction: AccountDirection.CREDIT,
            type: AccountType.REVENUE,
          },
        ],
        journalRules: [
          {
            eventName: '销售商品',
            eventDescription: '销售商品收到现金',
            debitSide: {
              entries: [
                {
                  accountCode: '1001',
                  accountName: '库存现金',
                  amountFormula: '{{amount}}',
                },
              ],
            },
            creditSide: {
              entries: [
                {
                  accountCode: '6001',
                  accountName: '主营业务收入',
                  amountFormula: '{{amount}}',
                },
              ],
            },
            variables: ['amount'],
          },
        ],
        reasoning: '这是一笔简单的销售业务',
        confidence: 0.95,
      }

      mockProvider.setMockResponse(mockResponse)

      const result = await skill.analyze({
        businessScenario: '公司销售商品收到现金1000元',
        companyContext: {
          accountingStandard: AccountingStandard.CN,
        },
      })

      expect(result.subjects).toHaveLength(2)
      expect(result.journalRules).toHaveLength(1)
      expect(result.subjects[0].code).toBe('1001')
      expect(result.subjects[0].name).toBe('库存现金')
      expect(result.journalRules[0].eventName).toBe('销售商品')
      expect(result.reasoning).toBe('这是一笔简单的销售业务')
      expect(result.confidence).toBe(0.95)
    })

    it('should link subjects to existing accounts', async () => {
      const mockResponse = {
        subjects: [
          {
            code: '1001',
            name: '库存现金',
            direction: AccountDirection.DEBIT,
          },
        ],
        journalRules: [],
      }

      mockProvider.setMockResponse(mockResponse)

      const result = await skill.analyze({
        businessScenario: '收到现金',
        existingAccounts: [
          {
            id: 100,
            code: '1001',
            name: '库存现金',
            type: AccountType.ASSET,
            direction: AccountDirection.DEBIT,
          },
        ],
      })

      expect(result.subjects[0].accountId).toBe(100)
    })

    it('should save result to storage when requested', async () => {
      const mockResponse = {
        subjects: [
          {
            code: '1001',
            name: '现金',
            direction: AccountDirection.DEBIT,
          },
        ],
        journalRules: [],
      }

      mockProvider.setMockResponse(mockResponse)

      const result = await skill.analyze(
        {
          businessScenario: '测试场景',
        },
        {
          save: true,
          context: { scenarioId: 1 },
        }
      )

      expect(result.id).toBeDefined()
      expect(memoryStorage.size()).toBe(1)

      // Should be able to load it back
      const loaded = await skill.load(result.id!)
      expect(loaded).toBeDefined()
      expect(loaded!.subjects).toHaveLength(1)
    })

    it('should throw error for invalid input', async () => {
      await expect(
        skill.analyze({
          businessScenario: '',
        })
      ).rejects.toThrow('Business scenario is required')
    })

    it('should throw error for invalid subjects', async () => {
      const mockResponse = {
        subjects: [
          {
            code: '',
            name: '无效科目',
            direction: AccountDirection.DEBIT,
          },
        ],
        journalRules: [],
      }

      mockProvider.setMockResponse(mockResponse)

      await expect(
        skill.analyze({
          businessScenario: '测试',
        })
      ).rejects.toThrow('Invalid subjects')
    })
  })

  describe('refine()', () => {
    it('should refine an existing analysis', async () => {
      // Initial analysis
      const initialResponse = {
        subjects: [
          {
            code: '1001',
            name: '现金',
            direction: AccountDirection.DEBIT,
          },
        ],
        journalRules: [],
      }
      mockProvider.setMockResponse(initialResponse)

      const initial = await skill.analyze(
        { businessScenario: '销售商品' },
        { save: true }
      )

      // Refined analysis
      const refinedResponse = {
        subjects: [
          {
            code: '1001',
            name: '现金',
            direction: AccountDirection.DEBIT,
          },
          {
            code: '2221',
            name: '应交增值税',
            direction: AccountDirection.CREDIT,
          },
        ],
        journalRules: [],
      }
      mockProvider.setMockResponse(refinedResponse)

      const refined = await skill.refine(initial.id!, '请增加增值税处理')

      expect(refined.subjects).toHaveLength(2)
      expect(refined.subjects[1].code).toBe('2221')
    })

    it('should throw error for non-existent analysis', async () => {
      await expect(
        skill.refine('non_existent_id', 'feedback')
      ).rejects.toThrow('Analysis not found')
    })
  })

  describe('validateEntry()', () => {
    it('should validate a balanced entry', () => {
      const entry = {
        description: '测试分录',
        debitSide: {
          entries: [
            {
              accountCode: '1001',
              amount: 1000,
            },
          ],
        },
        creditSide: {
          entries: [
            {
              accountCode: '6001',
              amount: 1000,
            },
          ],
        },
      }

      const validation = skill.validateEntry(entry)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect unbalanced entry', () => {
      const entry = {
        description: '不平衡分录',
        debitSide: {
          entries: [
            {
              accountCode: '1001',
              amount: 1000,
            },
          ],
        },
        creditSide: {
          entries: [
            {
              accountCode: '6001',
              amount: 900,
            },
          ],
        },
      }

      const validation = skill.validateEntry(entry)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors[0].type).toBe('UNBALANCED')
    })

    it('should detect missing fields', () => {
      const entry = {
        description: '',
        debitSide: {
          entries: [],
        },
        creditSide: {
          entries: [],
        },
      }

      const validation = skill.validateEntry(entry)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should warn about missing description', () => {
      const entry = {
        description: '',
        debitSide: {
          entries: [{ accountCode: '1001', amount: 1000 }],
        },
        creditSide: {
          entries: [{ accountCode: '6001', amount: 1000 }],
        },
      }

      const validation = skill.validateEntry(entry)
      expect(validation.warnings.length).toBeGreaterThan(0)
      expect(validation.warnings[0].type).toBe('MISSING_DESCRIPTION')
    })
  })

  describe('validateRule()', () => {
    it('should validate a correct rule', () => {
      const rule: JournalRule = {
        eventName: '销售商品',
        eventDescription: '销售商品业务',
        debitSide: {
          entries: [
            {
              accountCode: '1001',
              amountFormula: '{{amount}}',
            },
          ],
        },
        creditSide: {
          entries: [
            {
              accountCode: '6001',
              amountFormula: '{{amount}}',
            },
          ],
        },
        variables: ['amount'],
      }

      const validation = skill.validateRule(rule)
      expect(validation.isValid).toBe(true)
    })

    it('should detect missing event name', () => {
      const rule: JournalRule = {
        eventName: '',
        debitSide: {
          entries: [{ accountCode: '1001', amountFormula: '{{amount}}' }],
        },
        creditSide: {
          entries: [{ accountCode: '6001', amountFormula: '{{amount}}' }],
        },
      }

      const validation = skill.validateRule(rule)
      expect(validation.isValid).toBe(false)
      expect(validation.errors[0].type).toBe('MISSING_FIELD')
    })
  })

  describe('validateSubjects()', () => {
    it('should validate correct subjects', () => {
      const subjects: AccountingSubject[] = [
        {
          code: '1001',
          name: '现金',
          direction: AccountDirection.DEBIT,
        },
        {
          code: '6001',
          name: '收入',
          direction: AccountDirection.CREDIT,
        },
      ]

      const validation = skill.validateSubjects(subjects)
      expect(validation.isValid).toBe(true)
    })

    it('should detect duplicate codes', () => {
      const subjects: AccountingSubject[] = [
        {
          code: '1001',
          name: '现金',
          direction: AccountDirection.DEBIT,
        },
        {
          code: '1001',
          name: '重复',
          direction: AccountDirection.DEBIT,
        },
      ]

      const validation = skill.validateSubjects(subjects)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.message.includes('Duplicate'))).toBe(true)
    })
  })

  describe('generateSample()', () => {
    it('should generate sample transaction from rule', () => {
      const rule: JournalRule = {
        eventName: '销售商品',
        eventDescription: '销售商品收款',
        debitSide: {
          entries: [
            {
              accountCode: '1001',
              accountName: '现金',
              amountFormula: '{{amount}}',
            },
          ],
        },
        creditSide: {
          entries: [
            {
              accountCode: '6001',
              accountName: '收入',
              amountFormula: '{{amount}}',
            },
          ],
        },
        variables: ['amount'],
      }

      const sample = skill.generateSample(rule, { amount: 1000 })

      expect(sample.description).toBe('销售商品收款')
      expect(sample.entries).toHaveLength(1)
      expect(sample.entries[0].debitSide.entries[0].amount).toBe(1000)
      expect(sample.entries[0].creditSide.entries[0].amount).toBe(1000)
      expect(sample.variables).toEqual({ amount: 1000 })
    })

    it('should handle formula with calculation', () => {
      const rule: JournalRule = {
        eventName: '含税销售',
        debitSide: {
          entries: [
            {
              accountCode: '1001',
              amountFormula: '{{amount}}',
            },
          ],
        },
        creditSide: {
          entries: [
            {
              accountCode: '6001',
              amountFormula: '{{amount}} / 1.13',
            },
            {
              accountCode: '2221',
              amountFormula: '{{amount}} * 0.13 / 1.13',
            },
          ],
        },
      }

      const sample = skill.generateSample(rule, { amount: 1130 })

      expect(sample.entries[0].debitSide.entries[0].amount).toBe(1130)
      expect(sample.entries[0].creditSide.entries[0].amount).toBeCloseTo(1000, 2)
      expect(sample.entries[0].creditSide.entries[1].amount).toBeCloseTo(130, 2)
    })
  })

  describe('Storage operations', () => {
    it('should save and load analysis', async () => {
      const result = {
        scenario: '测试场景',
        subjects: [
          {
            code: '1001',
            name: '现金',
            direction: AccountDirection.DEBIT,
          },
        ],
        journalRules: [],
        analyzedAt: new Date(),
      }

      const saved = await skill.save(result)
      expect(saved.id).toBeDefined()

      const loaded = await skill.load(saved.id!)
      expect(loaded).toBeDefined()
      expect(loaded!.scenario).toBe('测试场景')
      expect(loaded!.subjects).toHaveLength(1)
    })

    it('should delete analysis', async () => {
      const result = {
        scenario: '待删除',
        subjects: [
          {
            code: '1001',
            name: '现金',
            direction: AccountDirection.DEBIT,
          },
        ],
        journalRules: [],
      }

      const saved = await skill.save(result)
      await skill.delete(saved.id!)

      const loaded = await skill.load(saved.id!)
      expect(loaded).toBeNull()
    })

    it('should list all analyses', async () => {
      await skill.save({
        scenario: '场景1',
        subjects: [{ code: '1001', name: '现金', direction: AccountDirection.DEBIT }],
        journalRules: [],
      })

      await skill.save({
        scenario: '场景2',
        subjects: [{ code: '1002', name: '银行', direction: AccountDirection.DEBIT }],
        journalRules: [],
      })

      const list = await skill.list()
      expect(list.length).toBe(2)
    })

    it('should confirm analysis', async () => {
      const result = {
        scenario: '待确认',
        subjects: [{ code: '1001', name: '现金', direction: AccountDirection.DEBIT }],
        journalRules: [],
      }

      const saved = await skill.save(result)
      await skill.confirm(saved.id!)

      const loaded = await skill.load(saved.id!)
      expect(loaded!.metadata?.confirmed).toBe(true)
    })
  })
})
