import type { Account } from '../../types'
import { db } from '../db'
import { aiProviders, userPreferences, companyProfile } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { createAIAdapter, type AIProviderAdapter, type ChatMessage } from './ai-adapters'
import { decrypt } from './encryption'

interface AIContext {
  company: {
    name: string
    description?: string
    industry?: string
    businessModel?: string
    accountingPreference?: string
  }
  accounts: Account[]
  templateScenario?: {
    name: string
    description?: string
    rules: Array<{
      eventName: string
      debitAccount?: string
      creditAccount?: string
    }>
  }
  currentScenario?: {
    name: string
    description?: string
  }
}

interface AIResponse {
  message: string
  structured?: {
    flowchart?: {
      nodes: Array<{
        id: string
        type: string
        label: string
      }>
      edges: Array<{
        from: string
        to: string
        label?: string
      }>
    }
    accounts?: Array<{
      code: string
      name: string
      type: string
      reason: string
    }>
    rules?: Array<{
      event: string
      debit: string
      credit: string
      description: string
    }>
  }
}

interface RequestLog {
  systemPrompt: string
  contextMessages: ChatMessage[]
  fullPrompt: string
  variables: Record<string, string>
}

interface ResponseStats {
  model: string
  providerId: string
  providerName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  durationMs: number
}

export interface AnalysisResult {
  message: string
  structured?: AIResponse['structured']
  requestLog: RequestLog
  responseStats: ResponseStats
}

export class AIService {
  /**
   * Get AI provider adapter for a user
   * If userId is provided, uses user's preferences; otherwise uses default provider
   */
  private async getAdapter(userId?: number): Promise<{
    adapter: AIProviderAdapter
    model: string
    providerId: string
    providerName: string
  }> {
    let providerId: number | undefined
    let model: string | undefined
    let providerName = 'Default'

    // Check user preferences if userId provided
    if (userId) {
      const prefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, userId)
      })
      if (prefs?.preferredProviderId) {
        providerId = prefs.preferredProviderId
        model = prefs.preferredModel || undefined
      }
    }

    // Get provider details
    let provider
    if (providerId) {
      provider = await db.query.aiProviders.findFirst({
        where: eq(aiProviders.id, providerId)
      })
    }

    // Fall back to default provider
    if (!provider) {
      provider = await db.query.aiProviders.findFirst({
        where: and(
          eq(aiProviders.isDefault, true),
          eq(aiProviders.status, 'active')
        )
      })
    }

    if (!provider) {
      throw new Error('No active AI provider configured. Please configure AI settings in Admin > AI Config.')
    }

    // Decrypt API key
    const apiKey = decrypt(provider.apiKey)

    // Create adapter
    const adapter = createAIAdapter({
      providerId: String(provider.id),
      providerName: provider.name,
      providerType: provider.type as 'openai' | 'azure' | 'ollama' | 'custom',
      apiEndpoint: provider.apiEndpoint,
      apiKey,
    })

    // If no model specified, fetch available models and use first one
    if (!model) {
      try {
        const models = await adapter.fetchModels()
        model = models[0]?.id
      } catch (e) {
        // If can't fetch models, use a default
        model = 'gpt-4'
      }
    }

    return {
      adapter,
      model: model || 'gpt-4',
      providerId: String(provider.id),
      providerName: provider.name
    }
  }

  /**
   * Get company profile for prompt context
   */
  private async getCompanyContext(): Promise<AIContext['company']> {
    const profile = await db.query.companyProfile.findFirst()
    
    if (!profile) {
      return { name: 'Default Company' }
    }

    return {
      name: profile.name,
      businessModel: profile.businessModel || undefined,
      industry: profile.industry || undefined,
      accountingPreference: profile.accountingPreference || undefined,
    }
  }

  /**
   * Build system prompt with all context
   */
  private async buildSystemPrompt(context: AIContext): Promise<string> {
    const company = await this.getCompanyContext()
    const accountsList = context.accounts.map(a => `${a.code} ${a.name} (${a.type})`).join(', ')
    
    let prompt = `You are an accounting expert helping analyze business scenarios. 
Analyze the user's business scenario and provide:
1. A helpful response explaining the accounting treatment
2. A flowchart representation of the business process
3. Suggested accounting accounts to use
4. Accounting rules/journal entries for the scenario

Available accounts: ${accountsList}
Company: ${company.name}`

    if (company.businessModel) {
      prompt += `\nBusiness Model: ${company.businessModel}`
    }
    if (company.industry) {
      prompt += `\nIndustry: ${company.industry}`
    }
    if (company.accountingPreference) {
      prompt += `\nAccounting Preference: ${company.accountingPreference}`
    }

    if (context.currentScenario) {
      prompt += `\nCurrent Scenario: ${context.currentScenario.name} - ${context.currentScenario.description || 'No description'}`
    }

    return prompt
  }

  /**
   * Build streaming system prompt
   */
  private async buildStreamSystemPrompt(context: AIContext): Promise<string> {
    const company = await this.getCompanyContext()
    const accountsList = context.accounts.map(a => `${a.code} ${a.name} (${a.type})`).join(', ')
    
    let prompt = `You are an accounting expert helping analyze business scenarios. 
Analyze the user's business scenario and provide:
1. A helpful response explaining the accounting treatment
2. A flowchart representation of the business process using mermaid syntax
3. Suggested accounting accounts to use
4. Accounting rules/journal entries for the scenario

Please provide your analysis in markdown format. Include mermaid flowcharts using proper syntax with triple backticks:
\`\`\`mermaid
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

IMPORTANT: When creating mermaid flowchart nodes, avoid using square brackets [], parentheses (), or other special characters in node labels. Use simple descriptive text instead.

Available accounts: ${accountsList}
Company: ${company.name}`

    if (company.businessModel) {
      prompt += `\nBusiness Model: ${company.businessModel}`
    }
    if (company.industry) {
      prompt += `\nIndustry: ${company.industry}`
    }
    if (company.accountingPreference) {
      prompt += `\nAccounting Preference: ${company.accountingPreference}`
    }

    if (context.currentScenario) {
      prompt += `\nCurrent Scenario: ${context.currentScenario.name} - ${context.currentScenario.description || 'No description'}`
    }

    return prompt
  }

  /**
   * Analyze scenario (non-streaming)
   */
  async analyzeScenario(
    userInput: string,
    context: AIContext,
    userId?: number
  ): Promise<AnalysisResult> {
    const startTime = Date.now()
    const { adapter, model, providerId, providerName } = await this.getAdapter(userId)
    
    const systemPrompt = await this.buildSystemPrompt(context)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ]

    const response = await adapter.chatCompletion({
      model,
      messages,
      temperature: 0.7,
    })

    const durationMs = Date.now() - startTime

    let structured: AIResponse['structured'] | undefined
    try {
      const parsed = JSON.parse(response.content)
      structured = parsed.structured
    } catch (e) {
      // Not JSON format, that's ok
    }

    return {
      message: response.content,
      structured,
      requestLog: {
        systemPrompt,
        contextMessages: messages,
        fullPrompt: `${systemPrompt}\n\nUser: ${userInput}`,
        variables: {},
      },
      responseStats: {
        model: response.model,
        providerId,
        providerName,
        inputTokens: response.usage?.promptTokens || 0,
        outputTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
        durationMs,
      },
    }
  }

  /**
   * Analyze scenario with streaming
   */
  async analyzeScenarioStream(
    userInput: string,
    context: AIContext,
    onChunk: (chunk: string) => void,
    userId?: number
  ): Promise<AnalysisResult> {
    const startTime = Date.now()
    const { adapter, model, providerId, providerName } = await this.getAdapter(userId)
    
    const systemPrompt = await this.buildStreamSystemPrompt(context)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ]

    let fullContent = ''
    let finalModel = model
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

    await adapter.streamChatCompletion(
      {
        model,
        messages,
        temperature: 0.7,
      },
      (chunk) => {
        fullContent += chunk.content
        if (chunk.model) finalModel = chunk.model
        if (chunk.usage) usage = chunk.usage
        onChunk(chunk.content)
      }
    )

    const durationMs = Date.now() - startTime

    return {
      message: fullContent,
      requestLog: {
        systemPrompt,
        contextMessages: messages,
        fullPrompt: `${systemPrompt}\n\nUser: ${userInput}`,
        variables: {},
      },
      responseStats: {
        model: finalModel,
        providerId,
        providerName,
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        durationMs,
      },
    }
  }

  /**
   * Test connection to a provider
   */
  async testConnection(
    providerType: string,
    apiEndpoint: string,
    apiKey: string,
    model: string
  ): Promise<boolean> {
    try {
      const adapter = createAIAdapter({
        providerId: 'test',
        providerName: 'Test',
        providerType: providerType as 'openai' | 'azure' | 'ollama' | 'custom',
        apiEndpoint,
        apiKey,
      })

      await adapter.chatCompletion({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 5,
      })

      return true
    } catch (error) {
      return false
    }
  }
}

export const aiService = new AIService()
