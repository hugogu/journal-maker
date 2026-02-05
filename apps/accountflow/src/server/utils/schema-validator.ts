import { z } from 'zod'
import { 
  AccountSchema, 
  JournalRuleSchema, 
  ScenarioContextSchema,
  RuleProposalSchema,
  AccountSchemaType,
  JournalRuleSchemaType,
  ScenarioContextSchemaType,
  RuleProposalSchemaType
} from './schemas'

/**
 * SchemaValidator - Utility class for validating data against Zod schemas
 * 
 * This class provides methods to validate various data structures used in the application,
 * ensuring data integrity and consistency throughout the system.
 */
export class SchemaValidator {
  
  /**
   * Validate account data
   * @param data - Raw account data to validate
   * @returns Validated account data or throws error
   */
  static validateAccount(data: unknown): AccountSchemaType {
    const result = AccountSchema.safeParse(data)
    
    if (!result.success) {
      const errorDetails = result.error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Account validation failed: ${errorDetails}`)
    }
    
    return result.data
  }
  
  /**
   * Validate journal rule data
   * @param data - Raw journal rule data to validate
   * @returns Validated journal rule data or throws error
   */
  static validateJournalRule(data: unknown): JournalRuleSchemaType {
    const result = JournalRuleSchema.safeParse(data)
    
    if (!result.success) {
      const errorDetails = result.error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Journal rule validation failed: ${errorDetails}`)
    }
    
    return result.data
  }
  
  /**
   * Validate scenario context data
   * @param data - Raw scenario context data to validate
   * @returns Validated scenario context data or throws error
   */
  static validateScenarioContext(data: unknown): ScenarioContextSchemaType {
    const result = ScenarioContextSchema.safeParse(data)
    
    if (!result.success) {
      const errorDetails = result.error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Scenario context validation failed: ${errorDetails}`)
    }
    
    return result.data
  }
  
  /**
   * Validate rule proposal data (from AI)
   * @param data - Raw rule proposal data to validate
   * @returns Validated rule proposal data or throws error
   */
  static validateRuleProposal(data: unknown): RuleProposalSchemaType {
    const result = RuleProposalSchema.safeParse(data)
    
    if (!result.success) {
      const errorDetails = result.error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ')
      throw new Error(`Rule proposal validation failed: ${errorDetails}`)
    }
    
    return result.data
  }
  
  /**
   * Validate array of accounts
   * @param data - Raw array of account data to validate
   * @returns Array of validated account data
   */
  static validateAccounts(data: unknown[]): AccountSchemaType[] {
    if (!Array.isArray(data)) {
      throw new Error('Accounts data must be an array')
    }
    
    return data.map((account, index) => {
      try {
        return this.validateAccount(account)
      } catch (error: any) {
        throw new Error(`Account at index ${index}: ${error.message}`)
      }
    })
  }
  
  /**
   * Validate array of journal rules
   * @param data - Raw array of journal rule data to validate
   * @returns Array of validated journal rule data
   */
  static validateJournalRules(data: unknown[]): JournalRuleSchemaType[] {
    if (!Array.isArray(data)) {
      throw new Error('Journal rules data must be an array')
    }
    
    return data.map((rule, index) => {
      try {
        return this.validateJournalRule(rule)
      } catch (error: any) {
        throw new Error(`Journal rule at index ${index}: ${error.message}`)
      }
    })
  }
  
  /**
   * Safe validation with result object
   * @param validator - Validation function to use
   * @param data - Data to validate
   * @returns Object with success status and either data or error
   */
  static safeValidate<T>(
    validator: (data: unknown) => T,
    data: unknown
  ): { success: true; data: T } | { success: false; error: string } {
    try {
      const validatedData = validator(data)
      return { success: true, data: validatedData }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      }
    }
  }
}

/**
 * AIResponseValidator - Specialized validator for AI-generated responses
 * 
 * This class provides methods to validate and sanitize AI-generated data before
 * storing it in the database or using it in business logic.
 */
export class AIResponseValidator {
  
  /**
   * Validate and extract structured data from AI response
   * @param aiResponse - Raw AI response string
   * @returns Parsed and validated structured data
   */
  static validateStructuredResponse(aiResponse: string): {
    accounts?: AccountSchemaType[]
    rules?: JournalRuleSchemaType[]
    context?: ScenarioContextSchemaType
  } {
    try {
      // Try to parse JSON from AI response
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/)
      if (!jsonMatch) {
        throw new Error('No JSON block found in AI response')
      }
      
      const parsedData = JSON.parse(jsonMatch[1])
      const result: any = {}
      
      // Validate accounts if present
      if (parsedData.accounts) {
        result.accounts = SchemaValidator.validateAccounts(parsedData.accounts)
      }
      
      // Validate rules if present
      if (parsedData.rules) {
        result.rules = SchemaValidator.validateJournalRules(parsedData.rules)
      }
      
      // Validate context if present
      if (parsedData.context) {
        result.context = SchemaValidator.validateScenarioContext(parsedData.context)
      }
      
      return result
    } catch (error: any) {
      throw new Error(`Failed to validate AI response: ${error.message}`)
    }
  }
  
  /**
   * Validate AI-generated rule proposal
   * @param proposal - Raw proposal data from AI
   * @returns Validated rule proposal
   */
  static validateRuleProposal(proposal: unknown): RuleProposalSchemaType {
    return SchemaValidator.validateRuleProposal(proposal)
  }
  
  /**
   * Sanitize and validate amount formula
   * @param formula - Raw formula string
   * @returns Sanitized formula or throws error
   */
  static validateAmountFormula(formula: string): string {
    if (!formula || formula.trim() === '') {
      throw new Error('Amount formula cannot be empty')
    }
    
    // Basic validation for formula syntax
    const sanitized = formula.trim()
    
    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /eval\s*\(/,
      /function\s*\(/,
      /=>\s*{/,
      /import\s+/,
      /require\s*\(/,
      /process\./,
      /global\./,
      /window\./,
      /document\./
    ]
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        throw new Error('Formula contains potentially dangerous operations')
      }
    }
    
    // Check for balanced parentheses
    let parenCount = 0
    for (const char of sanitized) {
      if (char === '(') parenCount++
      if (char === ')') parenCount--
      if (parenCount < 0) {
        throw new Error('Unbalanced parentheses in formula')
      }
    }
    
    if (parenCount !== 0) {
      throw new Error('Unbalanced parentheses in formula')
    }
    
    return sanitized
  }
}

/**
 * DatabaseValidator - Validator for database operations
 * 
 * This class provides methods to validate data before database operations.
 */
export class DatabaseValidator {
  
  /**
   * Validate account before database insertion
   * @param accountData - Account data to validate
   * @param existingAccounts - Existing accounts to check for duplicates
   * @returns Validated account data
   */
  static validateAccountForInsert(
    accountData: unknown,
    existingAccounts: AccountSchemaType[] = []
  ): AccountSchemaType {
    const validated = SchemaValidator.validateAccount(accountData)
    
    // Check for duplicate code
    const duplicate = existingAccounts.find(acc => acc.code === validated.code)
    if (duplicate) {
      throw new Error(`Account with code '${validated.code}' already exists`)
    }
    
    return validated
  }
  
  /**
   * Validate journal rule before database insertion
   * @param ruleData - Journal rule data to validate
   * @param availableAccounts - Available accounts for validation
   * @returns Validated journal rule data
   */
  static validateJournalRuleForInsert(
    ruleData: unknown,
    availableAccounts: AccountSchemaType[] = []
  ): JournalRuleSchemaType {
    const validated = SchemaValidator.validateJournalRule(ruleData)
    
    // Validate that referenced accounts exist
    if (validated.debitAccountId) {
      const debitAccount = availableAccounts.find(acc => acc.id === validated.debitAccountId)
      if (!debitAccount) {
        throw new Error(`Debit account with ID ${validated.debitAccountId} not found`)
      }
    }
    
    if (validated.creditAccountId) {
      const creditAccount = availableAccounts.find(acc => acc.id === validated.creditAccountId)
      if (!creditAccount) {
        throw new Error(`Credit account with ID ${validated.creditAccountId} not found`)
      }
    }
    
    // Validate amount formula if present
    if (validated.amountFormula) {
      AIResponseValidator.validateAmountFormula(validated.amountFormula)
    }
    
    return validated
  }
}
