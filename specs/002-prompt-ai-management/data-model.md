# Data Model: Prompt版本化管理与AI服务增强

**Feature**: Prompt版本化管理与AI服务增强  
**Date**: 2026-02-02  
**Database**: PostgreSQL 15+  
**ORM**: drizzle-orm  
**Extends**: [001-accounting-ai-mvp/data-model.md](../001-accounting-ai-mvp/data-model.md)

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PromptTemplate │─────┤  PromptVersion  │     │   AIProvider    │
├─────────────────┤ 1:N ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ scenarioType    │     │ templateId(FK)  │     │ name            │
│ name            │     │ versionNumber   │     │ type            │
│ description     │     │ content         │     │ apiEndpoint     │
│ activeVersionId │────►│ variables(JSON) │     │ apiKey (enc)    │
│ createdAt       │     │ createdBy       │     │ isDefault       │
└─────────────────┘     │ createdAt       │     │ status          │
                        └─────────────────┘     │ createdAt       │
                                                └────────┬────────┘
                                                         │
                                                         │ 1:N
                                                         ▼
                                                ┌─────────────────┐
                                                │    AIModel      │
                                                ├─────────────────┤
                                                │ id (PK)         │
                                                │ providerId (FK) │
                                                │ name            │
                                                │ capabilities    │
                                                │ cachedAt        │
                                                └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  CompanyProfile │     │ ConversationShare│
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ name            │     │ scenarioId (FK) │
│ businessModel   │     │ shareToken (UK) │
│ industry        │     │ createdAt       │
│ accountingPref  │     │ revokedAt       │
│ notes           │     │ isRevoked       │
│ updatedAt       │     └─────────────────┘
└─────────────────┘

┌─────────────────┐
│ConversationMsg  │ (Extended - was Conversation)
├─────────────────┤
│ id (PK)         │
│ scenarioId (FK) │
│ role            │
│ content         │
│ timestamp       │
│ requestLog(JSON)│     ← NEW
│ responseStats   │     ← NEW
│   (JSON)        │
└─────────────────┘
```

---

## Table Definitions

### PromptTemplate (Prompt模板)

每个使用场景对应一个Prompt模板，指向当前激活的版本。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | 唯一标识 |
| scenario_type | prompt_scenario_type | NOT NULL, UNIQUE | 使用场景枚举 |
| name | varchar(100) | NOT NULL | 模板名称 |
| description | text | | 模板说明 |
| active_version_id | uuid | FK → PromptVersion | 当前激活的版本 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

**Enum: prompt_scenario_type**
```typescript
export const promptScenarioTypeEnum = pgEnum('prompt_scenario_type', [
  'scenario_analysis',    // 场景分析
  'sample_generation',    // 示例生成
  'prompt_generation',    // Prompt生成
  'flowchart_generation'  // 流程图生成
])
```

---

### PromptVersion (Prompt版本)

Prompt模板的历史版本，不可变。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| template_id | uuid | FK → PromptTemplate, ON DELETE CASCADE | 所属模板 |
| version_number | integer | NOT NULL | 版本号（自增） |
| content | text | NOT NULL | Prompt内容 |
| variables | jsonb | DEFAULT '[]' | 变量列表 [{name, description, required}] |
| created_by | uuid | FK → User | 创建者 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**Unique Constraint**: (template_id, version_number)

---

### AIProvider (AI服务提供商)

支持多个AI Provider配置。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| name | varchar(100) | NOT NULL | Provider名称 |
| type | provider_type | NOT NULL | 类型枚举 |
| api_endpoint | varchar(500) | NOT NULL | API基础URL |
| api_key | varchar(500) | NOT NULL | 加密存储的API Key |
| is_default | boolean | DEFAULT false | 是否为默认Provider |
| status | provider_status | DEFAULT 'active' | 状态 |
| last_model_fetch | timestamptz | | 上次获取模型列表时间 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

**Enum: provider_type**
```typescript
export const providerTypeEnum = pgEnum('provider_type', [
  'openai',
  'azure',
  'ollama',
  'custom'
])
```

**Enum: provider_status**
```typescript
export const providerStatusEnum = pgEnum('provider_status', [
  'active',
  'inactive',
  'error'
])
```

**Constraint**: Only one Provider can have `is_default = true`

---

### AIModel (AI模型缓存)

从Provider获取的模型列表缓存。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| provider_id | uuid | FK → AIProvider, ON DELETE CASCADE | 所属Provider |
| name | varchar(100) | NOT NULL | 模型名称 |
| capabilities | jsonb | DEFAULT '{}' | 能力信息 {context_length, features} |
| cached_at | timestamptz | DEFAULT now() | 缓存时间 |

**Unique Constraint**: (provider_id, name)

---

### CompanyProfile (公司信息)

扩展原有的Company表，或替代使用（取决于现有实现）。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识（单例，固定ID） |
| name | varchar(100) | NOT NULL | 公司名称 |
| business_model | text | | 业务模式描述 |
| industry | varchar(50) | | 行业 |
| accounting_preference | text | | 会计准则偏好 |
| notes | text | | 其他备注 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

---

### ConversationMessage (会话消息) - 扩展

替代原有的Conversation表结构（从JSONB数组拆分为独立表）。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| scenario_id | uuid | FK → Scenario, ON DELETE CASCADE | 所属场景 |
| role | message_role | NOT NULL | 角色 |
| content | text | NOT NULL | 消息内容 |
| timestamp | timestamptz | DEFAULT now() | 时间戳 |
| request_log | jsonb | | 请求日志 {systemPrompt, context, fullPrompt} |
| response_stats | jsonb | | 响应统计 {model, providerId, inputTokens, outputTokens, durationMs} |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**Enum: message_role**
```typescript
export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
  'system'
])
```

---

### ConversationShare (会话分享)

分享链接管理。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| scenario_id | uuid | FK → Scenario, ON DELETE CASCADE | 所属场景 |
| share_token | varchar(64) | NOT NULL, UNIQUE | 分享Token |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| revoked_at | timestamptz | | 撤销时间 |
| is_revoked | boolean | DEFAULT false | 是否已撤销 |

---

### UserPreference (用户偏好) - 新增

存储用户的AI Provider和模型选择偏好。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| user_id | uuid | FK → User, ON DELETE CASCADE | 用户 |
| preferred_provider_id | uuid | FK → AIProvider | 首选Provider |
| preferred_model | varchar(100) | | 首选模型名称 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

**Unique Constraint**: (user_id)

---

## Migration Strategy

### From Existing Schema (001-accounting-ai-mvp)

1. **AIConfig → AIProvider**: 迁移现有AI配置为默认Provider
2. **Conversation.messages JSONB → ConversationMessage rows**: 拆分数组为独立记录
3. **localStorage → Database**: 一次性迁移浏览器存储的对话数据

### Migration Script Outline

```sql
-- 1. Create new tables
-- 2. Migrate AIConfig to AIProvider (single record as default)
-- 3. Migrate Conversation.messages to ConversationMessage rows
-- 4. Create default PromptTemplates for each scenario_type
-- 5. Create initial PromptVersion from existing system_prompt
-- 6. Create CompanyProfile from existing Company
```

---

## Drizzle Schema (TypeScript)

```typescript
// server/db/schema.ts
import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core'

// New Enums
export const promptScenarioTypeEnum = pgEnum('prompt_scenario_type', [
  'scenario_analysis',
  'sample_generation',
  'prompt_generation',
  'flowchart_generation'
])

export const providerTypeEnum = pgEnum('provider_type', ['openai', 'azure', 'ollama', 'custom'])
export const providerStatusEnum = pgEnum('provider_status', ['active', 'inactive', 'error'])
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system'])

// New Tables
export const promptTemplates = pgTable('prompt_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  scenarioType: promptScenarioTypeEnum('scenario_type').notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  activeVersionId: uuid('active_version_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => promptTemplates.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  variables: jsonb('variables').default([]),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const aiProviders = pgTable('ai_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: providerTypeEnum('type').notNull(),
  apiEndpoint: varchar('api_endpoint', { length: 500 }).notNull(),
  apiKey: varchar('api_key', { length: 500 }).notNull(),
  isDefault: boolean('is_default').default(false),
  status: providerStatusEnum('status').default('active'),
  lastModelFetch: timestamp('last_model_fetch'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const aiModels = pgTable('ai_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull().references(() => aiProviders.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  capabilities: jsonb('capabilities').default({}),
  cachedAt: timestamp('cached_at').defaultNow(),
})

export const companyProfile = pgTable('company_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  businessModel: text('business_model'),
  industry: varchar('industry', { length: 50 }),
  accountingPreference: text('accounting_preference'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  scenarioId: uuid('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  requestLog: jsonb('request_log'),
  responseStats: jsonb('response_stats'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const conversationShares = pgTable('conversation_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  scenarioId: uuid('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  shareToken: varchar('share_token', { length: 64 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  revokedAt: timestamp('revoked_at'),
  isRevoked: boolean('is_revoked').default(false),
})

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  preferredProviderId: uuid('preferred_provider_id').references(() => aiProviders.id),
  preferredModel: varchar('preferred_model', { length: 100 }),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

---

**Phase 1 Complete**: Data model ready for implementation.
