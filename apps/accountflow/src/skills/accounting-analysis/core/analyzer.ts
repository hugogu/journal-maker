/**
 * Core analyzer for accounting scenarios
 * Uses AI to analyze business scenarios and generate accounting artifacts
 */

import type {
  AnalysisInput,
  AnalysisResult,
  AccountingSubject,
  JournalRule,
  AccountingStandard,
  ExistingAccount,
} from './types'
import { validateAccountingSubjects, validateJournalRule } from './validator'

/**
 * AI Provider interface for analyzing scenarios
 * Implementations can use OpenAI, Anthropic, local models, etc.
 */
export interface AIProvider {
  /**
   * Analyze a business scenario and generate accounting artifacts
   */
  analyzeScenario(input: AnalysisInput): Promise<AIAnalysisResponse>
}

/**
 * Response from AI analysis
 */
export interface AIAnalysisResponse {
  subjects: AccountingSubject[]
  journalRules: JournalRule[]
  flowDiagram?: string
  reasoning?: string
  confidence?: number
}

/**
 * Accounting Analyzer
 * Core business logic for analyzing scenarios
 */
export class AccountingAnalyzer {
  constructor(private aiProvider: AIProvider) {}

  /**
   * Analyze a business scenario
   */
  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    // Validate input
    this.validateInput(input)

    // Use AI to analyze the scenario
    const aiResponse = await this.aiProvider.analyzeScenario(input)

    // Post-process and validate the AI response
    const subjects = this.postProcessSubjects(aiResponse.subjects, input.existingAccounts)
    const journalRules = this.postProcessRules(aiResponse.journalRules)

    // Validate the results
    const subjectsValidation = validateAccountingSubjects(subjects)
    if (!subjectsValidation.isValid) {
      throw new Error(`Invalid subjects: ${subjectsValidation.errors.map(e => e.message).join(', ')}`)
    }

    const rulesValidation = journalRules.map(rule => validateJournalRule(rule))
    const invalidRules = rulesValidation.filter(v => !v.isValid)
    if (invalidRules.length > 0) {
      const errors = invalidRules.flatMap(v => v.errors.map(e => e.message))
      throw new Error(`Invalid rules: ${errors.join(', ')}`)
    }

    // Collect warnings
    const warnings: string[] = []
    subjectsValidation.warnings.forEach(w => warnings.push(w.message))
    rulesValidation.forEach(v => v.warnings.forEach(w => warnings.push(w.message)))

    return {
      scenario: input.businessScenario,
      subjects,
      journalRules,
      flowDiagram: aiResponse.flowDiagram,
      confidence: aiResponse.confidence,
      reasoning: aiResponse.reasoning,
      warnings: warnings.length > 0 ? warnings : undefined,
      analyzedAt: new Date(),
      sourceMessageId: input.previousAnalysis?.sourceMessageId,
    }
  }

  /**
   * Refine an existing analysis based on user feedback
   */
  async refine(previousResult: AnalysisResult, feedback: string): Promise<AnalysisResult> {
    const input: AnalysisInput = {
      businessScenario: previousResult.scenario,
      previousAnalysis: previousResult,
      constraints: [feedback],
    }

    return this.analyze(input)
  }

  /**
   * Validate analysis input
   */
  private validateInput(input: AnalysisInput): void {
    if (!input.businessScenario || input.businessScenario.trim() === '') {
      throw new Error('Business scenario is required')
    }
  }

  /**
   * Post-process subjects to link with existing accounts
   */
  private postProcessSubjects(
    subjects: AccountingSubject[],
    existingAccounts?: ExistingAccount[]
  ): AccountingSubject[] {
    if (!existingAccounts || existingAccounts.length === 0) {
      return subjects
    }

    return subjects.map(subject => {
      // Try to match with existing account by code
      const existingAccount = existingAccounts.find(
        acc => acc.code === subject.code || acc.name === subject.name
      )

      if (existingAccount) {
        return {
          ...subject,
          accountId: existingAccount.id,
          // Use existing account info if subject info is missing
          type: subject.type || existingAccount.type,
          direction: subject.direction || existingAccount.direction,
        }
      }

      return subject
    })
  }

  /**
   * Post-process journal rules
   */
  private postProcessRules(rules: JournalRule[]): JournalRule[] {
    return rules.map(rule => {
      // Extract variables from formulas if not already documented
      if (!rule.variables || rule.variables.length === 0) {
        const variables = this.extractVariablesFromRule(rule)
        if (variables.length > 0) {
          rule.variables = variables
        }
      }

      return rule
    })
  }

  /**
   * Extract variable names used in a rule
   */
  private extractVariablesFromRule(rule: JournalRule): string[] {
    const variables = new Set<string>()

    const extractFromFormula = (formula?: string) => {
      if (!formula) return
      const matches = formula.matchAll(/\{\{(\w+)\}\}/g)
      for (const match of matches) {
        variables.add(match[1])
      }
    }

    rule.debitSide?.entries?.forEach(entry => {
      extractFromFormula(entry.amountFormula)
    })

    rule.creditSide?.entries?.forEach(entry => {
      extractFromFormula(entry.amountFormula)
    })

    return Array.from(variables)
  }
}

/**
 * Build a system prompt for accounting analysis
 */
export function buildSystemPrompt(standard?: AccountingStandard): string {
  const standardText = standard === 'CN' ? '中国会计准则'
    : standard === 'US_GAAP' ? 'US GAAP'
    : standard === 'IFRS' ? 'IFRS'
    : '通用会计准则'

  return `你是一个专业的会计分析助手，精通${standardText}。

你的任务是分析业务场景，并生成：
1. 会计科目（AccountingSubject）：涉及的会计科目及其属性
2. 会计分录规则（JournalRule）：业务事项对应的借贷分录模板
3. 流程图（可选）：业务流程的 Mermaid 图表

要求：
- 科目代码遵循${standardText}标准
- 借贷分录必须平衡
- 使用模板变量（如 {{amount}}）处理动态金额
- 提供清晰的说明和推理过程
- 考虑税务影响（如增值税）

输出格式必须是结构化的 JSON，包含 subjects 和 journalRules 数组。`
}

/**
 * Build user prompt for analysis
 */
export function buildAnalysisPrompt(input: AnalysisInput): string {
  let prompt = `业务场景：\n${input.businessScenario}\n\n`

  if (input.companyContext) {
    prompt += `公司信息：\n`
    if (input.companyContext.name) prompt += `- 名称：${input.companyContext.name}\n`
    if (input.companyContext.industry) prompt += `- 行业：${input.companyContext.industry}\n`
    if (input.companyContext.taxInfo?.vatRate) {
      prompt += `- 增值税率：${input.companyContext.taxInfo.vatRate * 100}%\n`
    }
    prompt += '\n'
  }

  if (input.existingAccounts && input.existingAccounts.length > 0) {
    prompt += `现有科目表（请优先使用这些科目）：\n`
    input.existingAccounts.forEach(acc => {
      prompt += `- ${acc.code} ${acc.name} (${acc.type}, ${acc.direction})\n`
    })
    prompt += '\n'
  }

  if (input.constraints && input.constraints.length > 0) {
    prompt += `约束条件：\n`
    input.constraints.forEach(constraint => {
      prompt += `- ${constraint}\n`
    })
    prompt += '\n'
  }

  if (input.previousAnalysis) {
    prompt += `之前的分析结果（请基于此结果改进）：\n`
    prompt += `- 科目数量：${input.previousAnalysis.subjects.length}\n`
    prompt += `- 规则数量：${input.previousAnalysis.journalRules.length}\n`
    if (input.previousAnalysis.warnings) {
      prompt += `- 警告：${input.previousAnalysis.warnings.join(', ')}\n`
    }
    prompt += '\n'
  }

  prompt += `请分析上述场景，生成会计科目和分录规则。`

  return prompt
}
