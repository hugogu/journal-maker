import { BaseAIAdapter, type AIModel, type ChatCompletionParams, type ChatCompletionResponse, type StreamingChatResponse } from './base'

interface OpenAIModel {
  id: string
  object: string
  created: number
  owned_by: string
}

interface OpenAICompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      content?: string
      role?: string
    }
    finish_reason: string | null
  }>
}

export class OpenAIAdapter extends BaseAIAdapter {
  constructor(providerId: string, providerName: string, apiEndpoint: string, apiKey: string) {
    super(providerId, providerName, 'openai', apiEndpoint, apiKey)
  }

  async fetchModels(): Promise<AIModel[]> {
    const response = await this.makeRequest<{ data: OpenAIModel[] }>('/models')
    
    return response.data
      .filter(model => model.id.includes('gpt'))
      .map(model => ({
        id: model.id,
        name: model.id,
        capabilities: {
          contextLength: model.id.includes('32k') ? 32768 : model.id.includes('16k') ? 16384 : 8192,
          supportsStreaming: true,
          supportsFunctions: model.id.includes('gpt-4'),
        },
      }))
  }

  async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> {
    const response = await this.makeRequest<{
      choices: Array<{ message: { content: string } }>
      model: string
      usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
    }>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens,
      }),
    })

    return {
      content: response.choices[0]?.message?.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
    }
  }

  async streamChatCompletion(
    params: ChatCompletionParams,
    onChunk: (chunk: StreamingChatResponse) => void
  ): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} ${error}`)
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
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onChunk({ content: '', done: true })
              return
            }

            try {
              const chunk: OpenAICompletionChunk = JSON.parse(data)
              const content = chunk.choices[0]?.delta?.content || ''
              const isDone = chunk.choices[0]?.finish_reason !== null

              onChunk({
                content,
                done: isDone,
                model: chunk.model,
              })
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
