/**
 * Prompt Assembler
 * Utilities for assembling system prompts with context from database
 */

import { db } from '../db'
import { accounts } from '../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Assembles a system prompt for AI with active accounts from the database
 * @param companyId - The company ID to fetch accounts for
 * @param scenarioId - Optional scenario ID for additional context
 * @returns System prompt string with account information
 */
export async function assembleSystemPrompt(
  companyId: number,
  scenarioId?: number
): Promise<string> {
  // Fetch active accounts for the company
  const activeAccounts = await db.query.accounts.findMany({
    where: and(eq(accounts.companyId, companyId), eq(accounts.isActive, true)),
    orderBy: accounts.code,
  })

  // Format accounts as "code:name" pairs
  const accountsList = activeAccounts.map((account) => `${account.code}:${account.name}`).join(', ')

  // Build the prompt
  let prompt = `You are an accounting AI assistant. You have access to the following active accounts:\n\n${accountsList}`

  // Add scenario context if provided
  if (scenarioId) {
    prompt += `\n\nScenario ID: ${scenarioId}`
  }

  return prompt
}
