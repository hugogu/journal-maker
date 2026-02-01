# Data Model: AI辅助会计规则分析工具

**Feature**: AI辅助会计规则分析工具 MVP  
**Date**: 2025-02-01  
**Database**: PostgreSQL 15+  
**ORM**: drizzle-orm

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Company     │     │      User       │     │    AIConfig     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ name            │     │ username        │     │ apiEndpoint     │
│ industry        │     │ role            │     │ apiKey (enc)    │
│ accountingStd   │     │ createdAt       │     │ modelType       │
│ currency        │                     └───────┤ temperature     │
│ notes (JSONB)   │                             │ systemPrompt    │
│ createdAt       │                             │ version         │
└────────┬────────┘                             │ isActive        │
         │                                      │ updatedAt       │
         │                                      └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Scenario     │◄────┤  AccountMapping │     │    Account      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ name            │ N:1 │ scenarioId (FK) │     │ code (UK)       │
│ description     │     │ accountCode(FK) │◄────┤ name            │
│ parties (JSONB) │     │ businessRole    │     │ type            │
│ status          │     │ calcLogic       │     │ balanceDirection│
│ isTemplate      │     │ notes           │     │ status          │
│ createdBy (FK)  │     └─────────────────┘     │ createdAt       │
│ companyId (FK)  │                             └─────────────────┘
│ createdAt       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   JournalRule   │     │  Conversation   │     │ SampleTransaction│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ scenarioId (FK) │     │ scenarioId (FK) │     │ scenarioId (FK) │
│ name            │     │ messages(JSONB) │     │ name            │
│ triggerCondition│     │ status          │     │ steps (JSONB)   │
│ debitAccount    │     │ resultCache     │     │ createdAt       │
│ creditAccount   │     │ createdAt       │     └─────────────────┘
│ calcLogic       │     └─────────────────┘
│ example         │
└─────────────────┘

┌─────────────────┐
│  FlowchartData  │
├─────────────────┤
│ id (PK)         │
│ scenarioId (FK) │
│ nodes (JSONB)   │
│ edges (JSONB)   │
│ mermaidCode     │
│ updatedAt       │
└─────────────────┘
```

---

## Table Definitions

### Company (公司信息)

全局配置，所有场景共享。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | 唯一标识 |
| name | varchar(100) | NOT NULL | 公司名称 |
| industry | varchar(50) | | 行业 |
| accounting_std | varchar(20) | DEFAULT '企业会计准则' | 会计准则 |
| currency | varchar(3) | DEFAULT 'CNY' | 默认币种 |
| notes | jsonb | DEFAULT '{}' | 其他信息 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

---

### User (用户)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| username | varchar(50) | NOT NULL, UNIQUE | 用户名 |
| role | user_role | NOT NULL | admin/product |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**Enum: user_role**
```typescript
export const userRoleEnum = pgEnum('user_role', ['admin', 'product'])
```

---

### AIConfig (AI配置)

单条记录，全局AI服务配置。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| api_endpoint | varchar(255) | NOT NULL | API端点 |
| api_key | varchar(255) | NOT NULL | 加密存储的Key |
| model_type | varchar(50) | NOT NULL | gpt-4/gpt-3.5等 |
| temperature | decimal(3,2) | DEFAULT 0.7 | 温度参数 |
| system_prompt | text | NOT NULL | 系统Prompt模板 |
| version | integer | DEFAULT 1 | Prompt版本 |
| is_active | boolean | DEFAULT true | 是否启用 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

---

### Account (会计科目)

全局共享科目表。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| code | varchar(20) | NOT NULL, UNIQUE | 科目代码(如1001) |
| name | varchar(100) | NOT NULL | 科目名称 |
| type | account_type | NOT NULL | 科目类型 |
| balance_direction | varchar(10) | NOT NULL | 借/贷 |
| status | account_status | DEFAULT 'active' | 启用/停用 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

**Enums:**
```typescript
export const accountTypeEnum = pgEnum('account_type', [
  'asset',        // 资产
  'liability',    // 负债
  'equity',       // 权益
  'revenue',      // 收入
  'expense'       // 费用
])

export const accountStatusEnum = pgEnum('account_status', ['active', 'inactive'])
```

---

### Scenario (业务场景)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| name | varchar(100) | NOT NULL | 场景名称 |
| description | text | | 业务描述 |
| parties | jsonb | DEFAULT '[]' | 参与方信息 [{name, role, description}] |
| status | scenario_status | DEFAULT 'draft' | 状态 |
| is_template | boolean | DEFAULT false | 是否范例 |
| created_by | uuid | FK → User | 创建者 |
| company_id | uuid | FK → Company | 所属公司 |
| account_mappings | jsonb | DEFAULT '[]' | 科目映射缓存 |
| journal_rules | jsonb | DEFAULT '[]' | 分录规则缓存 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

**Enum: scenario_status**
```typescript
export const scenarioStatusEnum = pgEnum('scenario_status', [
  'draft',      // 草稿
  'analyzing',  // AI分析中
  'confirmed'   // 已确认
])
```

---

### AccountMapping (科目映射)

场景内的科目具体用途映射。

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| scenario_id | uuid | FK → Scenario, ON DELETE CASCADE | 所属场景 |
| account_code | varchar(20) | FK → Account.code | 科目代码 |
| business_role | varchar(100) | NOT NULL | 业务角色(如"平台收入") |
| calc_logic | text | | 金额计算逻辑 |
| notes | text | | 说明 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

---

### JournalRule (会计分录规则)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| scenario_id | uuid | FK → Scenario, ON DELETE CASCADE | 所属场景 |
| name | varchar(100) | NOT NULL | 规则名称 |
| trigger_condition | text | NOT NULL | 触发条件 |
| debit_account | varchar(20) | NOT NULL | 借方科目代码 |
| credit_account | varchar(20) | NOT NULL | 贷方科目代码 |
| calc_logic | text | NOT NULL | 金额计算逻辑 |
| example | text | | 示例说明 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

---

### Conversation (AI对话)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| scenario_id | uuid | FK → Scenario, ON DELETE CASCADE | 所属场景 |
| messages | jsonb | NOT NULL, DEFAULT '[]' | 消息列表 [{role, content, timestamp}] |
| status | conversation_status | DEFAULT 'active' | 状态 |
| result_cache | jsonb | | 结构化结果缓存 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**Enum: conversation_status**
```typescript
export const conversationStatusEnum = pgEnum('conversation_status', [
  'active',     // 进行中
  'completed',  // 已完成
  'error'       // 出错
])
```

---

### SampleTransaction (示例交易)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| scenario_id | uuid | FK → Scenario, ON DELETE CASCADE | 所属场景 |
| name | varchar(100) | NOT NULL | 交易名称 |
| steps | jsonb | NOT NULL | 交易步骤 [{stepNo, event, entries: [{debit, credit, amount, description}]}] |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

---

### FlowchartData (流程图数据)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | 唯一标识 |
| scenario_id | uuid | FK → Scenario, ON DELETE CASCADE | 所属场景 |
| nodes | jsonb | NOT NULL, DEFAULT '[]' | 节点列表 [{id, type, label, x, y}] |
| edges | jsonb | NOT NULL, DEFAULT '[]' | 边列表 [{from, to, label}] |
| mermaid_code | text | | Mermaid语法代码 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

---

## Indexes

```sql
-- 常用查询优化
CREATE INDEX idx_scenario_status ON scenario(status);
CREATE INDEX idx_scenario_template ON scenario(is_template) WHERE is_template = true;
CREATE INDEX idx_account_type ON account(type);
CREATE INDEX idx_journal_rule_scenario ON journal_rule(scenario_id);
CREATE INDEX idx_conversation_scenario ON conversation(scenario_id);
CREATE INDEX idx_account_mapping_scenario ON account_mapping(scenario_id);
```

---

## State Transitions

### Scenario Status

```
┌─────────┐    创建场景     ┌─────────┐   开始分析    ┌─────────┐   确认完成    ┌─────────┐
│  (null) │ ──────────────► │  draft  │ ───────────► │analyzing│ ───────────► │confirmed│
└─────────┘                 └─────────┘              └─────────┘              └─────────┘
                                  ▲                      │
                                  │                      │
                                  └──────────────────────┘
                                        重新分析
```

---

## Data Integrity Rules

1. **Account Protection**: 被Scenario引用的Account不可删除（或标记为inactive）
2. **Cascade Delete**: Scenario删除时，级联删除其AccountMapping、JournalRule、Conversation、SampleTransaction、FlowchartData
3. **Unique Constraints**: Account.code全局唯一，User.username全局唯一
4. **JSONB Validation**: 应用层使用Zod验证JSONB结构

---

## Drizzle Schema (TypeScript)

```typescript
// server/db/schema.ts
import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, integer, decimal, pgEnum } from 'drizzle-orm/pg-core'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'product'])
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense'])
export const accountStatusEnum = pgEnum('account_status', ['active', 'inactive'])
export const scenarioStatusEnum = pgEnum('scenario_status', ['draft', 'analyzing', 'confirmed'])
export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'completed', 'error'])

// Tables
export const company = pgTable('company', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  industry: varchar('industry', { length: 50 }),
  accountingStd: varchar('accounting_std', { length: 20 }).default('企业会计准则'),
  currency: varchar('currency', { length: 3 }).default('CNY'),
  notes: jsonb('notes').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ... (其他表定义类似)
```

---

**Phase 1 Complete**: Data model ready for implementation.
