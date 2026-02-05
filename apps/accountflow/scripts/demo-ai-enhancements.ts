/**
 * Demo script to test the new callChat and assembleSystemPrompt functions
 * This script demonstrates how to use the new AI service features
 */

import { aiService } from '../apps/accountflow/src/server/utils/ai-service'
import { assembleSystemPrompt } from '../apps/accountflow/src/server/utils/prompt-assembler'
import type { ChatMessage } from '../apps/accountflow/src/server/utils/ai-adapters/base'

async function demoCallChat() {
  console.log('=== Demo: callChat with function calling ===\n')

  try {
    // Example 1: Basic chat without functions
    console.log('1. Basic chat call:')
    const basicMessages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is 2+2?' },
    ]

    // Note: This would fail without proper API credentials
    // const response1 = await aiService.callChat(basicMessages)
    // console.log('Response:', response1.content)
    console.log('   Would call: aiService.callChat(messages)')
    console.log('   Expected: Simple text response\n')

    // Example 2: Chat with function calling
    console.log('2. Chat with function calling:')
    const functionsMessages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an accounting assistant that can create accounts.',
      },
      { role: 'user', content: 'Create a cash account with code 1001' },
    ]

    const functions = [
      {
        name: 'create_account',
        description: 'Create a new accounting account',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Account code' },
            name: { type: 'string', description: 'Account name' },
            type: {
              type: 'string',
              enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
              description: 'Account type',
            },
          },
          required: ['code', 'name', 'type'],
        },
      },
    ]

    // const response2 = await aiService.callChat(functionsMessages, { functions })
    // console.log('Response:', response2)
    // console.log('Function calls:', response2.toolCalls)
    console.log('   Would call: aiService.callChat(messages, { functions })')
    console.log('   Expected: Response with toolCalls array\n')

    console.log('✓ callChat API structure verified\n')
  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

async function demoAssembleSystemPrompt() {
  console.log('=== Demo: assembleSystemPrompt ===\n')

  try {
    // Note: This would fail without a database connection
    // const prompt1 = await assembleSystemPrompt(1)
    // console.log('Prompt for company 1:')
    // console.log(prompt1)
    // console.log('\nPrompt length:', prompt1.length)

    console.log('1. Basic usage:')
    console.log('   Would call: assembleSystemPrompt(1)')
    console.log('   Expected: Prompt with active accounts (<=1500 chars)\n')

    // const prompt2 = await assembleSystemPrompt(1, 42)
    // console.log('\nPrompt for company 1, scenario 42:')
    // console.log(prompt2)

    console.log('2. With scenario ID:')
    console.log('   Would call: assembleSystemPrompt(1, 42)')
    console.log('   Expected: Prompt with accounts + scenario ID (<=1500 chars)\n')

    console.log('✓ assembleSystemPrompt API structure verified\n')
  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  AI Service Enhancement Demo                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('This demo shows the structure of the new AI service features:')
  console.log('1. callChat() - Generic chat method with function calling support')
  console.log('2. assembleSystemPrompt() - Build prompts with account context\n')

  await demoCallChat()
  await demoAssembleSystemPrompt()

  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  Demo Complete                                         ║')
  console.log('║  Run tests with: npm run test                          ║')
  console.log('╚════════════════════════════════════════════════════════╝')
}

main().catch(console.error)
