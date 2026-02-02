# API Contract: Enhanced Conversation Management

**Version**: 1.0.0  
**Base Path**: `/api/conversations`  
**Status**: Draft

---

## Endpoints

### GET /api/scenarios/:id/conversations

获取指定场景的所有对话消息（替代原有的localStorage读取）。

**Response**:
```typescript
{
  scenarioId: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
    hasRequestLog: boolean
    hasResponseStats: boolean
  }>
}
```

---

### POST /api/scenarios/:id/conversations/messages

发送消息并获取AI回复（流式SSE）。

**Request**:
```typescript
{
  content: string
  providerId?: string      // 可选，使用用户偏好或默认
  model?: string           // 可选，使用用户偏好或默认
}
```

**Response**: SSE Stream

```
event: message
data: {"type": "delta", "content": "..."}

event: message
data: {"type": "stats", "stats": {"model": "gpt-4", "inputTokens": 150, "outputTokens": 200, "durationMs": 1200}}

event: done
data: {"messageId": "...", "assistantMessageId": "..."}
```

**Behavior**:
1. Saves user message to database immediately
2. Streams AI response chunks
3. On completion, saves assistant message with request log and response stats

---

### GET /api/conversations/messages/:id/log

获取消息的请求日志（系统Prompt、上下文、完整请求）。

**Response**:
```typescript
{
  messageId: string
  requestLog: {
    systemPrompt: string
    contextMessages: Array<{
      role: string
      content: string
    }>
    fullPrompt: string // 完整拼接后的Prompt
    variables: Record<string, string> // 注入的变量值
  }
}
```

**Access**: Only message author or admin

---

### GET /api/conversations/messages/:id/stats

获取AI响应的统计信息。

**Response**:
```typescript
{
  messageId: string
  responseStats: {
    model: string
    providerId: string
    providerName: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    durationMs: number
    costEstimate?: number // 可选：估算成本
  }
}
```

---

### POST /api/scenarios/:id/conversations/export

导出会话为Markdown文件。

**Request**:
```typescript
{
  format: 'markdown' | 'json'
  includeLogs?: boolean    // 是否包含请求日志（默认false）
  includeStats?: boolean   // 是否包含统计信息（默认true）
}
```

**Response**: File download (Content-Disposition: attachment)

**Markdown Format Example**:
```markdown
# Conversation Export: [Scenario Name]

**Exported at**: 2026-02-02 14:30:00
**Messages**: 10

---

## Message 1 (User)
**Time**: 14:25:00

内容...

## Message 2 (Assistant)
**Time**: 14:25:05
**Model**: gpt-4
**Tokens**: 150 → 200

内容...
```

---

### DELETE /api/scenarios/:id/conversations

清空场景的所有对话（软删除或归档）。

**Query**: `?confirm=true` (required)

**Response**: 204 No Content

---

## Migration Endpoint

### POST /api/conversations/migrate-from-localstorage

一次性迁移localStorage中的对话数据到数据库。

**Request**:
```typescript
{
  scenarioId: string
  messages: Array<{
    role: string
    content: string
    timestamp: string
  }>
}
```

**Response**: 
```typescript
{
  migratedCount: number
  conversationId: string
}
```

**Note**: This endpoint is used by the frontend during the transition period.
