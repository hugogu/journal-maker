# API Contract: Prompt Management

**Version**: 1.0.0  
**Base Path**: `/api/prompts`  
**Status**: Draft

---

## Endpoints

### GET /api/prompts

获取所有Prompt模板列表（按使用场景分组）。

**Response**:
```typescript
{
  templates: Array<{
    id: string
    scenarioType: 'scenario_analysis' | 'sample_generation' | 'prompt_generation' | 'flowchart_generation'
    name: string
    description: string | null
    activeVersion: {
      id: string
      versionNumber: number
      createdAt: string
    } | null
    versionCount: number
  }>
}
```

---

### GET /api/prompts/:id

获取指定Prompt模板的详细信息及版本历史。

**Response**:
```typescript
{
  id: string
  scenarioType: string
  name: string
  description: string | null
  activeVersionId: string | null
  activeVersion: {
    id: string
    versionNumber: number
    content: string
    variables: Array<{
      name: string
      description: string
      required: boolean
    }>
    createdAt: string
    createdBy: {
      id: string
      username: string
    } | null
  } | null
  versions: Array<{
    id: string
    versionNumber: number
    createdAt: string
    createdBy: {
      id: string
      username: string
    } | null
  }>
}
```

---

### POST /api/prompts

创建新的Prompt模板（通常每个场景类型只有一个模板）。

**Request**:
```typescript
{
  scenarioType: string
  name: string
  description?: string
  initialContent: string
}
```

**Response**: Created template object (same as GET /api/prompts/:id)

**Errors**:
- 409: scenarioType already exists

---

### POST /api/prompts/:id/versions

创建新版本。

**Request**:
```typescript
{
  content: string
  // variables auto-extracted from content ({{varName}} pattern)
}
```

**Response**: Created version object

---

### PUT /api/prompts/:id/activate

激活指定版本。

**Request**:
```typescript
{
  versionId: string
}
```

**Response**: Updated template with new activeVersion

---

### POST /api/prompts/generate

使用AI生成Prompt内容。

**Request**:
```typescript
{
  requirementDescription: string
  scenarioType: string
}
```

**Response**:
```typescript
{
  generatedContent: string
  suggestedVariables: string[]
}
```

---

### GET /api/prompts/:id/versions/:versionId/diff

对比两个版本（默认与当前激活版本对比）。

**Query**: `?compareWith=anotherVersionId` (optional, defaults to previous version)

**Response**:
```typescript
{
  baseVersion: { id: string, versionNumber: number }
  compareVersion: { id: string, versionNumber: number }
  diff: string // unified diff format
}
```
