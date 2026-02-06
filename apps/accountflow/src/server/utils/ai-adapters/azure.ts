import { OpenAIAdapter } from './openai'

/**
 * Azure OpenAI Adapter
 * Extends OpenAI adapter with Azure-specific endpoint structure
 */
export class AzureOpenAIAdapter extends OpenAIAdapter {
  constructor(
    providerId: string,
    providerName: string,
    apiEndpoint: string,
    apiKey: string,
    private deploymentId?: string
  ) {
    super(providerId, providerName, apiEndpoint, apiKey)
  }

  async fetchModels(): Promise<
    {
      id: string
      name: string
      capabilities: {
        contextLength?: number
        supportsStreaming?: boolean
        supportsFunctions?: boolean
      }
    }[]
  > {
    // Azure doesn't have a simple models endpoint like OpenAI
    // Return common Azure OpenAI models
    return [
      {
        id: this.deploymentId || 'gpt-4',
        name: this.deploymentId || 'GPT-4',
        capabilities: {
          contextLength: 8192,
          supportsStreaming: true,
          supportsFunctions: true,
        },
      },
      {
        id: 'gpt-4-32k',
        name: 'GPT-4 32K',
        capabilities: {
          contextLength: 32768,
          supportsStreaming: true,
          supportsFunctions: true,
        },
      },
      {
        id: 'gpt-35-turbo',
        name: 'GPT-3.5 Turbo',
        capabilities: {
          contextLength: 4096,
          supportsStreaming: true,
          supportsFunctions: false,
        },
      },
      {
        id: 'gpt-35-turbo-16k',
        name: 'GPT-3.5 Turbo 16K',
        capabilities: {
          contextLength: 16384,
          supportsStreaming: true,
          supportsFunctions: false,
        },
      },
    ]
  }

  protected async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiEndpoint}/openai/deployments/${this.deploymentId}${endpoint}?api-version=2024-02-01`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'api-key': this.apiKey,
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
