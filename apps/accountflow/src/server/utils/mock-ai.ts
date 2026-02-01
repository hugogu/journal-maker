import type { Account } from '../../types'

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

export class MockAIService {
  async analyzeScenario(
    userInput: string,
    context: AIContext
  ): Promise<AIResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Generate mock response based on input keywords
    const response: AIResponse = {
      message: this.generateResponse(userInput, context),
      structured: {
        flowchart: this.generateFlowchart(userInput),
        accounts: this.suggestAccounts(userInput, context),
        rules: this.generateRules(userInput),
      },
    }

    return response
  }

  async generateSampleTransaction(
    scenarioDescription: string,
    rules: AIResponse['structured']['rules'],
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
    await new Promise(resolve => setTimeout(resolve, 800))

    return {
      description: `示例交易：${scenarioDescription.slice(0, 50)}...`,
      entries: [
        {
          accountCode: '1001',
          accountName: '库存现金',
          debit: 10000,
          description: '收到客户付款',
        },
        {
          accountCode: '6001',
          accountName: '主营业务收入',
          credit: 10000,
          description: '确认收入',
        },
      ],
    }
  }

  private generateResponse(userInput: string, context: AIContext): string {
    const responses = [
      `根据您描述的业务场景，我建议从以下几个角度分析：\n\n1. **参与方识别**：明确业务中的各方角色和权责\n2. **资金流动**：追踪资金的来源和去向\n3. **会计科目**：基于现有科目体系，建议使用：${context.accounts.slice(0, 3).map(a => a.name).join('、')}\n\n请告诉我更多关于业务细节的信息。`,
      `这是一个典型的电商业务场景。让我帮您梳理：\n\n- **买方**：下单并支付\n- **卖方**：发货并确认收入\n- **平台**：收取佣金\n\n建议使用的科目包括应收账款、主营业务收入、应交税费等。`,
      `我理解您描述的场景涉及多方交易。为了更好地设计会计规则，我需要了解：\n\n1. 资金结算周期是多长？\n2. 是否存在预付款或分期付款？\n3. 退款和售后如何处理？\n\n请补充这些信息。`,
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  private generateFlowchart(userInput: string): AIResponse['structured']['flowchart'] {
    return {
      nodes: [
        { id: 'start', type: 'start', label: '开始' },
        { id: 'user_action', type: 'process', label: '用户下单支付' },
        { id: 'platform', type: 'process', label: '平台收款' },
        { id: 'merchant', type: 'process', label: '商家发货' },
        { id: 'settlement', type: 'process', label: '结算打款' },
        { id: 'end', type: 'end', label: '结束' },
      ],
      edges: [
        { from: 'start', to: 'user_action' },
        { from: 'user_action', to: 'platform', label: '支付成功' },
        { from: 'platform', to: 'merchant', label: '通知商家' },
        { from: 'merchant', to: 'settlement', label: '发货完成' },
        { from: 'settlement', to: 'end', label: '结算完成' },
      ],
    }
  }

  private suggestAccounts(
    userInput: string,
    context: AIContext
  ): AIResponse['structured']['accounts'] {
    const suggestions = [
      { code: '1002', name: '银行存款', type: 'asset', reason: '用于记录资金收入' },
      { code: '1122', name: '应收账款', type: 'asset', reason: '存在账期时使用' },
      { code: '6001', name: '主营业务收入', type: 'revenue', reason: '核心业务收入来源' },
      { code: '6401', name: '主营业务成本', type: 'expense', reason: '对应成本支出' },
    ]

    return suggestions
  }

  private generateRules(userInput: string): AIResponse['structured']['rules'] {
    return [
      {
        event: '用户支付订单',
        debit: '银行存款 / 应收账款',
        credit: '主营业务收入',
        description: '确认销售收入，同时记录资金流入',
      },
      {
        event: '平台扣除佣金',
        debit: '销售费用',
        credit: '银行存款',
        description: '记录平台服务费支出',
      },
      {
        event: '结算给商家',
        debit: '应付账款',
        credit: '银行存款',
        description: '将扣除佣金后的款项结算给商家',
      },
    ]
  }

  async testConnection(apiEndpoint: string, apiKey: string, model: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return true
  }
}

export const mockAIService = new MockAIService()
