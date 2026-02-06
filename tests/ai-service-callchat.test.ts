import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIService } from '../apps/accountflow/src/server/utils/ai-service'
import type { ChatMessage } from '../apps/accountflow/src/server/utils/ai-adapters/base'

// Mock the ai-adapters module
vi.mock('../apps/accountflow/src/server/utils/ai-adapters', () => ({
  createAIAdapter: vi.fn(() => ({
    chatCompletion: vi.fn(async (params: any) => ({
      content: 'Test response',
      model: 'gpt-4',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      toolCalls: params.tools ? [{
        id: 'call_123',
        type: 'function' as const,
        function: {
          name: 'test_function',
          arguments: JSON.stringify({ test: 'arg' }),
        },
      }] : undefined,
      functionCall: undefined,
    })),
  })),
}))

// Mock the database
vi.mock('../apps/accountflow/src/server/db', () => ({
  db: {
    query: {
      aiProviders: {
        findFirst: vi.fn(async () => ({
          id: 1,
          name: 'Test Provider',
          type: 'openai',
          apiEndpoint: 'https://api.openai.com/v1',
          apiKey: 'encrypted-key',
          defaultModel: 'gpt-4',
          isDefault: true,
          status: 'active',
        })),
      },
      userPreferences: {
        findFirst: vi.fn(async () => null),
      },
    },
  },
}))

// Mock the encryption module
vi.mock('../apps/accountflow/src/server/utils/encryption', () => ({
  decrypt: vi.fn((key: string) => 'decrypted-' + key),
}))

describe('AIService.callChat', () => {
  let aiService: AIService

  beforeEach(() => {
    aiService = new AIService()
    vi.clearAllMocks()
  })

  it('should make a basic chat completion call', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello' },
    ]

    const response = await aiService.callChat(messages)

    expect(response).toBeDefined()
    expect(response.content).toBe('Test response')
    expect(response.model).toBe('gpt-4')
    expect(response.usage).toBeDefined()
    expect(response.usage?.promptTokens).toBe(10)
    expect(response.usage?.completionTokens).toBe(20)
    expect(response.usage?.totalTokens).toBe(30)
  })

  it('should support functions parameter and parse function calls', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Create an account' },
    ]

    const functions = [
      {
        name: 'create_account',
        description: 'Create a new account',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['code', 'name'],
        },
      },
    ]

    const response = await aiService.callChat(messages, { functions })

    expect(response).toBeDefined()
    expect(response.content).toBe('Test response')
    expect(response.toolCalls).toBeDefined()
    expect(response.toolCalls?.length).toBeGreaterThan(0)
    expect(response.toolCalls?.[0].function.name).toBe('test_function')
  })

  it('should support tools parameter', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Create an account' },
    ]

    const tools = [
      {
        type: 'function',
        function: {
          name: 'create_account',
          description: 'Create a new account',
          parameters: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              name: { type: 'string' },
            },
            required: ['code', 'name'],
          },
        },
      },
    ]

    const response = await aiService.callChat(messages, { tools })

    expect(response).toBeDefined()
    expect(response.content).toBe('Test response')
    expect(response.toolCalls).toBeDefined()
    expect(response.toolCalls?.length).toBeGreaterThan(0)
  })

  it('should support function_call parameter', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Create an account' },
    ]

    const functions = [
      {
        name: 'create_account',
        description: 'Create a new account',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['code', 'name'],
        },
      },
    ]

    const response = await aiService.callChat(messages, {
      functions,
      function_call: { name: 'create_account' },
    })

    expect(response).toBeDefined()
    expect(response.toolCalls).toBeDefined()
  })

  it('should support temperature and maxTokens options', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello' },
    ]

    const response = await aiService.callChat(messages, {
      temperature: 0.5,
      maxTokens: 100,
    })

    expect(response).toBeDefined()
    expect(response.content).toBe('Test response')
  })

  it('should handle custom model and provider', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello' },
    ]

    const response = await aiService.callChat(messages, {
      providerId: 1,
      model: 'gpt-3.5-turbo',
    })

    expect(response).toBeDefined()
    expect(response.content).toBe('Test response')
    expect(response.model).toBe('gpt-4') // Model from adapter, not necessarily the requested one
  })

  it('should handle system messages', async () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' },
    ]

    const response = await aiService.callChat(messages)

    expect(response).toBeDefined()
    expect(response.content).toBe('Test response')
  })

  it('should convert legacy function_call format to tool_choice', async () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Test' },
    ]

    const functions = [
      {
        name: 'test_function',
        description: 'A test function',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    ]

    const response = await aiService.callChat(messages, {
      functions,
      function_call: 'auto',
    })

    expect(response).toBeDefined()
  })
})
