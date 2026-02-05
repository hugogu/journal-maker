import { describe, it, expect } from 'vitest'
import {
  AccountSchema,
  EntrySide,
  JournalRuleSchema,
  RuleProposalSchema,
  ScenarioContextSchema,
  zodToJsonSchema,
} from '../apps/accountflow/src/server/utils/schemas'

describe('Zod Schemas', () => {
  describe('AccountSchema', () => {
    it('should validate a valid account object (positive case)', () => {
      const validAccount = {
        id: 1,
        code: '1001',
        name: 'Cash',
        type: 'asset',
        direction: 'debit',
        description: 'Cash account for daily transactions',
        parentId: null,
        isActive: true,
      }

      const result = AccountSchema.safeParse(validAccount)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.code).toBe('1001')
        expect(result.data.name).toBe('Cash')
        expect(result.data.type).toBe('asset')
      }
    })

    it('should reject invalid account data (negative case)', () => {
      const invalidAccount = {
        id: -1, // negative ID
        code: '', // empty code
        name: '', // empty name
        type: 'invalid_type', // invalid type
        direction: 'invalid', // invalid direction
      }

      const result = AccountSchema.safeParse(invalidAccount)
      expect(result.success).toBe(false)
    })

    it('should allow optional fields to be omitted', () => {
      const minimalAccount = {
        code: '2001',
        name: 'Accounts Payable',
        type: 'liability',
        direction: 'credit',
      }

      const result = AccountSchema.safeParse(minimalAccount)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isActive).toBe(true) // default value
      }
    })
  })

  describe('EntrySide', () => {
    it('should validate valid entry sides (positive case)', () => {
      expect(EntrySide.safeParse('debit').success).toBe(true)
      expect(EntrySide.safeParse('credit').success).toBe(true)
    })

    it('should reject invalid entry sides (negative case)', () => {
      expect(EntrySide.safeParse('invalid').success).toBe(false)
      expect(EntrySide.safeParse('both').success).toBe(false)
      expect(EntrySide.safeParse('').success).toBe(false)
      expect(EntrySide.safeParse(123).success).toBe(false)
    })
  })

  describe('JournalRuleSchema', () => {
    it('should validate a complete journal rule (positive case)', () => {
      const validRule = {
        id: 1,
        eventName: 'Sales Transaction',
        eventDescription: 'Record sales revenue and accounts receivable',
        debitAccountId: 1001,
        creditAccountId: 4001,
        debitSide: {
          accountCode: '1001',
          accountName: 'Accounts Receivable',
          amountFormula: 'amount',
        },
        creditSide: {
          accountCode: '4001',
          accountName: 'Sales Revenue',
          amountFormula: 'amount',
        },
        conditions: { type: 'sale', status: 'completed' },
        amountFormula: 'amount * 1.13',
        triggerType: 'manual',
        status: 'confirmed',
      }

      const result = JournalRuleSchema.safeParse(validRule)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.eventName).toBe('Sales Transaction')
        expect(result.data.amountFormula).toBe('amount * 1.13')
        expect(result.data.status).toBe('confirmed')
      }
    })

    it('should reject invalid journal rule data (negative case)', () => {
      const invalidRule = {
        eventName: '', // empty event name
        status: 'invalid_status', // invalid status
        amountFormula: 'a'.repeat(600), // exceeds max length
      }

      const result = JournalRuleSchema.safeParse(invalidRule)
      expect(result.success).toBe(false)
    })

    it('should validate minimal journal rule', () => {
      const minimalRule = {
        eventName: 'Simple Purchase',
      }

      const result = JournalRuleSchema.safeParse(minimalRule)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('proposal') // default value
      }
    })

    it('should validate amountFormula as string', () => {
      const ruleWithFormula = {
        eventName: 'Tax Calculation',
        amountFormula: '(baseAmount + serviceCharge) * 0.06',
      }

      const result = JournalRuleSchema.safeParse(ruleWithFormula)
      expect(result.success).toBe(true)
    })
  })

  describe('RuleProposalSchema', () => {
    it('should validate a complete rule proposal (positive case)', () => {
      const validProposal = {
        eventName: 'Inventory Purchase',
        eventDescription: 'Purchase raw materials for production',
        reasoning: 'Based on historical patterns, this transaction requires...',
        confidence: 0.85,
        debitSide: {
          accountCode: '1401',
          accountName: 'Raw Materials',
          amountFormula: 'amount',
        },
        creditSide: {
          accountCode: '1001',
          accountName: 'Cash',
          amountFormula: 'amount',
        },
        conditions: { vendor: 'supplier_a' },
        amountFormula: 'amount',
        triggerType: 'purchase_order',
        alternativeRules: [
          {
            eventName: 'Credit Purchase',
            reasoning: 'If payment terms are involved',
            debitSide: {
              accountCode: '1401',
              accountName: 'Raw Materials',
            },
            creditSide: {
              accountCode: '2001',
              accountName: 'Accounts Payable',
            },
          },
        ],
      }

      const result = RuleProposalSchema.safeParse(validProposal)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.confidence).toBe(0.85)
        expect(result.data.alternativeRules).toHaveLength(1)
      }
    })

    it('should reject invalid rule proposals (negative case)', () => {
      const invalidProposal = {
        eventName: '', // empty event name
        confidence: 1.5, // exceeds max
        debitSide: {
          accountCode: '', // empty code
          accountName: '', // empty name
        },
        creditSide: {
          accountCode: '2001',
          accountName: 'Accounts Payable',
        },
      }

      const result = RuleProposalSchema.safeParse(invalidProposal)
      expect(result.success).toBe(false)
    })

    it('should validate proposal without optional fields', () => {
      const minimalProposal = {
        eventName: 'Simple Event',
        debitSide: {
          accountCode: '1001',
          accountName: 'Cash',
        },
        creditSide: {
          accountCode: '4001',
          accountName: 'Revenue',
        },
      }

      const result = RuleProposalSchema.safeParse(minimalProposal)
      expect(result.success).toBe(true)
    })
  })

  describe('ScenarioContextSchema', () => {
    it('should validate a complete scenario context (positive case)', () => {
      const validContext = {
        scenarioId: 123,
        scenarioName: 'E-commerce Sales Flow',
        scenarioDescription: 'Complete sales and inventory management scenario',
        companyId: 456,
        industry: 'Retail',
        accountingStandard: 'GAAP',
        currency: 'USD',
        availableAccounts: [
          {
            code: '1001',
            name: 'Cash',
            type: 'asset',
            direction: 'debit',
          },
          {
            code: '4001',
            name: 'Sales Revenue',
            type: 'revenue',
            direction: 'credit',
          },
        ],
        existingRules: [
          {
            eventName: 'Daily Sales',
            status: 'confirmed',
          },
        ],
        fiscalPeriod: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
        contextVariables: {
          taxRate: 0.13,
          defaultPaymentTerms: 'net30',
        },
      }

      const result = ScenarioContextSchema.safeParse(validContext)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scenarioId).toBe(123)
        expect(result.data.currency).toBe('USD')
        expect(result.data.availableAccounts).toHaveLength(2)
        expect(result.data.existingRules).toHaveLength(1)
      }
    })

    it('should reject invalid scenario context (negative case)', () => {
      const invalidContext = {
        scenarioId: -1, // negative ID
        scenarioName: '', // empty name
        companyId: 0, // zero is not positive
        currency: 'INVALID_CURRENCY_CODE_TOO_LONG',
      }

      const result = ScenarioContextSchema.safeParse(invalidContext)
      expect(result.success).toBe(false)
    })

    it('should validate minimal scenario context', () => {
      const minimalContext = {
        scenarioId: 1,
        scenarioName: 'Basic Scenario',
        companyId: 1,
      }

      const result = ScenarioContextSchema.safeParse(minimalContext)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('CNY') // default value
      }
    })
  })

  describe('zodToJsonSchema', () => {
    it('should convert AccountSchema to JSON Schema', () => {
      const jsonSchema = zodToJsonSchema(AccountSchema)
      
      expect(jsonSchema).toBeDefined()
      expect(jsonSchema.type).toBe('object')
      expect(jsonSchema.properties).toBeDefined()
      expect(jsonSchema.properties.code).toBeDefined()
      expect(jsonSchema.properties.name).toBeDefined()
      expect(jsonSchema.properties.type).toBeDefined()
      expect(jsonSchema.properties.direction).toBeDefined()
    })

    it('should convert EntrySide to JSON Schema', () => {
      const jsonSchema = zodToJsonSchema(EntrySide)
      
      expect(jsonSchema).toBeDefined()
      expect(jsonSchema.enum).toEqual(['debit', 'credit'])
    })

    it('should convert JournalRuleSchema to JSON Schema', () => {
      const jsonSchema = zodToJsonSchema(JournalRuleSchema)
      
      expect(jsonSchema).toBeDefined()
      expect(jsonSchema.type).toBe('object')
      expect(jsonSchema.properties).toBeDefined()
      expect(jsonSchema.properties.eventName).toBeDefined()
      expect(jsonSchema.properties.amountFormula).toBeDefined()
      expect(jsonSchema.properties.status).toBeDefined()
    })

    it('should convert RuleProposalSchema to JSON Schema', () => {
      const jsonSchema = zodToJsonSchema(RuleProposalSchema)
      
      expect(jsonSchema).toBeDefined()
      expect(jsonSchema.type).toBe('object')
      expect(jsonSchema.properties.debitSide).toBeDefined()
      expect(jsonSchema.properties.creditSide).toBeDefined()
    })

    it('should convert ScenarioContextSchema to JSON Schema', () => {
      const jsonSchema = zodToJsonSchema(ScenarioContextSchema)
      
      expect(jsonSchema).toBeDefined()
      expect(jsonSchema.type).toBe('object')
      expect(jsonSchema.properties.scenarioId).toBeDefined()
      expect(jsonSchema.properties.availableAccounts).toBeDefined()
      expect(jsonSchema.properties.currency).toBeDefined()
    })

    it('should preserve schema descriptions in JSON Schema', () => {
      const jsonSchema = zodToJsonSchema(AccountSchema)
      
      // Check if descriptions are preserved
      expect(jsonSchema.properties.code.description).toContain('Account code')
      expect(jsonSchema.properties.name.description).toContain('Account name')
    })
  })

  describe('Integration Tests', () => {
    it('should validate a complete scenario with all schemas', () => {
      const account = AccountSchema.parse({
        code: '1001',
        name: 'Cash',
        type: 'asset',
        direction: 'debit',
      })

      const rule = JournalRuleSchema.parse({
        eventName: 'Test Transaction',
        debitAccountId: 1001,
        creditAccountId: 4001,
        amountFormula: 'amount',
      })

      const proposal = RuleProposalSchema.parse({
        eventName: 'AI Proposed Rule',
        debitSide: {
          accountCode: '1001',
          accountName: 'Cash',
        },
        creditSide: {
          accountCode: '4001',
          accountName: 'Revenue',
        },
      })

      const context = ScenarioContextSchema.parse({
        scenarioId: 1,
        scenarioName: 'Test Scenario',
        companyId: 1,
        availableAccounts: [account],
        existingRules: [rule],
      })

      expect(account).toBeDefined()
      expect(rule).toBeDefined()
      expect(proposal).toBeDefined()
      expect(context).toBeDefined()
      expect(context.availableAccounts).toHaveLength(1)
      expect(context.existingRules).toHaveLength(1)
    })
  })
})
