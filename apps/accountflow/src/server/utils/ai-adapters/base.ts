// Base AI Provider Adapter Interface
// All AI provider adapters must implement this interface

export interface AIModel {
  id: string
  name: string
  capabilities: {
    contextLength?: number
    supportsStreaming?: boolean
    supportsFunctions?: boolean
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionParams {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface StreamingChatResponse {
  content: string
  done: boolean
  model?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProviderAdapter {
  readonly providerId: string
  readonly providerName: string
  readonly providerType: string
  
  /**
   * Fetch available models from the provider
   */
  fetchModels(): Promise<AIModel[]>
  
  /**
   * Create a chat completion (non-streaming)
   */
  chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>
  
  /**
   * Create a streaming chat completion
   */
  streamChatCompletion(
    params: ChatCompletionParams,
    onChunk: (chunk: StreamingChatResponse) => void
  ): Promise<void>
}

export abstract class BaseAIAdapter implements AIProviderAdapter {
  constructor(
    public readonly providerId: string,
    public readonly providerName: string,
    public readonly providerType: string,
    protected apiEndpoint: string,
    protected apiKey: string
  ) {}

  abstract fetchModels(): Promise<AIModel[]>
  abstract chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>
  abstract streamChatCompletion(
    params: ChatCompletionParams,
    onChunk: (chunk: StreamingChatResponse) => void
  ): Promise<void>

  /**
   * Make authenticated request to provider API
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiEndpoint}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...((options.headers as Record<string, string>) || {}),
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} ${error}`)
    }

    return response.json() as Promise<T>
  }
}
