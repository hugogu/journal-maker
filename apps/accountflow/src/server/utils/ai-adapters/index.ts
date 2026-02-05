import { OpenAIAdapter } from './openai'
import { AzureOpenAIAdapter } from './azure'
import { OllamaAdapter } from './ollama'
import type { AIProviderAdapter } from './base'

export type {
  AIProviderAdapter,
  AIModel,
  ChatMessage,
  ChatCompletionParams,
  ChatCompletionResponse,
  StreamingChatResponse,
} from './base'

export type ProviderType = 'openai' | 'azure' | 'ollama' | 'custom'

interface CreateAdapterParams {
  providerId: string
  providerName: string
  providerType: ProviderType
  apiEndpoint: string
  apiKey: string
  deploymentId?: string // For Azure
}

/**
 * Factory function to create appropriate AI provider adapter
 */
export function createAIAdapter(params: CreateAdapterParams): AIProviderAdapter {
  switch (params.providerType) {
    case 'openai':
      return new OpenAIAdapter(
        params.providerId,
        params.providerName,
        params.apiEndpoint,
        params.apiKey
      )

    case 'azure':
      return new AzureOpenAIAdapter(
        params.providerId,
        params.providerName,
        params.apiEndpoint,
        params.apiKey,
        params.deploymentId
      )

    case 'ollama':
      return new OllamaAdapter(params.providerId, params.providerName, params.apiEndpoint)

    case 'custom':
      // Custom providers use OpenAI-compatible API format
      return new OpenAIAdapter(
        params.providerId,
        params.providerName,
        params.apiEndpoint,
        params.apiKey
      )

    default:
      throw new Error(`Unknown provider type: ${params.providerType}`)
  }
}
