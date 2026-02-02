# API Contract: AI Provider Management

**Version**: 1.0.0  
**Base Path**: `/api/ai-providers`  
**Status**: Draft

---

## Endpoints

### GET /api/ai-providers

获取所有AI Provider配置列表。

**Response**:
```typescript
{
  providers: Array<{
    id: string
    name: string
    type: 'openai' | 'azure' | 'ollama' | 'custom'
    apiEndpoint: string // masked: https://api...***
    isDefault: boolean
    status: 'active' | 'inactive' | 'error'
    lastModelFetch: string | null
    modelCount: number
  }>
}
```

---

### GET /api/ai-providers/:id

获取指定Provider的详细信息及模型列表。

**Response**:
```typescript
{
  id: string
  name: string
  type: string
  apiEndpoint: string
  isDefault: boolean
  status: string
  lastModelFetch: string | null
  models: Array<{
    id: string
    name: string
    capabilities: {
      contextLength?: number
      supportsStreaming?: boolean
      supportsFunctions?: boolean
    }
    cachedAt: string
  }>
}
```

---

### POST /api/ai-providers

创建新的AI Provider配置。

**Request**:
```typescript
{
  name: string
  type: 'openai' | 'azure' | 'ollama' | 'custom'
  apiEndpoint: string
  apiKey: string
  isDefault?: boolean // default: false
}
```

**Response**: Created provider object (models will be fetched async)

**Errors**:
- 400: Invalid API endpoint or key
- 409: Cannot set default when another provider is already default

---

### PUT /api/ai-providers/:id

更新Provider配置。

**Request**:
```typescript
{
  name?: string
  apiEndpoint?: string
  apiKey?: string // only included if changing
  isDefault?: boolean
  status?: 'active' | 'inactive'
}
```

**Response**: Updated provider object

**Note**: Changing apiEndpoint or apiKey will trigger model list refresh

---

### DELETE /api/ai-providers/:id

删除Provider配置（禁止删除默认Provider）。

**Errors**:
- 409: Cannot delete default provider

---

### POST /api/ai-providers/:id/refresh-models

手动刷新模型列表。

**Response**:
```typescript
{
  fetchedAt: string
  modelCount: number
  models: Array<{
    name: string
    capabilities: object
  }>
}
```

**Errors**:
- 502: Provider API unreachable or returned error

---

### GET /api/ai-providers/models

获取所有Provider的模型（聚合视图，用于选择器）。

**Response**:
```typescript
{
  models: Array<{
    providerId: string
    providerName: string
    modelName: string
    fullName: string // "ProviderName/modelName"
  }>
}
```

---

## User Preferences

### GET /api/user/preferences/ai

获取当前用户的AI偏好设置。

**Response**:
```typescript
{
  preferredProviderId: string | null
  preferredProvider: {
    id: string
    name: string
  } | null
  preferredModel: string | null
}
```

---

### PUT /api/user/preferences/ai

更新用户的AI偏好设置。

**Request**:
```typescript
{
  preferredProviderId: string
  preferredModel: string
}
```

**Response**: Updated preferences

**Errors**:
- 400: Invalid provider or model
