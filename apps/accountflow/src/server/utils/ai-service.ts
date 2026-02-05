import type { Account } from '../../types'
import { db } from '../db'
import { aiProviders, userPreferences, companyProfile } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import {
  createAIAdapter,
  type AIProviderAdapter,
  type ChatMessage,
  type ToolCall,
  type FunctionCall,
} from './ai-adapters'
import { decrypt } from './encryption'
import { getActivePromptContent } from '../db/queries/prompts'

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
   * If explicit providerId/model are provided, uses those; otherwise falls back to user preferences or default
   */
  private async getAdapter(
    userId?: number,
    explicitProviderId?: number,
    explicitModel?: string
  ): Promise<{
    adapter: AIProviderAdapter
    model: string
    providerId: string
    providerName: string
  }> {
    let providerId: number | undefined
    let model: string | undefined
    let providerName = 'Default'

    // Priority 1: Use explicit provider/model if provided
    if (explicitProviderId) {
      providerId = explicitProviderId
      model = explicitModel
    }
    // Priority 2: Check user preferences if userId provided
    else if (userId) {
      const prefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, userId),
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
        where: eq(aiProviders.id, providerId),
      })
    }

    // Fall back to default provider
    if (!provider) {
      provider = await db.query.aiProviders.findFirst({
        where: and(eq(aiProviders.isDefault, true), eq(aiProviders.status, 'active')),
      })
    }

    if (!provider) {
      throw new Error(
        'No active AI provider configured. Please configure AI settings in Admin > AI Config.'
      )
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

    // If no model specified, use provider's default model
    if (!model) {
      model = provider.defaultModel || undefined
    }

    // If still no model, try to fetch available models and use first one
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
      providerName: provider.name,
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
   * Build system prompt with all context - supports flexible variable substitution
   */
  private async buildSystemPrompt(context: AIContext): Promise<string> {
    return this.buildPromptWithContext(context, 'scenario_analysis')
  }

  /**
   * Build streaming system prompt - supports flexible variable substitution
   */
  private async buildStreamSystemPrompt(context: AIContext): Promise<string> {
    return this.buildPromptWithContext(context, 'scenario_analysis')
  }

  /**
   * Generic prompt builder with comprehensive variable substitution
   */
  private async buildPromptWithContext(context: AIContext, promptType: string): Promise<string> {
    const company = await this.getCompanyContext()

    // Try to get active prompt template from database
    // Cast to any to allow flexible prompt types
    const activePromptContent = await getActivePromptContent(promptType as any)

    if (!activePromptContent) {
      throw new Error(
        `No active prompt template found for ${promptType}. Please configure one in Admin > Prompts.`
      )
    }

    // Build accounts list in multiple formats for flexibility
    const accountsList = context.accounts.map((a) => `${a.code} ${a.name} (${a.type})`).join(', ')
    const accountsListMultiline = context.accounts
      .map((a) => `- ${a.code} ${a.name} (${a.type})`)
      .join('\n')
    const accountsJson = JSON.stringify(
      context.accounts.map((a) => ({
        code: a.code,
        name: a.name,
        type: a.type,
      }))
    )

    // Build company context summary
    const companyContextParts = [
      company.name,
      company.businessModel,
      company.industry,
      company.accountingPreference,
    ]
      .filter(Boolean)
      .join(' | ')

    // Replace all variables in the prompt template
    let prompt = activePromptContent
      // Accounts variables
      .replace(/\{\{accounts\}\}/g, accountsList)
      .replace(/\{\{accountsList\}\}/g, accountsListMultiline)
      .replace(/\{\{accountsJson\}\}/g, accountsJson)
      // Company variables
      .replace(/\{\{companyName\}\}/g, company.name)
      .replace(/\{\{businessModel\}\}/g, company.businessModel || '')
      .replace(/\{\{industry\}\}/g, company.industry || '')
      .replace(/\{\{accountingPreference\}\}/g, company.accountingPreference || '')
      .replace(/\{\{companyContext\}\}/g, companyContextParts)

    // Scenario variables (if available)
    if (context.currentScenario) {
      prompt = prompt
        .replace(/\{\{scenarioName\}\}/g, context.currentScenario.name)
        .replace(/\{\{scenarioDescription\}\}/g, context.currentScenario.description || '')
    } else {
      // Remove scenario-related sections if no scenario
      prompt = prompt
        .replace(/\{\{scenarioName\}\}/g, '')
        .replace(/\{\{scenarioDescription\}\}/g, '')
    }

    return prompt
  }

  /**
   * Analyze scenario (non-streaming)
   */
  async analyzeScenario(
    userInput: string,
    context: AIContext,
    userId?: number,
    explicitProviderId?: number,
    explicitModel?: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now()
    const { adapter, model, providerId, providerName } = await this.getAdapter(
      userId,
      explicitProviderId,
      explicitModel
    )

    const systemPrompt = await this.buildSystemPrompt(context)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ]

    const response = await adapter.chatCompletion({
      model,
      messages,
      temperature: 0.7,
    })

    const durationMs = Date.now() - startTime

    let structured: AIResponse['structured'] | undefined
    try {
      // Try to extract JSON from markdown code block first
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response.content
      const parsed = JSON.parse(jsonContent)
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
    userId?: number,
    explicitProviderId?: number,
    explicitModel?: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now()
    const { adapter, model, providerId, providerName } = await this.getAdapter(
      userId,
      explicitProviderId,
      explicitModel
    )

    const systemPrompt = await this.buildStreamSystemPrompt(context)
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
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

    // Extract structured data from markdown JSON block
    let structured: AIResponse['structured'] | undefined
    try {
      const jsonMatch = fullContent.match(/```json\n([\s\S]*?)\n```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : fullContent
      const parsed = JSON.parse(jsonContent)
      structured = parsed.structured
    } catch (e) {
      // Not JSON format, that's ok
    }

    return {
      message: fullContent,
      structured,
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
   * Generic analyze method with tool/function calling support
   * This is a flexible method that allows custom messages and tools
   */
  async analyze(options: {
    scenarioId: number
    companyId: number
    userId?: number
    messages: ChatMessage[]
    tools?: any[]
    tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
    explicitProviderId?: number
    explicitModel?: string
  }): Promise<AnalysisResult & { toolCalls?: any[] }> {
    const startTime = Date.now()
    const { adapter, model, providerId, providerName } = await this.getAdapter(
      options.userId,
      options.explicitProviderId,
      options.explicitModel
    )

    const response = await adapter.chatCompletion({
      model,
      messages: options.messages,
      temperature: 0.7,
      tools: options.tools,
      tool_choice: options.tool_choice,
    })

    const durationMs = Date.now() - startTime

    let structured: AIResponse['structured'] | undefined
    try {
      // Try to extract JSON from markdown code block first
      const jsonMatch = response.content?.match(/```json\n([\s\S]*?)\n```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response.content
      const parsed = JSON.parse(jsonContent)
      structured = parsed.structured
    } catch (e) {
      // Not JSON format, that's ok
    }

    // Extract system prompt from messages
    const systemPrompt = options.messages.find((m) => m.role === 'system')?.content || ''

    return {
      message: response.content,
      structured,
      requestLog: {
        systemPrompt,
        contextMessages: options.messages,
        fullPrompt: options.messages.map((m) => `${m.role}: ${m.content}`).join('\n\n'),
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
      toolCalls: response.toolCalls,
    }
  }

  /**
   * Generic chat completion method for direct AI model calls
   * Supports function calling via the functions parameter
   */
  async callChat(
    messages: ChatMessage[],
    opts?: {
      userId?: number
      providerId?: number
      model?: string
      temperature?: number
      maxTokens?: number
      functions?: any[]
      function_call?: 'auto' | 'none' | { name: string }
      tools?: any[]
      tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
    }
  ): Promise<{
    content: string
    model: string
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    toolCalls?: ToolCall[]
    functionCall?: FunctionCall
  }> {
    const { adapter, model, providerId, providerName } = await this.getAdapter(
      opts?.userId,
      opts?.providerId,
      opts?.model
    )

    // Support both new tools API and legacy functions API
    const requestParams: any = {
      model,
      messages,
      temperature: opts?.temperature ?? 0.7,
      maxTokens: opts?.maxTokens,
    }

    // Prefer tools API if provided
    if (opts?.tools && opts.tools.length > 0) {
      requestParams.tools = opts.tools
      if (opts.tool_choice) {
        requestParams.tool_choice = opts.tool_choice
      }
    }
    // Fall back to legacy functions API
    else if (opts?.functions && opts.functions.length > 0) {
      // Convert functions to tools format
      requestParams.tools = opts.functions.map((func: any) => ({
        type: 'function',
        function: func,
      }))
      if (opts.function_call) {
        if (opts.function_call === 'auto' || opts.function_call === 'none') {
          requestParams.tool_choice = opts.function_call
        } else if (typeof opts.function_call === 'object' && opts.function_call.name) {
          requestParams.tool_choice = {
            type: 'function',
            function: { name: opts.function_call.name },
          }
        }
      }
    }

    const response = await adapter.chatCompletion(requestParams)

    return {
      content: response.content,
      model: response.model,
      usage: response.usage,
      toolCalls: response.toolCalls,
      functionCall: response.functionCall,
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
