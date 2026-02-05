# Schema 使用指南

## 📋 当前状况分析

你的观察是正确的！目前我们确实只是定义了 schema，但没有在业务逻辑中充分利用它们进行校验。

### 🎯 已实现的校验

✅ **API 层面已有校验：**
- `chat.stream.ts` - 使用 `sendMessageSchema.parse(body)`
- `confirmed-analysis.post.ts` - 使用 `confirmAnalysisRequestSchema.safeParse(body)`
- `accounts/index.ts` - 使用 `createAccountSchema.parse(body)`
- `journal-rules/[ruleId]/index.patch.ts` - 使用 `structuredJournalRuleSchema.parse(body)`

❌ **缺失的校验：**
- AI 服务中的结构化数据校验
- Function calling 的 schema 转换
- 数据库操作前的业务逻辑校验
- 复杂数据结构的深度校验

## 🚀 如何真正使用这些 Schema

### 1. 在 AI 服务中集成校验

```typescript
// 在 ai-service.ts 中添加
import { SchemaValidator, AIResponseValidator } from './schema-validator'

async analyzeScenario(userInput: string, context: AIContext): Promise<AnalysisResult> {
  // ... 现有逻辑 ...
  
  const response = await adapter.chatCompletion({
    model,
    messages,
    temperature: 0.7,
  })

  // 新增：校验 AI 返回的结构化数据
  if (response.structured) {
    try {
      const validatedData = AIResponseValidator.validateStructuredResponse(response.message)
      
      // 校验会计规则
      if (validatedData.rules) {
        response.structured.rules = SchemaValidator.validateJournalRules(validatedData.rules)
      }
      
      // 校验科目
      if (validatedData.accounts) {
        response.structured.accounts = SchemaValidator.validateAccounts(validatedData.accounts)
      }
    } catch (error) {
      console.warn('AI response validation failed:', error)
      // 可以选择使用原始数据或抛出错误
    }
  }
  
  return response
}
```

### 2. 在 Function Calling 中使用

```typescript
// 在 AI 适配器中
import { zodToJsonSchema } from 'zod-to-json-schema'

export class OpenAIAdapter {
  private getFunctionSchemas() {
    return {
      createAccount: {
        name: "createAccount",
        description: "Create a new accounting account",
        parameters: zodToJsonSchema(AccountSchema)
      },
      createJournalRule: {
        name: "createJournalRule", 
        description: "Create a new journal entry rule",
        parameters: zodToJsonSchema(JournalRuleSchema)
      }
    }
  }
}
```

### 3. 在数据库操作前校验

```typescript
// 在 API 路由中
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // 使用安全校验
  const validation = SchemaValidator.safeValidate(
    SchemaValidator.validateJournalRule,
    body
  )
  
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: `Validation failed: ${validation.error}`
    })
  }
  
  // 获取可用科目进行业务逻辑校验
  const availableAccounts = await getAvailableAccounts()
  const validatedRule = DatabaseValidator.validateJournalRuleForInsert(
    validation.data,
    availableAccounts
  )
  
  // 保存到数据库
  const result = await saveJournalRule(validatedRule)
  return { data: result }
})
```

### 4. 中间件模式

```typescript
// 创建通用校验中间件
export function createValidationMiddleware(schema: any) {
  return async (event: any) => {
    const body = await readBody(event)
    
    const validation = SchemaValidator.safeValidate(
      (data: unknown) => schema.parse(data),
      body
    )
    
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        message: `Validation failed: ${validation.error}`
      })
    }
    
    event.context.validatedData = validation.data
    return event
  }
}

// 在 API 中使用
export default defineEventHandler(async (event) => {
  await createValidationMiddleware(JournalRuleSchema)(event)
  const validatedRule = event.context.validatedData
  
  return await processJournalRule(validatedRule)
})
```

## 🔧 实施步骤

### 第一步：安装依赖
```bash
npm install zod-to-json-schema
```

### 第二步：在现有 API 中增强校验
1. 修改 `ai-service.ts` 添加 AI 响应校验
2. 更新 `chat.stream.ts` 使用新的校验器
3. 增强 `accounts/index.ts` 的校验逻辑

### 第三步：添加 Function Calling 支持
1. 在 AI 适配器中添加 schema 转换
2. 更新 prompt 包含 function calling 指令
3. 处理 function call 结果

### 第四步：创建校验中间件
1. 创建通用校验中间件
2. 在关键 API 路由中应用
3. 统一错误处理

## 💡 最佳实践

### 1. 分层校验
- **API 层**：基础数据格式校验
- **业务层**：业务逻辑校验
- **数据层**：数据库约束校验

### 2. 错误处理
- 使用 `safeParse` 进行安全校验
- 提供详细的错误信息
- 记录校验失败日志

### 3. 性能考虑
- 缓存校验结果
- 避免重复校验
- 异步校验复杂逻辑

### 4. 开发体验
- TypeScript 类型推导
- 详细的 schema 文档
- 校验错误的可读性

## 🎯 具体实施建议

1. **立即实施**：在 AI 服务中添加结构化数据校验
2. **短期目标**：更新所有 API 端点使用新的校验器
3. **中期目标**：实现 Function Calling 集成
4. **长期目标**：建立完整的校验体系

这样就能真正发挥 schema 的作用，确保数据质量和系统稳定性！
