# AI Service Enhancements

This document describes the new AI service enhancements added to support reusable function calling and prompt assembly.

## Overview

AI programming agents can now:
1. Call a unified `callChat` method instead of duplicating API call logic
2. Build system prompts with company-specific account context using `assembleSystemPrompt`

## New Features

### 1. `aiService.callChat(messages, opts)`

A generic chat completion method for direct AI model calls with function calling support.

#### Usage

```typescript
import { aiService } from './server/utils/ai-service'
import type { ChatMessage } from './server/utils/ai-adapters/base'

// Basic chat
const messages: ChatMessage[] = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' }
]

const response = await aiService.callChat(messages)
console.log(response.content)
console.log(response.usage)

// With function calling (legacy API)
const functions = [
  {
    name: 'create_account',
    description: 'Create a new accounting account',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['code', 'name']
    }
  }
]

const response = await aiService.callChat(messages, { 
  functions,
  function_call: 'auto' // or { name: 'create_account' }
})

// Check for function calls
if (response.toolCalls && response.toolCalls.length > 0) {
  const call = response.toolCalls[0]
  console.log('Function:', call.function.name)
  console.log('Arguments:', JSON.parse(call.function.arguments))
}

// With tools API (newer format)
const tools = [
  {
    type: 'function',
    function: {
      name: 'create_account',
      description: 'Create a new accounting account',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' }
        },
        required: ['code', 'name']
      }
    }
  }
]

const response = await aiService.callChat(messages, {
  tools,
  tool_choice: 'auto' // or { type: 'function', function: { name: 'create_account' } }
})
```

#### Parameters

- `messages` (required): Array of chat messages with `role` and `content`
- `opts` (optional): Options object with:
  - `userId?: number` - User ID for AI provider preferences
  - `providerId?: number` - Specific AI provider to use
  - `model?: string` - Model to use (e.g., 'gpt-4')
  - `temperature?: number` - Temperature for response generation (default: 0.7)
  - `maxTokens?: number` - Maximum tokens in response
  - `functions?: any[]` - Function definitions (legacy format)
  - `function_call?: 'auto' | 'none' | { name: string }` - Function call control (legacy)
  - `tools?: any[]` - Tool definitions (new format)
  - `tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }` - Tool choice control

#### Returns

Promise resolving to:
```typescript
{
  content: string        // Response text
  model: string         // Model used
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  toolCalls?: ToolCall[]      // Function/tool calls made by AI
  functionCall?: FunctionCall // Legacy function call format
}
```

### 2. `assembleSystemPrompt(companyId, scenarioId?)`

Assembles a system prompt with active accounts from the database.

#### Usage

```typescript
import { assembleSystemPrompt } from './server/utils/prompt-assembler'

// Basic usage
const prompt = await assembleSystemPrompt(1)
console.log(prompt)
// Output:
// "You are an accounting AI assistant. You have access to the following active accounts:
//
// 1001:Cash, 1002:Accounts Receivable, 2001:Accounts Payable, ..."

// With scenario context
const prompt = await assembleSystemPrompt(1, 42)
console.log(prompt)
// Output includes: "Scenario ID: 42"
```

#### Parameters

- `companyId` (required): Company ID to fetch accounts for
- `scenarioId` (optional): Scenario ID for additional context

#### Returns

Promise resolving to a string containing:
- System role description
- Active accounts formatted as "code:name" pairs
- Optional scenario ID reference

#### Features

- Fetches only active accounts (`isActive = true`)
- Orders accounts by code
- No artificial character limits - includes all active accounts
- Maintains consistency with database-stored prompts

## Demo and Examples

Demo code and example implementations have been moved to the `/examples` directory:

- `/examples/demos/` - Standalone demonstration scripts
- `/examples/api-endpoints/` - Reference API endpoint implementations

See `/examples/README.md` for more information.

## Integration Examples

### Example 1: Using callChat with existing function definitions

```typescript
import { aiService } from './server/utils/ai-service'
import { getAvailableTools } from './server/utils/function-calling'

const messages = [
  { role: 'system', content: 'You are an accounting assistant.' },
  { role: 'user', content: 'Create a journal entry for a sale' }
]

const tools = getAvailableTools() // Get pre-defined accounting tools

const response = await aiService.callChat(messages, { tools })

// Process tool calls
if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    console.log('AI wants to call:', toolCall.function.name)
    const args = JSON.parse(toolCall.function.arguments)
    // Execute the function...
  }
}
```

### Example 2: Using assembleSystemPrompt in chat

```typescript
import { aiService } from './server/utils/ai-service'
import { assembleSystemPrompt } from './server/utils/prompt-assembler'

const companyId = 1
const scenarioId = 42

// Build system prompt with account context
const systemPrompt = await assembleSystemPrompt(companyId, scenarioId)

const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: 'Which account should I use for cash sales?' }
]

const response = await aiService.callChat(messages)
console.log(response.content)
// AI will respond with knowledge of available accounts
```

### Example 3: Combining both features

```typescript
import { aiService } from './server/utils/ai-service'
import { assembleSystemPrompt } from './server/utils/prompt-assembler'
import { getAvailableTools } from './server/utils/function-calling'

const companyId = 1
const scenarioId = 42

// 1. Assemble prompt with accounts
const systemPrompt = await assembleSystemPrompt(companyId, scenarioId)

// 2. Get available tools
const tools = getAvailableTools()

// 3. Make the call
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: 'Create a journal rule for recording sales' }
]

const response = await aiService.callChat(messages, { tools })

// 4. Process results
if (response.toolCalls) {
  // AI suggested using a function
  console.log('AI used tools:', response.toolCalls)
} else {
  // AI provided text response
  console.log('AI response:', response.content)
}
```

## Testing

### Run tests

```bash
npm run test
```

All tests are in `/tests`:
- `ai-service-callchat.test.ts` - Tests for callChat method
- `prompt-assembler.test.ts` - Tests for assembleSystemPrompt

### Demo script

Run the demo to see the API structure:

```bash
npx tsx scripts/demo-ai-enhancements.ts
```

## API Compatibility

### Legacy Functions API → Tools API Conversion

The `callChat` method automatically converts legacy function definitions to the new tools format:

```typescript
// Legacy format (still supported)
const response = await aiService.callChat(messages, {
  functions: [{ name: 'test', description: 'Test', parameters: {...} }],
  function_call: 'auto'
})

// Automatically converted to tools format internally
// {
//   tools: [{ type: 'function', function: { name: 'test', ... } }],
//   tool_choice: 'auto'
// }
```

## Migration Guide

### Before

```typescript
// Multiple files with duplicated AI call logic
const adapter = createAIAdapter(...)
const response = await adapter.chatCompletion({
  model: 'gpt-4',
  messages: [...],
  tools: [...],
  temperature: 0.7
})
```

### After

```typescript
// Single unified call
import { aiService } from './server/utils/ai-service'

const response = await aiService.callChat(messages, {
  tools: [...],
  temperature: 0.7
})
```

## Best Practices

1. **Reuse callChat**: Instead of calling adapters directly, use `aiService.callChat` for consistency
2. **Use assembleSystemPrompt**: Always include account context when relevant for better AI responses
3. **Validate function calls**: Always validate AI-generated function call arguments before executing
4. **Handle both formats**: Check for both `toolCalls` and `functionCall` in responses for compatibility
5. **Monitor token usage**: Use the `usage` field to track costs

## Architecture Notes

- `callChat` uses the existing adapter infrastructure (no breaking changes)
- `assembleSystemPrompt` queries the database using existing Drizzle ORM setup
- Both functions are fully tested with mocked dependencies
- Compatible with all AI provider types (OpenAI, Azure, Ollama, Custom)

## Future Enhancements

Possible improvements:
- Cache assembled prompts for repeated calls
- Support custom prompt templates
- Add streaming support to callChat
- Include more context in prompts (rules, transactions, etc.)
