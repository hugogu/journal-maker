/**
 * Function calling utilities for AI integration
 * Converts Zod schemas to OpenAI-compatible function/tool definitions
 */

import { z } from 'zod'
import {
  AccountSchema,
  EntrySide,
  JournalRuleSchema,
  RuleProposalSchema,
  ScenarioContextSchema,
  zodToJsonSchema,
} from './schemas'

/**
 * OpenAI function definition structure
 */
export interface FunctionDefinition {
  name: string
  description: string
  parameters: any // JSON Schema
}

/**
 * OpenAI tool definition structure (newer API)
 */
export interface ToolDefinition {
  type: 'function'
  function: FunctionDefinition
}

/**
 * Create a function definition from a Zod schema
 */
export function createFunctionDefinition(
  name: string,
  description: string,
  schema: z.ZodType<any>
): FunctionDefinition {
  const jsonSchema = zodToJsonSchema(schema)

  // Remove $schema field as OpenAI doesn't need it
  if (jsonSchema.$schema) {
    delete jsonSchema.$schema
  }

  return {
    name,
    description,
    parameters: jsonSchema,
  }
}

/**
 * Create a tool definition (newer OpenAI API format)
 */
export function createToolDefinition(
  name: string,
  description: string,
  schema: z.ZodType<any>
): ToolDefinition {
  return {
    type: 'function',
    function: createFunctionDefinition(name, description, schema),
  }
}

/**
 * Pre-defined function definitions for common accounting operations
 */
export const accountingFunctions = {
  /**
   * Function for AI to propose new accounting accounts
   */
  proposeAccount: createFunctionDefinition(
    'propose_account',
    'Propose a new accounting account with code, name, type, and direction. Use this when analyzing business scenarios that require new accounts.',
    AccountSchema.omit({ id: true, isActive: true })
  ),

  /**
   * Function for AI to propose journal entry rules
   */
  proposeJournalRule: createFunctionDefinition(
    'propose_journal_rule',
    'Propose a journal entry rule for a business event. Includes debit/credit accounts, conditions, and amount formula.',
    RuleProposalSchema
  ),

  /**
   * Function for AI to create structured journal rules
   */
  createJournalRule: createFunctionDefinition(
    'create_journal_rule',
    'Create a complete journal entry rule with all details including event name, accounts, formulas, and conditions.',
    JournalRuleSchema.omit({ id: true })
  ),

  /**
   * Function for AI to analyze scenario context
   */
  analyzeScenario: createFunctionDefinition(
    'analyze_scenario',
    'Analyze a business scenario context including available accounts, existing rules, and fiscal information.',
    ScenarioContextSchema
  ),
}

/**
 * Pre-defined tool definitions (newer API format)
 */
export const accountingTools: ToolDefinition[] = [
  createToolDefinition(
    'propose_account',
    'Propose a new accounting account with code, name, type, and direction. Use this when analyzing business scenarios that require new accounts.',
    AccountSchema.omit({ id: true, isActive: true })
  ),
  createToolDefinition(
    'propose_journal_rule',
    'Propose a journal entry rule for a business event. Includes debit/credit accounts, conditions, and amount formula.',
    RuleProposalSchema
  ),
  createToolDefinition(
    'create_journal_rule',
    'Create a complete journal entry rule with all details including event name, accounts, formulas, and conditions.',
    JournalRuleSchema.omit({ id: true })
  ),
]

/**
 * Validate function call arguments against schema
 */
export function validateFunctionCall(
  functionName: string,
  args: any
): { success: boolean; data?: any; error?: string } {
  try {
    let schema: z.ZodType<any> | undefined

    switch (functionName) {
      case 'propose_account':
        schema = AccountSchema.omit({ id: true, isActive: true })
        break
      case 'propose_journal_rule':
        schema = RuleProposalSchema
        break
      case 'create_journal_rule':
        schema = JournalRuleSchema.omit({ id: true })
        break
      case 'analyze_scenario':
        schema = ScenarioContextSchema
        break
      default:
        return { success: false, error: `Unknown function: ${functionName}` }
    }

    const result = schema.safeParse(args)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        error: `Validation failed: ${JSON.stringify(result.error.errors)}`,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Helper to get all available function definitions
 */
export function getAvailableFunctions(): FunctionDefinition[] {
  return Object.values(accountingFunctions)
}

/**
 * Helper to get all available tool definitions
 */
export function getAvailableTools(): ToolDefinition[] {
  return accountingTools
}
