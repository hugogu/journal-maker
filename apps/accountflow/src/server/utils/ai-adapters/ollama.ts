import { BaseAIAdapter, type AIModel, type ChatCompletionParams, type ChatCompletionResponse, type StreamingChatResponse } from './base'

interface OllamaModel {
  name: string
  size: number
  digest: string
  details?: {
    format?: string
    family?: string
    families?: string[]
    parameter_size?: string
    quantization_level?: string
  }
}

interface OllamaCompletionChunk {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  prompt_eval_count?: number
  eval_count?: number
}

export class OllamaAdapter extends BaseAIAdapter {
  constructor(providerId: string, providerName: string, apiEndpoint: string) {
    // Ollama typically doesn't require API key for local instances
    super(providerId, providerName, 'ollama', apiEndpoint, '')
  }

  async fetchModels(): Promise<AIModel[]> {
    const response = await fetch(`${this.apiEndpoint}/api/tags`)

    if (!response.ok) {
      throw new Error(`Failed to fetch Ollama models: ${response.status}`)
    }

    const data = await response.json() as { models?: OllamaModel[] }

    if (!data.models || !Array.isArray(data.models)) {
      return []
    }

    return data.models.map(model => ({
      id: model.name,
      name: model.name,
      capabilities: {
        contextLength: this.estimateContextLength(model.details?.parameter_size),
        supportsStreaming: true,
        supportsFunctions: false, // Ollama models typically don't support functions
      },
    }))
  }

  async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.apiEndpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: false,
        options: {
          temperature: params.temperature ?? 0.7,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama request failed: ${response.status} ${error}`)
    }

    const data = await response.json()

    return {
      content: data.message?.content || '',
      model: params.model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    }
  }

  async streamChatCompletion(
    params: ChatCompletionParams,
    onChunk: (chunk: StreamingChatResponse) => void
  ): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: true,
        options: {
          temperature: params.temperature ?? 0.7,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama request failed: ${response.status} ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const chunk: OllamaCompletionChunk = JSON.parse(line)
            
            onChunk({
              content: chunk.message?.content || '',
              done: chunk.done,
              model: chunk.model,
              usage: chunk.done ? {
                promptTokens: chunk.prompt_eval_count || 0,
                completionTokens: chunk.eval_count || 0,
                totalTokens: (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
              } : undefined,
            })
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private estimateContextLength(parameterSize?: string): number {
    // Rough estimates based on model size
    if (!parameterSize) return 4096
    if (parameterSize.includes('70')) return 32768
    if (parameterSize.includes('13')) return 16384
    if (parameterSize.includes('7')) return 8192
    return 4096
  }
}
