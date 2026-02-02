import { defineEventHandler, createError, readBody } from 'h3'
import { z } from 'zod'

const previewSchema = z.object({
  content: z.string().min(1),
  variables: z.record(z.string()).optional(),
})

// Sample data for preview
const sampleData = {
  company_info: '示例公司是一家中型制造企业，主营电子产品的研发和生产',
  accounts: JSON.stringify([
    { code: '1001', name: '现金', type: 'asset' },
    { code: '1002', name: '银行存款', type: 'asset' },
    { code: '1122', name: '应收账款', type: 'asset' },
    { code: '2202', name: '应付账款', type: 'liability' },
    { code: '6001', name: '主营业务收入', type: 'revenue' },
    { code: '6401', name: '主营业务成本', type: 'expense' },
  ], null, 2),
  template_scenario: '销售商品并收款的业务流程',
  user_input: '客户购买产品，我们发货并开具发票',
  conversation_history: '用户：如何记录销售业务？\nAI：销售业务通常涉及收入和应收账款的确认...',
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { content, variables = {} } = previewSchema.parse(body)

    // Merge sample data with provided variables
    const mergedVars = { ...sampleData, ...variables }

    // Replace variables in content
    let rendered = content
    Object.entries(mergedVars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      rendered = rendered.replace(regex, String(value))
    })

    // Show unrendered variables
    const unrenderedVars = [...rendered.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1])

    return {
      original: content,
      rendered,
      unrenderedVars: [...new Set(unrenderedVars)],
      usedVars: Object.keys(mergedVars).filter(key => content.includes(`{{${key}}`)),
    }
  } catch (error) {
    console.error('Error previewing prompt:', error)
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to preview prompt'
    })
  }
})
