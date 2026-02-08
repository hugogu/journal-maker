/**
 * AI Provider adapters for accounting analysis
 * Connects to various AI services (OpenAI, Ollama, etc.)
 */

import type { AIProvider, AIAnalysisResponse } from '../core/analyzer'
import type { AnalysisInput } from '../core/types'
import { buildSystemPrompt, buildAnalysisPrompt } from '../core/analyzer'

/**
 * Configuration for AI provider
 */
export interface AIProviderConfig {
  apiEndpoint: string
  apiKey?: string
  model: string
  temperature?: number
  maxTokens?: number
}

/**
 * OpenAI-compatible AI provider
 * Works with OpenAI, Azure OpenAI, and compatible APIs
 */
export class OpenAIProvider implements AIProvider {
  constructor(private config: AIProviderConfig) {}

  async analyzeScenario(input: AnalysisInput): Promise<AIAnalysisResponse> {
    const systemPrompt = buildSystemPrompt(input.accountingStandard)
    const userPrompt = buildAnalysisPrompt(input)

    const requestBody = {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 4000,
      response_format: { type: 'json_object' },
    }

    const response = await fetch(`${this.config.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI provider error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from AI provider')
    }

    // Parse the JSON response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to parse AI response as JSON: ${error}`)
    }

    return {
      subjects: parsedResponse.subjects || [],
      journalRules: parsedResponse.journalRules || parsedResponse.rules || [],
      flowDiagram: parsedResponse.flowDiagram || parsedResponse.diagram,
      reasoning: parsedResponse.reasoning || parsedResponse.explanation,
      confidence: parsedResponse.confidence,
    }
  }
}

/**
 * Ollama AI provider for local models
 */
export class OllamaProvider implements AIProvider {
  constructor(private config: AIProviderConfig) {}

  async analyzeScenario(input: AnalysisInput): Promise<AIAnalysisResponse> {
    const systemPrompt = buildSystemPrompt(input.accountingStandard)
    const userPrompt = buildAnalysisPrompt(input)

    const requestBody = {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      format: 'json',
      options: {
        temperature: this.config.temperature ?? 0.7,
        num_predict: this.config.maxTokens ?? 4000,
      },
    }

    const response = await fetch(`${this.config.apiEndpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const content = data.message?.content

    if (!content) {
      throw new Error('No response from Ollama')
    }

    // Parse the JSON response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to parse Ollama response as JSON: ${error}`)
    }

    return {
      subjects: parsedResponse.subjects || [],
      journalRules: parsedResponse.journalRules || parsedResponse.rules || [],
      flowDiagram: parsedResponse.flowDiagram || parsedResponse.diagram,
      reasoning: parsedResponse.reasoning || parsedResponse.explanation,
      confidence: parsedResponse.confidence,
    }
  }
}

/**
 * Mock AI provider for testing
 * Returns predefined responses without calling an actual AI service
 */
export class MockAIProvider implements AIProvider {
  private mockResponse?: AIAnalysisResponse

  constructor(mockResponse?: AIAnalysisResponse) {
    this.mockResponse = mockResponse
  }

  async analyzeScenario(input: AnalysisInput): Promise<AIAnalysisResponse> {
    if (this.mockResponse) {
      return this.mockResponse
    }

    // Generate a simple mock response based on the input
    return {
      subjects: [
        {
          code: '1001',
          name: '库存现金',
          direction: 'debit' as const,
          type: 'asset' as const,
          description: 'Mock accounting subject',
        },
      ],
      journalRules: [
        {
          eventName: '示例业务',
          eventDescription: input.businessScenario,
          debitSide: {
            entries: [
              {
                accountCode: '1001',
                accountName: '库存现金',
                amountFormula: '{{amount}}',
                description: 'Mock debit entry',
              },
            ],
          },
          creditSide: {
            entries: [
              {
                accountCode: '6001',
                accountName: '主营业务收入',
                amountFormula: '{{amount}}',
                description: 'Mock credit entry',
              },
            ],
          },
          variables: ['amount'],
        },
      ],
      reasoning: 'This is a mock response for testing purposes',
      confidence: 0.5,
    }
  }

  setMockResponse(response: AIAnalysisResponse): void {
    this.mockResponse = response
  }
}

/**
 * Create an AI provider based on configuration
 */
export function createAIProvider(config: AIProviderConfig, providerType: 'openai' | 'ollama' | 'mock' = 'openai'): AIProvider {
  switch (providerType) {
    case 'openai':
      return new OpenAIProvider(config)
    case 'ollama':
      return new OllamaProvider(config)
    case 'mock':
      return new MockAIProvider()
    default:
      throw new Error(`Unknown provider type: ${providerType}`)
  }
}
