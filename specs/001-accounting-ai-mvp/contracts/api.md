# API Contracts

**Feature**: AI辅助会计规则分析工具 MVP  
**Base URL**: `/api`  
**Format**: JSON

---

## Authentication

Simple role-based authentication via session cookie.
- Admin role: 访问所有端点
- Product role: 访问非admin端点

---

## Endpoints

### Company (公司配置)

#### GET /api/company
获取公司信息

**Response**:
```json
{
  "id": "uuid",
  "name": "string",
  "industry": "string",
  "accountingStd": "string",
  "currency": "string",
  "notes": {},
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### PUT /api/company
更新公司信息 (Admin only)

**Request**:
```json
{
  "name": "string",
  "industry": "string",
  "accountingStd": "string",
  "currency": "string",
  "notes": {}
}
```

---

### Accounts (会计科目)

#### GET /api/accounts
获取所有科目列表

**Query Params**:
- `type`: 筛选类型 (asset/liability/equity/revenue/expense)
- `status`: 状态筛选 (active/inactive)

**Response**:
```json
{
  "accounts": [
    {
      "id": "uuid",
      "code": "1001",
      "name": "库存现金",
      "type": "asset",
      "balanceDirection": "debit",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/accounts
创建新科目

**Request**:
```json
{
  "code": "1001",
  "name": "库存现金",
  "type": "asset",
  "balanceDirection": "debit"
}
```

**Response**: 201 Created, 返回创建的对象

#### PUT /api/accounts/:code
更新科目

**Request**:
```json
{
  "name": "string",
  "type": "asset",
  "balanceDirection": "debit",
  "status": "active"
}
```

#### DELETE /api/accounts/:code
删除科目 (仅当未被使用时)

**Response**: 204 No Content 或 409 Conflict (已被使用)

---

### AI Config (AI配置 - Admin only)

#### GET /api/config/ai
获取AI配置

**Response**:
```json
{
  "id": "uuid",
  "apiEndpoint": "https://api.openai.com/v1",
  "modelType": "gpt-4",
  "temperature": 0.7,
  "systemPrompt": "string",
  "version": 1,
  "isActive": true,
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Note**: `apiKey` 不在响应中返回

#### PUT /api/config/ai
更新AI配置

**Request**:
```json
{
  "apiEndpoint": "string",
  "apiKey": "string",
  "modelType": "string",
  "temperature": 0.7,
  "systemPrompt": "string"
}
```

---

### Scenarios (业务场景)

#### GET /api/scenarios
获取场景列表

**Query Params**:
- `status`: 状态筛选
- `isTemplate`: 是否只显示范例
- `search`: 名称搜索

**Response**:
```json
{
  "scenarios": [
    {
      "id": "uuid",
      "name": "string",
      "status": "draft",
      "isTemplate": false,
      "createdBy": "uuid",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/scenarios
创建新场景

**Request**:
```json
{
  "name": "预售定金模式",
  "description": "用户支付定金预订商品...",
  "parties": [
    {"name": "用户", "role": "buyer", "description": "支付定金"},
    {"name": "平台", "role": "platform", "description": "代收定金"}
  ],
  "isTemplate": false
}
```

**Response**: 201 Created

#### GET /api/scenarios/:id
获取场景详情

**Response**:
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "parties": [],
  "status": "confirmed",
  "isTemplate": false,
  "accountMappings": [...],
  "journalRules": [...],
  "createdBy": "uuid",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### PUT /api/scenarios/:id
更新场景基础信息

**Request**:
```json
{
  "name": "string",
  "description": "string",
  "parties": []
}
```

#### DELETE /api/scenarios/:id
删除场景

---

### AI Analysis (AI分析)

#### POST /api/scenarios/:id/analyze/start
开始AI分析

**Request**:
```json
{
  "initialDescription": "用户详细业务描述..."
}
```

**Response**:
```json
{
  "conversationId": "uuid",
  "status": "active"
}
```

#### POST /api/ai/chat
发送消息到AI对话 (流式响应)

**Request**:
```json
{
  "conversationId": "uuid",
  "message": "用户输入的消息"
}
```

**Response**: `text/event-stream` (SSE)

```
data: {"type": "delta", "content": "部分AI回复"}

data: {"type": "structured", "data": {"flowchart": {...}, "mappings": [...]}}

data: {"type": "complete", "conversationId": "uuid"}
```

#### GET /api/ai/chat/:conversationId
获取对话历史

**Response**:
```json
{
  "id": "uuid",
  "scenarioId": "uuid",
  "messages": [
    {"role": "user", "content": "...", "timestamp": "2025-01-01T00:00:00Z"},
    {"role": "assistant", "content": "...", "timestamp": "2025-01-01T00:00:00Z"}
  ],
  "status": "active",
  "resultCache": {
    "accountMappings": [...],
    "journalRules": [...],
    "flowchartData": {...}
  }
}
```

#### POST /api/scenarios/:id/analyze/confirm
确认AI分析结果并保存

**Request**:
```json
{
  "accountMappings": [...],
  "journalRules": [...]
}
```

**Response**: 200 OK, 场景状态变为 `confirmed`

---

### Sample Transactions (示例交易)

#### POST /api/scenarios/:id/sample
生成示例交易 (后台异步)

**Response**:
```json
{
  "jobId": "uuid",
  "status": "pending"
}
```

#### GET /api/scenarios/:id/sample
获取示例交易

**Response**:
```json
{
  "id": "uuid",
  "scenarioId": "uuid",
  "name": "标准预售交易示例",
  "steps": [
    {
      "stepNo": 1,
      "event": "用户支付定金",
      "entries": [
        {
          "debit": {"accountCode": "1002", "accountName": "银行存款", "amount": 100},
          "credit": {"accountCode": "2203", "accountName": "预收账款", "amount": 100},
          "description": "收到用户定金"
        }
      ]
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### Flowchart (流程图)

#### GET /api/scenarios/:id/flowchart
获取流程图数据

**Response**:
```json
{
  "id": "uuid",
  "scenarioId": "uuid",
  "nodes": [
    {"id": "n1", "type": "start", "label": "用户下单", "x": 100, "y": 100},
    {"id": "n2", "type": "process", "label": "支付定金", "x": 300, "y": 100}
  ],
  "edges": [
    {"from": "n1", "to": "n2", "label": "提交订单"}
  ],
  "mermaidCode": "flowchart LR\n  A[用户下单] --> B[支付定金]"
}
```

#### PUT /api/scenarios/:id/flowchart
更新流程图布局 (用户手动调整)

**Request**:
```json
{
  "nodes": [...],
  "edges": [...]
}
```

---

### Export (导出)

#### GET /api/scenarios/:id/export/json
导出JSON

**Response**: `application/json` attachment

#### GET /api/scenarios/:id/export/excel
导出Excel

**Response**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` attachment

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {"field": "code", "message": "科目代码已存在"}
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Admin role required"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "CONFLICT",
  "message": "Account is used in 3 scenarios"
}
```

### 500 Internal Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "AI service unavailable"
}
```

---

## TypeScript Types

```typescript
// types/api.ts

export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  error: string
  message: string
  details?: Array<{field: string, message: string}>
  data?: never
}

export interface Account {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  balanceDirection: 'debit' | 'credit'
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Scenario {
  id: string
  name: string
  description: string
  parties: Party[]
  status: 'draft' | 'analyzing' | 'confirmed'
  isTemplate: boolean
  accountMappings: AccountMapping[]
  journalRules: JournalRule[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Party {
  name: string
  role: string
  description: string
}

export interface AccountMapping {
  id: string
  scenarioId: string
  accountCode: string
  businessRole: string
  calcLogic?: string
  notes?: string
}

export interface JournalRule {
  id: string
  scenarioId: string
  name: string
  triggerCondition: string
  debitAccount: string
  creditAccount: string
  calcLogic: string
  example?: string
}

export interface StreamEvent {
  type: 'delta' | 'structured' | 'complete' | 'error'
  content?: string
  data?: unknown
  conversationId?: string
  error?: string
}
```
