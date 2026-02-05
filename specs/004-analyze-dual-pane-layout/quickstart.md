# Quickstart: 分析页面双栏布局重构

**Feature**: 004-analyze-dual-pane-layout
**Prerequisites**: Node.js 18+, PostgreSQL 15+, pnpm

## 1. Database Migration

```bash
cd apps/accountflow

# Generate migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

## 2. Key Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/components/analysis/ChatPane.vue` | 左侧对话面板组件 |
| `src/components/analysis/StatePane.vue` | 右侧状态面板组件 |
| `src/components/analysis/AccountingSubjectList.vue` | 会计科目列表 |
| `src/components/analysis/AccountingRuleCard.vue` | 会计规则卡片 |
| `src/components/analysis/FlowDiagramViewer.vue` | Mermaid 流程图渲染 |
| `src/components/analysis/ConfirmAnalysisButton.vue` | 确认按钮 |
| `src/composables/useConfirmedAnalysis.ts` | 已确认分析状态管理 |
| `src/utils/ai-response-parser.ts` | AI 响应解析工具 |
| `src/server/api/scenarios/[id]/confirmed-analysis.get.ts` | GET 接口 |
| `src/server/api/scenarios/[id]/confirmed-analysis.post.ts` | POST 接口 |
| `src/server/api/scenarios/[id]/confirmed-analysis.delete.ts` | DELETE 接口 |
| `src/server/db/queries/confirmed-analysis.ts` | 数据库查询 |

### Modified Files

| File | Changes |
|------|---------|
| `src/server/db/schema.ts` | 添加 `confirmedAnalysis` 表定义 |
| `src/pages/scenarios/[id]/analyze.vue` | 重构为双栏布局，引入 ChatPane + StatePane |

## 3. Component Hierarchy

```
analyze.vue
├── ChatPane.vue
│   ├── MessageList (existing logic)
│   ├── ProviderModelSelector.vue
│   ├── ExportButton.vue
│   ├── ShareManager.vue
│   └── ConfirmAnalysisButton.vue
└── StatePane.vue
    ├── AccountingSubjectList.vue
    ├── AccountingRuleCard.vue
    ├── FlowDiagramViewer.vue
    └── ClearButton
```

## 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scenarios/:id/confirmed-analysis` | 获取已确认分析 |
| POST | `/api/scenarios/:id/confirmed-analysis` | 创建/更新确认 |
| DELETE | `/api/scenarios/:id/confirmed-analysis` | 清空确认 |

## 5. Development Workflow

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## 6. Testing Checklist

- [ ] 双栏布局在 ≥1024px 屏幕正确显示
- [ ] ChatPane 保留所有现有对话功能
- [ ] AI 响应完成后确认按钮可用
- [ ] 点击确认后 StatePane 更新显示
- [ ] 会计科目列表正确渲染
- [ ] 会计规则卡片正确渲染
- [ ] Mermaid 流程图正确渲染
- [ ] 清空按钮重置 StatePane
- [ ] 页面刷新后 StatePane 内容恢复
- [ ] 两栏独立滚动

## 7. Key Implementation Notes

### AI Response Parsing

AI 响应格式约定（需在 prompt 中指定）：

```markdown
## 会计科目
```json
[
  {"code": "1001", "name": "库存现金", "direction": "debit"},
  {"code": "1002", "name": "银行存款", "direction": "debit"}
]
```

## 会计规则
```json
[
  {"id": "RULE-001", "description": "收到现金时，借记库存现金"}
]
```

## 资金流程图
```mermaid
graph LR
  A[客户] -->|付款| B[银行存款]
```
```

### StatePane State Management

```typescript
// useConfirmedAnalysis.ts
const { data, loading, save, clear, refresh } = useConfirmedAnalysis(scenarioId)
```

### Confirm Button Logic

```typescript
const canConfirm = computed(() => {
  if (streaming.value) return false
  const parsed = parseLatestResponse()
  return parsed.hasContent
})
```
