# Data Model: 分析页面双栏布局重构

**Feature**: 004-analyze-dual-pane-layout
**Date**: 2026-02-04

## New Entities

### ConfirmedAnalysis（已确认分析）

存储用户确认后的分析结果，每个场景最多一条记录。

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | 主键 |
| scenarioId | INTEGER | NOT NULL, UNIQUE, FK → scenarios.id | 关联场景，一对一关系 |
| subjects | JSONB | NOT NULL, DEFAULT '[]' | 会计科目列表 |
| rules | JSONB | NOT NULL, DEFAULT '[]' | 会计规则列表 |
| diagramMermaid | TEXT | NULL | Mermaid 格式的流程图代码 |
| sourceMessageId | INTEGER | FK → conversation_messages.id | 来源消息 ID（用于追溯） |
| confirmedAt | TIMESTAMP | DEFAULT NOW() | 首次确认时间 |
| updatedAt | TIMESTAMP | DEFAULT NOW() | 最后更新时间 |

**Indexes**:
- `idx_confirmed_analysis_scenario_id` on `scenarioId` (UNIQUE constraint implicitly creates)

**Relations**:
- `scenario`: One-to-One with `scenarios`
- `sourceMessage`: Many-to-One with `conversation_messages` (optional)

### AccountingSubject（会计科目 - JSONB 结构）

嵌入在 `confirmedAnalysis.subjects` 数组中的结构。

```typescript
interface AccountingSubject {
  code: string           // 科目编号，如 "1001"
  name: string           // 科目名称，如 "库存现金"
  direction: 'debit' | 'credit'  // 借贷方向
  description?: string   // 可选说明
}
```

**Example**:
```json
[
  { "code": "1001", "name": "库存现金", "direction": "debit" },
  { "code": "1002", "name": "银行存款", "direction": "debit" },
  { "code": "2001", "name": "短期借款", "direction": "credit" }
]
```

### AccountingRule（会计规则 - JSONB 结构）

嵌入在 `confirmedAnalysis.rules` 数组中的结构。

```typescript
interface AccountingRule {
  id: string             // 规则标识，如 "RULE-001"
  description: string    // 规则描述
  condition?: string     // 适用条件（可选）
  debitAccount?: string  // 借方科目编号
  creditAccount?: string // 贷方科目编号
}
```

**Example**:
```json
[
  {
    "id": "RULE-001",
    "description": "收到客户货款时，借记银行存款，贷记应收账款",
    "condition": "收款确认后",
    "debitAccount": "1002",
    "creditAccount": "1131"
  }
]
```

## Drizzle Schema Extension

```typescript
// 添加到 schema.ts

export const confirmedAnalysis = pgTable('confirmed_analysis', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id')
    .notNull()
    .unique()
    .references(() => scenarios.id, { onDelete: 'cascade' }),
  subjects: jsonb('subjects').notNull().default([]),
  rules: jsonb('rules').notNull().default([]),
  diagramMermaid: text('diagram_mermaid'),
  sourceMessageId: integer('source_message_id')
    .references(() => conversationMessages.id, { onDelete: 'set null' }),
  confirmedAt: timestamp('confirmed_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const confirmedAnalysisRelations = relations(confirmedAnalysis, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [confirmedAnalysis.scenarioId],
    references: [scenarios.id],
  }),
  sourceMessage: one(conversationMessages, {
    fields: [confirmedAnalysis.sourceMessageId],
    references: [conversationMessages.id],
  }),
}))
```

## TypeScript Types

```typescript
// types/analysis.ts

export interface AccountingSubject {
  code: string
  name: string
  direction: 'debit' | 'credit'
  description?: string
}

export interface AccountingRule {
  id: string
  description: string
  condition?: string
  debitAccount?: string
  creditAccount?: string
}

export interface ConfirmedAnalysis {
  id: number
  scenarioId: number
  subjects: AccountingSubject[]
  rules: AccountingRule[]
  diagramMermaid: string | null
  sourceMessageId: number | null
  confirmedAt: Date
  updatedAt: Date
}

export interface ParsedAnalysis {
  subjects: AccountingSubject[]
  rules: AccountingRule[]
  diagrams: string[]  // mermaid code blocks
  rawContent: string
}
```

## Migration Script

```sql
-- Migration: 004_add_confirmed_analysis

CREATE TABLE confirmed_analysis (
  id SERIAL PRIMARY KEY,
  scenario_id INTEGER NOT NULL UNIQUE
    REFERENCES scenarios(id) ON DELETE CASCADE,
  subjects JSONB NOT NULL DEFAULT '[]',
  rules JSONB NOT NULL DEFAULT '[]',
  diagram_mermaid TEXT,
  source_message_id INTEGER
    REFERENCES conversation_messages(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE confirmed_analysis IS '用户确认的分析结果，每场景一条';
COMMENT ON COLUMN confirmed_analysis.subjects IS '会计科目列表 JSON 数组';
COMMENT ON COLUMN confirmed_analysis.rules IS '会计规则列表 JSON 数组';
COMMENT ON COLUMN confirmed_analysis.diagram_mermaid IS 'Mermaid 格式流程图代码';
```

## Validation Rules

### AccountingSubject
- `code`: 必填，1-20 字符，仅允许数字和字母
- `name`: 必填，1-100 字符
- `direction`: 必填，枚举值 'debit' | 'credit'
- `description`: 可选，最长 500 字符

### AccountingRule
- `id`: 必填，1-50 字符
- `description`: 必填，1-500 字符
- `condition`: 可选，最长 200 字符
- `debitAccount`/`creditAccount`: 可选，应为有效科目编号

### ConfirmedAnalysis
- 至少需要 `subjects` 或 `rules` 或 `diagramMermaid` 之一有内容
- `sourceMessageId` 引用的消息应属于同一场景

## State Transitions

```
[Empty] → [Confirmed] → [Updated] → [Cleared]
                ↑           │
                └───────────┘
```

| Transition | Trigger | Effect |
|------------|---------|--------|
| Empty → Confirmed | 首次点击确认 | 创建 confirmedAnalysis 记录 |
| Confirmed → Updated | 再次点击确认 | 更新现有记录（UPSERT） |
| * → Cleared | 点击清空 | 删除 confirmedAnalysis 记录 |
