import OpenAI from 'openai'
import type { Account } from '../../types'
import { db } from '../db'
import { aiConfigs } from '../db/schema'
import { eq } from 'drizzle-orm'

interface AIContext {
  company: {
    name: string
    description?: string
    industry?: string
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

export class AIService {
  private async getClient() {
    const config = await db.query.aiConfigs.findFirst({
      where: eq(aiConfigs.isActive, true)
    })
    
    if (!config) {
      throw new Error('AI configuration not found. Please configure AI settings in Admin > AI Config.')
    }
    
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API Key is empty. Please configure a valid API key in Admin > AI Config.')
    }
    
    return new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiEndpoint,
    })
  }

  private async getModel() {
    const config = await db.query.aiConfigs.findFirst({
      where: eq(aiConfigs.isActive, true)
    })
    return config?.model || 'gpt-4'
  }

  async analyzeScenario(
    userInput: string,
    context: AIContext
  ): Promise<AIResponse> {
    const client = await this.getClient()
    const model = await this.getModel()
    
    const systemPrompt = `You are an accounting expert helping analyze business scenarios. 
Analyze the user's business scenario and provide:
1. A helpful response explaining the accounting treatment
2. A flowchart representation of the business process
3. Suggested accounting accounts to use
4. Accounting rules/journal entries for the scenario

Respond in JSON format with the following structure:
{
  "message": "string - your analysis response",
  "structured": {
    "flowchart": {
      "nodes": [{"id": "string", "type": "start|process|decision|end", "label": "string"}],
      "edges": [{"from": "string", "to": "string", "label": "string"}]
    },
    "accounts": [{"code": "string", "name": "string", "type": "asset|liability|equity|revenue|expense", "reason": "string"}],
    "rules": [{"event": "string", "debit": "string", "credit": "string", "description": "string"}]
  }
}

Available accounts: ${context.accounts.map(a => `${a.code} ${a.name} (${a.type})`).join(', ')}
Company: ${context.company.name}`

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    return JSON.parse(content)
  }

  async analyzeScenarioStream(
    userInput: string,
    context: AIContext,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const client = await this.getClient()
    const model = await this.getModel()
    
    const systemPrompt = `You are an accounting expert helping analyze business scenarios. 
Analyze the user's business scenario and provide:
1. A helpful response explaining the accounting treatment
2. A flowchart representation of the business process
3. Suggested accounting accounts to use
4. Accounting rules/journal entries for the scenario

IMPORTANT: You must provide your analysis first, then end with a valid JSON response exactly in this format:

{
  "message": "string - your complete analysis response",
  "structured": {
    "flowchart": {
      "nodes": [{"id": "string", "type": "start|process|decision|end", "label": "string"}],
      "edges": [{"from": "string", "to": "string", "label": "string"}]
    },
    "accounts": [{"code": "string", "name": "string", "type": "asset|liability|equity|revenue|expense", "reason": "string"}],
    "rules": [{"event": "string", "debit": "string", "credit": "string", "description": "string"}]
  }
}

Make sure the JSON is properly formatted and complete. The JSON should be the very last thing in your response.

Available accounts: ${context.accounts.map(a => `${a.code} ${a.name} (${a.type})`).join(', ')}
Company: ${context.company.name}`

    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      stream: true,
    })

    let fullContent = ''
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullContent += content
        onChunk(content)
      }
    }

    // Extract JSON from the end of the response
    let jsonMatch = fullContent.match(/\{[\s\S]*\}$/)
    
    if (!jsonMatch) {
      const jsonPatterns = [
        /\{[\s\S]*?\}/,  // Any JSON object (non-greedy)
        /\{[\s\S]*?"message"[\s\S]*?\}/,  // JSON with message field
        /\{[\s\S]*?"structured"[\s\S]*?\}/,  // JSON with structured field
        /\{[\s\S]*?"flowchart"[\s\S]*?\}/,  // JSON with flowchart field
      ]
      
      for (const pattern of jsonPatterns) {
        const matches = fullContent.match(pattern)
        if (matches && matches.length > 0) {
          // Find the last, most complete match
          jsonMatch = matches[matches.length - 1]
          break
        }
      }
    }
    
    if (!jsonMatch) {
      console.error('No JSON found in response, full content:', fullContent)
      return {
        message: fullContent,
        structured: {
          flowchart: {
            nodes: [
              { id: "start", type: "start", label: "开始" },
              { id: "process", type: "process", label: "业务处理" },
              { id: "end", type: "end", label: "结束" }
            ],
            edges: [
              { from: "start", to: "process", label: "" },
              { from: "process", to: "end", label: "" }
            ]
          },
          accounts: [],
          rules: []
        }
      }
    }

    try {
      const jsonString = jsonMatch[0]
      const parsed = JSON.parse(jsonString)
      
      const result = {
        message: parsed.message || fullContent,
        structured: parsed.structured || {
          flowchart: {
            nodes: [
              { id: "start", type: "start", label: "开始" },
              { id: "process", type: "process", label: "业务处理" },
              { id: "end", type: "end", label: "结束" }
            ],
            edges: [
              { from: "start", to: "process", label: "" },
              { from: "process", to: "end", label: "" }
            ]
          },
          accounts: parsed.structured?.accounts || [],
          rules: parsed.structured?.rules || []
        }
      }
      
      console.log('Parsed AI response:', result)
      
      return result
    } catch (error) {
      console.error('Failed to parse AI response:', jsonMatch)
      console.error('Full content was:', fullContent)
      return {
        message: fullContent,
        structured: {
          flowchart: {
            nodes: [
              { id: "start", type: "start", label: "开始" },
              { id: "process", type: "process", label: "业务处理" },
              { id: "end", type: "end", label: "结束" }
            ],
            edges: [
              { from: "start", to: "process", label: "" },
              { from: "process", to: "end", label: "" }
            ]
          },
          accounts: [],
          rules: []
        }
      }
    }
  }

  async generateSampleTransaction(
    scenarioDescription: string,
    rules: (AIResponse['structured'] & { rules: any })['rules'] | undefined,
    accounts: Account[]
  ): Promise<{
    description: string
    entries: Array<{
      accountCode: string
      accountName: string
      debit?: number
      credit?: number
      description: string
    }>
  }> {
    const client = await this.getClient()
    const model = await this.getModel()
    
    const systemPrompt = `Generate a realistic sample transaction based on the scenario description and accounting rules.
Respond in JSON format:
{
  "description": "string - transaction description",
  "entries": [
    {"accountCode": "string", "accountName": "string", "debit": number, "credit": number, "description": "string"}
  ]
}

Rules: ${JSON.stringify(rules || [])}
Available accounts: ${accounts.map(a => `${a.code} ${a.name}`).join(', ')}`

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a sample transaction for: ${scenarioDescription}` }
      ],
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    return JSON.parse(content)
  }

  async testConnection(apiEndpoint: string, apiKey: string, model: string): Promise<boolean> {
    const client = new OpenAI({
      apiKey,
      baseURL: apiEndpoint,
    })

    try {
      await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
      return true
    } catch (error) {
      return false
    }
  }
}

export const aiService = new AIService()
