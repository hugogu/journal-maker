import { describe, it, expect } from 'vitest'
import {
  createFunctionDefinition,
  createToolDefinition,
  validateFunctionCall,
  accountingFunctions,
  accountingTools,
  getAvailableFunctions,
  getAvailableTools,
} from '../apps/accountflow/src/server/utils/function-calling'
import { AccountSchema, RuleProposalSchema } from '../apps/accountflow/src/server/utils/schemas'

describe('Function Calling Utilities', () => {
  describe('createFunctionDefinition', () => {
    it('should create a function definition from a schema', () => {
      const definition = createFunctionDefinition(
        'test_function',
        'A test function',
        AccountSchema.omit({ id: true, isActive: true })
      )

      expect(definition.name).toBe('test_function')
      expect(definition.description).toBe('A test function')
      expect(definition.parameters).toBeDefined()
      expect(definition.parameters.type).toBe('object')
      expect(definition.parameters.properties).toBeDefined()
      expect(definition.parameters.properties.code).toBeDefined()
      expect(definition.parameters.properties.name).toBeDefined()
    })

    it('should not include $schema in parameters', () => {
      const definition = createFunctionDefinition(
        'test_function',
        'A test function',
        AccountSchema
      )

      expect(definition.parameters.$schema).toBeUndefined()
    })
  })

  describe('createToolDefinition', () => {
    it('should create a tool definition from a schema', () => {
      const tool = createToolDefinition(
        'test_tool',
        'A test tool',
        AccountSchema
      )

      expect(tool.type).toBe('function')
      expect(tool.function).toBeDefined()
      expect(tool.function.name).toBe('test_tool')
      expect(tool.function.description).toBe('A test tool')
      expect(tool.function.parameters).toBeDefined()
    })
  })

  describe('accountingFunctions', () => {
    it('should have proposeAccount function', () => {
      expect(accountingFunctions.proposeAccount).toBeDefined()
      expect(accountingFunctions.proposeAccount.name).toBe('propose_account')
      expect(accountingFunctions.proposeAccount.parameters).toBeDefined()
    })

    it('should have proposeJournalRule function', () => {
      expect(accountingFunctions.proposeJournalRule).toBeDefined()
      expect(accountingFunctions.proposeJournalRule.name).toBe('propose_journal_rule')
      expect(accountingFunctions.proposeJournalRule.parameters).toBeDefined()
    })

    it('should have createJournalRule function', () => {
      expect(accountingFunctions.createJournalRule).toBeDefined()
      expect(accountingFunctions.createJournalRule.name).toBe('create_journal_rule')
      expect(accountingFunctions.createJournalRule.parameters).toBeDefined()
    })

    it('should have analyzeScenario function', () => {
      expect(accountingFunctions.analyzeScenario).toBeDefined()
      expect(accountingFunctions.analyzeScenario.name).toBe('analyze_scenario')
      expect(accountingFunctions.analyzeScenario.parameters).toBeDefined()
    })
  })

  describe('accountingTools', () => {
    it('should have correct number of tools', () => {
      expect(accountingTools).toHaveLength(3)
    })

    it('should have tools with correct structure', () => {
      accountingTools.forEach(tool => {
        expect(tool.type).toBe('function')
        expect(tool.function).toBeDefined()
        expect(tool.function.name).toBeDefined()
        expect(tool.function.description).toBeDefined()
        expect(tool.function.parameters).toBeDefined()
      })
    })
  })

  describe('validateFunctionCall', () => {
    it('should validate propose_account with valid data', () => {
      const validAccount = {
        code: '1001',
        name: 'Cash',
        type: 'asset',
        direction: 'debit',
      }

      const result = validateFunctionCall('propose_account', validAccount)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.code).toBe('1001')
    })

    it('should reject propose_account with invalid data', () => {
      const invalidAccount = {
        code: '', // empty code
        name: 'Cash',
        type: 'invalid_type',
        direction: 'debit',
      }

      const result = validateFunctionCall('propose_account', invalidAccount)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate propose_journal_rule with valid data', () => {
      const validRule = {
        eventName: 'Sale Transaction',
        debitSide: {
          accountCode: '1001',
          accountName: 'Cash',
        },
        creditSide: {
          accountCode: '4001',
          accountName: 'Revenue',
        },
      }

      const result = validateFunctionCall('propose_journal_rule', validRule)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.eventName).toBe('Sale Transaction')
    })

    it('should reject propose_journal_rule with invalid data', () => {
      const invalidRule = {
        eventName: '', // empty event name
        debitSide: {
          accountCode: '1001',
          accountName: 'Cash',
        },
        creditSide: {
          accountCode: '4001',
          accountName: 'Revenue',
        },
      }

      const result = validateFunctionCall('propose_journal_rule', invalidRule)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject unknown function names', () => {
      const result = validateFunctionCall('unknown_function', {})
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown function')
    })
  })

  describe('getAvailableFunctions', () => {
    it('should return all function definitions', () => {
      const functions = getAvailableFunctions()
      expect(functions).toBeInstanceOf(Array)
      expect(functions.length).toBeGreaterThan(0)
      functions.forEach(func => {
        expect(func.name).toBeDefined()
        expect(func.description).toBeDefined()
        expect(func.parameters).toBeDefined()
      })
    })
  })

  describe('getAvailableTools', () => {
    it('should return all tool definitions', () => {
      const tools = getAvailableTools()
      expect(tools).toBeInstanceOf(Array)
      expect(tools.length).toBeGreaterThan(0)
      tools.forEach(tool => {
        expect(tool.type).toBe('function')
        expect(tool.function).toBeDefined()
      })
    })
  })

  describe('Integration: Full workflow', () => {
    it('should create tool, validate call, and process result', () => {
      // 1. Get tools for AI
      const tools = getAvailableTools()
      expect(tools.length).toBeGreaterThan(0)

      // 2. Simulate AI response with function call
      const functionCallArgs = {
        eventName: 'Purchase Transaction',
        eventDescription: 'Recording inventory purchase',
        reasoning: 'This is a standard purchase transaction',
        confidence: 0.9,
        debitSide: {
          accountCode: '1400',
          accountName: 'Inventory',
        },
        creditSide: {
          accountCode: '1001',
          accountName: 'Cash',
        },
        amountFormula: 'amount',
      }

      // 3. Validate the function call
      const validation = validateFunctionCall('propose_journal_rule', functionCallArgs)
      expect(validation.success).toBe(true)

      // 4. Use validated data
      if (validation.success) {
        expect(validation.data.eventName).toBe('Purchase Transaction')
        expect(validation.data.confidence).toBe(0.9)
        expect(validation.data.debitSide.accountCode).toBe('1400')
      }
    })
  })
})
