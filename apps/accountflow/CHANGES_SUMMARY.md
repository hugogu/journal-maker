# 数据库架构优化 - 变更总结

## 📅 日期
2026-02-06

## 🎯 目标
将数据库从 JSONB 存储方案迁移到规范化表结构，提升数据完整性、查询性能和扩展能力。

## ✅ 已完成工作

### 1. 数据库Schema优化

#### 删除的表
- ❌ `conversations` - 被 `conversation_messages` 替代
- ❌ `confirmed_analysis` - 被规范化表替代（`analysis_subjects`, `analysis_entries`, `analysis_diagrams`）
- ❌ `flowchart_data` - 被 `analysis_diagrams` 替代
- ❌ `account_mappings` - 未使用，已删除
- ❌ `ai_configs` - 被 `ai_providers` 替代

#### 新增的表
- ✅ `analysis_subjects` - 会计科目的规范化存储
  - 支持 `is_confirmed` 标记
  - 关联 `source_message_id` 追踪来源
  - 可选关联 `account_id` 映射到实际账户
  - 完整的索引优化

- ✅ `analysis_entries` - 会计分录/规则的规范化存储
  - `entry_id` 唯一标识
  - `lines` JSONB 存储借贷方明细
  - 支持多借多贷
  - 条件存储在 `metadata.condition`

- ✅ `analysis_diagrams` - 图表和流程图的规范化存储
  - 支持 `mermaid`, `chart`, `table` 三种类型
  - `payload` JSONB 存储图表数据
  - 灵活的元数据支持

#### 改进的约束
- ✅ 添加 `accounts.parent_id` 外键约束（自引用）
- ✅ 所有新表都有 `CASCADE DELETE` 级联删除
- ✅ 唯一约束：`scenario_id + code`, `scenario_id + entry_id`
- ✅ 完整的索引覆盖（scenario_id, source_message_id, is_confirmed 等）

#### 完善的注释
- ✅ 所有表都有详细的表注释（COMMENT ON TABLE）
- ✅ 关键列都有列注释（COMMENT ON COLUMN）
- ✅ 说明字段用途、数据格式、业务含义

### 2. TypeScript类型定义优化

#### 新增类型（`src/types/index.ts`）
```typescript
// Journal Entry 结构（debit_side/credit_side）
- JournalEntryLine      // 单个分录行
- JournalEntrySide      // 借方/贷方集合

// 分析表对应类型
- AnalysisSubject       // 数据库表类型
- AnalysisEntry         // 数据库表类型
- AnalysisEntryLine     // lines 字段类型
- AnalysisDiagram       // 数据库表类型

// UI 兼容类型（保持现有组件不变）
- AccountingSubject     // UI 简化版
- AccountingRule        // UI 简化版
- ConfirmedAnalysis     // 聚合类型
```

#### 明确的结构定义
```typescript
// journal_rules.debit_side / credit_side 结构
{
  entries: [{
    accountCode: string
    accountId?: number
    amountFormula?: string
    description?: string
  }]
}

// analysis_entries.lines 结构
[{
  side: 'debit' | 'credit'
  accountCode: string
  amount?: number
  description?: string
}]
```

### 3. 数据访问层（DAL）

#### 新建文件：`src/server/db/queries/analysis.ts`
提供完整的CRUD操作：

**Subjects操作**
- `getAnalysisSubjects()` - 获取科目列表（支持仅查confirmed）
- `saveAnalysisSubjects()` - 批量保存/更新科目（upsert）
- `confirmAnalysisSubjects()` - 确认所有科目
- `deleteAnalysisSubjects()` - 删除场景的所有科目

**Entries操作**
- `getAnalysisEntries()` - 获取分录列表
- `saveAnalysisEntries()` - 批量保存/更新分录
- `confirmAnalysisEntries()` - 确认所有分录
- `deleteAnalysisEntries()` - 删除场景的所有分录

**Diagrams操作**
- `getAnalysisDiagrams()` - 获取图表列表
- `saveAnalysisDiagram()` - 保存单个图表
- `confirmAnalysisDiagrams()` - 确认所有图表
- `deleteAnalysisDiagrams()` - 删除场景的所有图表

**聚合操作**
- `getConfirmedAnalysis()` - 获取已确认的所有分析结果（聚合）
- `saveAndConfirmAnalysis()` - 一次性保存并确认所有数据
- `clearConfirmedAnalysis()` - 清空场景的所有确认数据

#### 更新文件：`src/server/db/queries/confirmed-analysis.ts`
改为向后兼容层，委托给新的 `analysis.ts`：
- 保持原有API签名不变
- 内部调用新的规范化存储函数
- API endpoints 无需修改

### 4. Migration文件

#### 创建：`src/server/db/migrations/0000_init.sql`
- 合并所有migration为单一初始化SQL
- 包含完整的表定义、约束、索引、注释
- 总计约 600+ 行，完整记录所有结构

#### 备份：`src/server/db/migrations.backup/`
- 保留旧migration文件作为参考
- 不影响新系统运行

### 5. 文档

#### 创建：`DATABASE_MIGRATION_GUIDE.md`
完整的迁移指南，包含：
- 迁移步骤（Step-by-step）
- 验证检查清单
- 新数据结构示例
- 故障排除FAQ
- 后续优化建议

#### 创建：`MIGRATION_QUICKSTART.md`
快速开始指南，5分钟完成迁移

#### 创建：`CHANGES_SUMMARY.md`（本文件）
变更总结和技术细节

## 🔄 向后兼容性

### API接口
✅ **完全兼容** - 所有现有API endpoints保持不变
- `GET /api/scenarios/[id]/confirmed-analysis`
- `POST /api/scenarios/[id]/confirmed-analysis`
- `DELETE /api/scenarios/[id]/confirmed-analysis`

### 前端组件
✅ **无需修改** - UI组件继续使用相同的数据格式
- `useConfirmedAnalysis` composable 无需修改
- `StatePane.vue` 等组件无需修改
- `ConfirmAnalysisButton.vue` 无需修改

### 数据格式
✅ **透明转换** - DAL层自动转换
- UI使用 `AccountingSubject[]` 和 `AccountingRule[]`
- 数据库使用规范化表
- 转换逻辑在 `queries/analysis.ts` 的 `getConfirmedAnalysis()`

## 🎁 新增能力

### 1. 强数据关联
```sql
-- 可以查询使用了特定科目的所有场景
SELECT DISTINCT scenario_id
FROM analysis_subjects
WHERE account_id = 1001;

-- 可以追踪科目的来源消息
SELECT s.code, s.name, m.content
FROM analysis_subjects s
JOIN conversation_messages m ON s.source_message_id = m.id
WHERE s.scenario_id = 1;
```

### 2. 灵活查询
```sql
-- 只查询已确认的科目
SELECT * FROM analysis_subjects
WHERE scenario_id = 1 AND is_confirmed = true;

-- 查询特定方向的科目
SELECT * FROM analysis_subjects
WHERE direction = 'debit' AND is_confirmed = true;

-- 统计分析
SELECT direction, COUNT(*)
FROM analysis_subjects
WHERE is_confirmed = true
GROUP BY direction;
```

### 3. 增量更新
```typescript
// 旧方案：每次覆盖整个JSONB
await db.update(confirmedAnalysis)
  .set({ subjects: [...allSubjects] })  // 全量替换

// 新方案：单独更新某个科目
await db.update(analysisSubjects)
  .set({ name: '新名称' })
  .where(eq(analysisSubjects.id, 123))  // 只更新一行
```

### 4. 数据完整性
- ✅ 外键约束防止孤儿记录
- ✅ 唯一约束防止重复
- ✅ CASCADE DELETE 自动清理关联数据
- ✅ 类型约束（ENUM）保证数据有效性

## 📊 性能优化

### 索引覆盖
```sql
-- 所有常用查询都有索引支持
CREATE INDEX idx_analysis_subjects_scenario_id ON analysis_subjects(scenario_id);
CREATE INDEX idx_analysis_subjects_is_confirmed ON analysis_subjects(is_confirmed);
CREATE INDEX idx_analysis_subjects_code ON analysis_subjects(code);
CREATE INDEX idx_analysis_subjects_account_id ON analysis_subjects(account_id);
```

### 查询性能对比
| 操作 | 旧方案 (JSONB) | 新方案 (规范化) |
|------|---------------|----------------|
| 查询单个场景的科目 | 扫描JSONB | 索引查询 ✅ |
| 统计科目使用次数 | 全表扫描 | 聚合查询 ✅ |
| 查找使用特定科目的场景 | 不支持 | JOIN查询 ✅ |
| 更新单个科目 | 更新整个JSONB | 更新单行 ✅ |

## 🚧 未完成工作（Phase 2）

### 会计事项（Business Events）
- ⏳ 创建 `business_events` 表
- ⏳ `journal_rules` 关联到 `business_event_id`
- ⏳ AI prompt 支持事项识别
- ⏳ UI 显示事项+规则层级

### 自动映射
- ⏳ 实现 `analysis_subjects.account_id` 自动映射逻辑
- ⏳ 基于科目代码智能匹配 `accounts` 表

### 规则引擎
- ⏳ 实现 `conditions` 匹配引擎
- ⏳ 支持复杂条件表达式
- ⏳ 规则模板系统

## 📝 迁移检查清单

开发者执行迁移前请确认：

- [ ] 已阅读 `DATABASE_MIGRATION_GUIDE.md`
- [ ] 已备份重要测试数据（如需要）
- [ ] 已停止所有服务
- [ ] 已删除旧数据库
- [ ] 已运行 `npm run db:migrate`
- [ ] 已初始化 prompts（`npm run db:seed`）
- [ ] 已验证新表结构（`npm run db:studio`）
- [ ] 已测试创建场景功能
- [ ] 已测试AI对话功能
- [ ] 已测试确认分析功能
- [ ] 已检查右侧面板显示

## 🎯 成功标准

迁移成功的标志：
1. ✅ 数据库包含17个表（不含meta表）
2. ✅ `analysis_subjects`, `analysis_entries`, `analysis_diagrams` 表存在
3. ✅ 所有外键约束生效
4. ✅ 创建场景 → AI对话 → 确认分析 → 显示结果 流程完整
5. ✅ 右侧面板正确显示科目和规则
6. ✅ 无TypeScript编译错误
7. ✅ 无运行时错误

## 📞 联系方式

如有问题，请检查以下文件：
- 迁移指南：`DATABASE_MIGRATION_GUIDE.md`
- Schema定义：`src/server/db/schema.ts`
- 数据访问层：`src/server/db/queries/analysis.ts`
- 类型定义：`src/types/index.ts`
- Migration SQL：`src/server/db/migrations/0000_init.sql`

---

**变更日期**: 2026-02-06
**版本**: 1.0.0
**影响范围**: 数据库、类型定义、数据访问层
**破坏性变更**: 是（数据库结构完全重建）
**API兼容性**: 完全兼容
**UI兼容性**: 完全兼容
