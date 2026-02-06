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
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIAdapter extends BaseAIAdapter {
  constructor(providerId: string, providerName: string, apiEndpoint: string, apiKey: string) {
    super(providerId, providerName, 'openai', apiEndpoint, apiKey)
  }

  async fetchModels(): Promise<AIModel[]> {
    const response = await this.makeRequest<{ data?: OpenAIModel[] }>('/models')

    if (!response.data || !Array.isArray(response.data)) {
      return []
    }

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
    const requestBody: any = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
    }

    // Add tools/functions if provided
    if (params.tools && params.tools.length > 0) {
      requestBody.tools = params.tools
      if (params.tool_choice) {
        requestBody.tool_choice = params.tool_choice
      }
    }

    const response = await this.makeRequest<{
      choices: Array<{
        message: {
          content: string | null
          tool_calls?: Array<{
            id: string
            type: 'function'
            function: {
              name: string
              arguments: string
            }
          }>
          function_call?: {
            name: string
            arguments: string
          }
        }
      }>
      model: string
      usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
    }>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const message = response.choices[0]?.message
    return {
      content: message?.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      toolCalls: message?.tool_calls?.map(tc => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
      functionCall: message?.function_call ? {
        name: message.function_call.name,
        arguments: message.function_call.arguments,
      } : undefined,
    }
  }

  async streamChatCompletion(
    params: ChatCompletionParams,
    onChunk: (chunk: StreamingChatResponse) => void
  ): Promise<void> {
    const requestBody: any = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      stream: true,
      stream_options: { include_usage: true }, // Ensure usage is included in streaming
    }

    // Add tools/functions if provided
    if (params.tools && params.tools.length > 0) {
      requestBody.tools = params.tools
      if (params.tool_choice) {
        requestBody.tool_choice = params.tool_choice
      }
    }

    const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
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

              // Extract usage information if available
              let usage = undefined
              if (chunk.usage) {
                usage = {
                  promptTokens: chunk.usage.prompt_tokens,
                  completionTokens: chunk.usage.completion_tokens,
                  totalTokens: chunk.usage.total_tokens,
                }
              }

              onChunk({
                content,
                done: isDone,
                model: chunk.model,
                usage,
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
