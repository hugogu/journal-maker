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
 * @returns System prompt string with account information, limited to 1500 characters
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

  // Build the base prompt
  let prompt = `You are an accounting AI assistant. You have access to the following active accounts:\n\n${accountsList}`

  // Add scenario context if provided
  if (scenarioId) {
    prompt += `\n\nScenario ID: ${scenarioId}`
  }

  // Ensure the prompt doesn't exceed 1500 characters
  if (prompt.length > 1500) {
    // Truncate the accounts list to fit within the limit
    const maxAccountsLength = 1500 - (prompt.length - accountsList.length) - 20 // 20 chars buffer for "... (truncated)"

    if (maxAccountsLength > 0) {
      const truncatedAccountsList = accountsList.substring(0, maxAccountsLength)
      const lastCommaIndex = truncatedAccountsList.lastIndexOf(',')

      const finalAccountsList =
        lastCommaIndex > 0
          ? truncatedAccountsList.substring(0, lastCommaIndex) + ' ... (truncated)'
          : truncatedAccountsList + ' ... (truncated)'

      prompt = `You are an accounting AI assistant. You have access to the following active accounts:\n\n${finalAccountsList}`

      if (scenarioId) {
        prompt += `\n\nScenario ID: ${scenarioId}`
      }
    } else {
      // If we can't fit any accounts, just provide a minimal prompt
      prompt = `You are an accounting AI assistant with access to company accounts.`
      if (scenarioId) {
        prompt += ` Scenario ID: ${scenarioId}`
      }
    }
  }

  return prompt
}
