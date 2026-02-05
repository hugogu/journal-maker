import { SchemaValidator, AIResponseValidator } from './schema-validator'
import { AccountSchema, JournalRuleSchema, ScenarioContextSchema } from './schemas'

/**
 * Enhanced AI Service with Schema Validation
 * 
 * This example shows how to integrate schema validation into the AI service
 * to ensure all AI-generated data is properly validated before use.
 */

export class EnhancedAIService {
  
  /**
   * Example: Validate and process AI-generated journal rules
   */
  async processAIRules(aiResponse: string, availableAccounts: any[]) {
    try {
      // Step 1: Extract and validate structured data from AI response
      const validatedData = AIResponseValidator.validateStructuredResponse(aiResponse)
      
      // Step 2: Process validated rules
      if (validatedData.rules) {
        for (const rule of validatedData.rules) {
          // Additional business logic validation
          await this.validateRuleBusinessLogic(rule, availableAccounts)
          
          // Save to database or further processing
          console.log('Validated rule:', rule)
        }
      }
      
      return validatedData
    } catch (error) {
      console.error('Failed to process AI rules:', error)
      throw error
    }
  }
  
  /**
   * Example: Validate rule business logic
   */
  private async validateRuleBusinessLogic(rule: any, availableAccounts: any[]) {
    // Check if debit and credit accounts exist
    if (rule.debitAccountId) {
      const debitAccount = availableAccounts.find(acc => acc.id === rule.debitAccountId)
      if (!debitAccount) {
        throw new Error(`Debit account ${rule.debitAccountId} not found`)
      }
    }
    
    if (rule.creditAccountId) {
      const creditAccount = availableAccounts.find(acc => acc.id === rule.creditAccountId)
      if (!creditAccount) {
        throw new Error(`Credit account ${rule.creditAccountId} not found`)
      }
    }
    
    // Validate amount formula
    if (rule.amountFormula) {
      AIResponseValidator.validateAmountFormula(rule.amountFormula)
    }
  }
  
  /**
   * Example: Create scenario context with validation
   */
  createScenarioContext(scenarioData: any, accounts: any[], rules: any[]) {
    // Validate accounts
    const validatedAccounts = SchemaValidator.validateAccounts(accounts)
    
    // Validate rules
    const validatedRules = SchemaValidator.validateJournalRules(rules)
    
    // Create and validate scenario context
    const contextData = {
      scenarioId: scenarioData.id,
      scenarioName: scenarioData.name,
      scenarioDescription: scenarioData.description,
      companyId: scenarioData.companyId,
      availableAccounts: validatedAccounts,
      existingRules: validatedRules,
      currency: 'CNY',
      accountingStandard: 'Chinese GAAP'
    }
    
    return SchemaValidator.validateScenarioContext(contextData)
  }
}

/**
 * Example API endpoint with enhanced validation
 */
export async function createJournalRuleEndpoint(event: any) {
  try {
    const body = await readBody(event)
    
    // Use safe validation for better error handling
    const validation = SchemaValidator.safeValidate(
      SchemaValidator.validateJournalRule,
      body
    )
    
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        message: `Validation failed: ${validation.error}`
      })
    }
    
    const validatedRule = validation.data
    
    // Additional business logic
    await validateRuleBusinessLogic(validatedRule)
    
    // Save to database
    const savedRule = await saveJournalRule(validatedRule)
    
    return { data: savedRule }
  } catch (error) {
    console.error('Error creating journal rule:', error)
    throw error
  }
}

/**
 * Example: Function calling integration
 * 
 * This shows how to use the schemas for OpenAI function calling
 */
export function getFunctionCallingSchemas() {
  return {
    createAccount: {
      name: "createAccount",
      description: "Create a new accounting account",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Account code" },
          name: { type: "string", description: "Account name" },
          type: { 
            type: "string", 
            enum: ["asset", "liability", "equity", "revenue", "expense"],
            description: "Account type"
          },
          direction: { 
            type: "string", 
            enum: ["debit", "credit", "both"],
            description: "Normal balance direction"
          },
          description: { type: "string", description: "Account description" }
        },
        required: ["code", "name", "type", "direction"]
      }
    },
    
    createJournalRule: {
      name: "createJournalRule",
      description: "Create a new journal entry rule",
      parameters: {
        type: "object",
        properties: {
          eventName: { type: "string", description: "Business event name" },
          eventDescription: { type: "string", description: "Event description" },
          debitSide: {
            type: "object",
            properties: {
              accountCode: { type: "string" },
              accountName: { type: "string" },
              amountFormula: { type: "string" }
            },
            required: ["accountCode", "accountName"]
          },
          creditSide: {
            type: "object",
            properties: {
              accountCode: { type: "string" },
              accountName: { type: "string" },
              amountFormula: { type: "string" }
            },
            required: ["accountCode", "accountName"]
          },
          amountFormula: { type: "string", description: "Amount calculation formula" },
          triggerType: { type: "string", description: "Event trigger type" }
        },
        required: ["eventName", "debitSide", "creditSide"]
      }
    }
  }
}

/**
 * Example: Middleware for automatic validation
 */
export function createValidationMiddleware(schema: any) {
  return async (event: any) => {
    const body = await readBody(event)
    
    const validation = SchemaValidator.safeValidate(
      (data: unknown) => schema.parse(data),
      body
    )
    
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        message: `Validation failed: ${validation.error}`
      })
    }
    
    // Attach validated data to event context
    event.context.validatedData = validation.data
    
    return event
  }
}

// Example usage in API routes:
/*
export default defineEventHandler(async (event) => {
  // Apply validation middleware
  await createValidationMiddleware(JournalRuleSchema)(event)
  
  // Access validated data
  const validatedRule = event.context.validatedData
  
  // Process with validated data
  return await processJournalRule(validatedRule)
})
*/
