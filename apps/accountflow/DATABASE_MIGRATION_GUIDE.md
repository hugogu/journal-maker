# 数据库迁移指南

## 📋 概述

本次迁移将数据库架构从 **JSONB 存储方案** 升级到 **规范化表结构**，提供更好的数据完整性、查询性能和关联能力。

### 主要变更

1. **删除的表**
   - `conversations` (旧表，已被 `conversation_messages` 替代)
   - `confirmed_analysis` (JSONB 存储，已被规范化表替代)
   - `flowchart_data` (已被 `analysis_diagrams` 替代)
   - `account_mappings` (未使用)
   - `ai_configs` (已被 `ai_providers` 替代)

2. **新增的表**
   - `analysis_subjects` - 会计科目的规范化存储
   - `analysis_entries` - 会计分录/规则的规范化存储
   - `analysis_diagrams` - 图表和流程图的规范化存储

3. **改进的约束**
   - 添加了 `accounts.parent_id` 的外键约束
   - 所有分析表都有 `is_confirmed` 标记
   - 添加了完整的索引优化
   - 添加了详细的表和列注释

4. **明确的数据结构**
   - `journal_rules.debit_side` / `credit_side` 现在有明确的 `JournalEntrySide` 结构
   - `analysis_entries.lines` 使用 `AnalysisEntryLine[]` 结构

---

## 🚀 迁移步骤

### 前提条件

⚠️ **重要提示**: 本次迁移将 **清空所有现有数据**。由于服务尚未上线，这是可接受的。如果您有重要测试数据，请先备份。

### Step 1: 停止应用服务

```bash
cd /home/user/journal-maker/apps/accountflow

# 如果使用 Docker
docker-compose down

# 如果使用 npm dev
# Ctrl+C 停止开发服务器
```

### Step 2: 备份现有数据库（可选）

```bash
# 如果需要保留测试数据作为参考
pg_dump -h localhost -p 5432 -U postgres -d accountflow > backup_before_migration_$(date +%Y%m%d).sql
```

### Step 3: 删除旧数据库

```bash
# 方法 1: 使用 psql 命令
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE IF EXISTS accountflow;"
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE accountflow;"

# 方法 2: 使用 Docker Compose（如果数据库在容器中）
docker-compose down -v  # -v 参数会删除数据卷
```

### Step 4: 运行新的迁移

```bash
cd /home/user/journal-maker/apps/accountflow

# 生成新的迁移文件（基于当前 schema.ts）
npm run db:generate

# 应用迁移到数据库
npm run db:migrate
```

### Step 5: 初始化内置 Prompts（重要！）

新数据库需要初始化 AI Prompts，否则分析功能无法工作：

```bash
# 检查是否有 seed 脚本
npm run db:seed

# 如果没有自动 seed，手动插入内置 prompts
# 可以从旧备份中导出 prompt_templates 和 prompt_versions 表
```

### Step 6: 验证数据库

```bash
# 启动 Drizzle Studio 检查表结构
npm run db:studio

# 或使用 psql 检查
psql -h localhost -p 5432 -U postgres -d accountflow -c "\dt"
```

您应该看到以下表：
- ✅ `companies`
- ✅ `users`
- ✅ `accounts`
- ✅ `scenarios`
- ✅ `journal_rules`
- ✅ `sample_transactions`
- ✅ `conversation_messages`
- ✅ `conversation_shares`
- ✅ `analysis_subjects` ⭐ 新表
- ✅ `analysis_entries` ⭐ 新表
- ✅ `analysis_diagrams` ⭐ 新表
- ✅ `ai_providers`
- ✅ `ai_models`
- ✅ `prompt_templates`
- ✅ `prompt_versions`
- ✅ `company_profile`
- ✅ `user_preferences`

### Step 7: 启动应用

```bash
# 使用 Docker
docker-compose up -d

# 或使用 npm
npm run dev
```

### Step 8: 测试核心功能

1. **访问应用**: http://localhost:3000
2. **创建场景**: 测试场景创建功能
3. **AI 对话**: 测试 AI 分析功能
4. **确认分析**: 点击确认按钮，检查数据是否正确保存到 `analysis_subjects` 和 `analysis_entries` 表
5. **查看分析结果**: 右侧面板应该显示确认的科目和规则

---

## 🔍 验证检查清单

### 数据库结构检查

```sql
-- 检查 analysis_subjects 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'analysis_subjects'
ORDER BY ordinal_position;

-- 检查外键约束
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('analysis_subjects', 'analysis_entries', 'analysis_diagrams');

-- 检查索引
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('analysis_subjects', 'analysis_entries', 'analysis_diagrams')
ORDER BY tablename, indexname;
```

### API 接口检查

```bash
# 测试 GET confirmed analysis
curl http://localhost:3000/api/scenarios/1/confirmed-analysis

# 预期响应：
# {
#   "success": true,
#   "data": null  # 新数据库为空
# }
```

---

## 📊 新数据结构示例

### analysis_subjects 表

```json
{
  "id": 1,
  "scenario_id": 1,
  "source_message_id": 5,
  "code": "1001",
  "name": "库存现金",
  "direction": "debit",
  "description": "企业的库存现金",
  "account_id": null,
  "is_confirmed": true,
  "metadata": null,
  "created_at": "2026-02-06T10:00:00Z",
  "updated_at": "2026-02-06T10:00:00Z"
}
```

### analysis_entries 表

```json
{
  "id": 1,
  "scenario_id": 1,
  "source_message_id": 5,
  "entry_id": "R001",
  "description": "销售收款",
  "lines": [
    {
      "side": "debit",
      "accountCode": "1002",
      "description": "银行存款增加"
    },
    {
      "side": "credit",
      "accountCode": "2203",
      "description": "应收账款减少"
    }
  ],
  "amount": null,
  "currency": "CNY",
  "is_confirmed": true,
  "metadata": {
    "condition": "银行转账支付"
  },
  "created_at": "2026-02-06T10:00:00Z",
  "updated_at": "2026-02-06T10:00:00Z"
}
```

### analysis_diagrams 表

```json
{
  "id": 1,
  "scenario_id": 1,
  "source_message_id": 5,
  "diagram_type": "mermaid",
  "title": "销售流程图",
  "payload": {
    "mermaidCode": "graph LR\n  A[开始] --> B[收到订单]\n  B --> C[发货]\n  C --> D[收款]\n  D --> E[结束]"
  },
  "is_confirmed": true,
  "metadata": null,
  "created_at": "2026-02-06T10:00:00Z",
  "updated_at": "2026-02-06T10:00:00Z"
}
```

---

## 🔧 故障排除

### 问题 1: 迁移失败 - 表已存在

**错误信息**:
```
ERROR: relation "analysis_subjects" already exists
```

**解决方案**:
```bash
# 完全删除数据库重新创建
psql -h localhost -p 5432 -U postgres -c "DROP DATABASE accountflow;"
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE accountflow;"
npm run db:migrate
```

### 问题 2: 外键约束错误

**错误信息**:
```
ERROR: insert or update on table "analysis_subjects" violates foreign key constraint
```

**解决方案**:
确保先创建 `scenarios` 和 `conversation_messages` 表，再创建 `analysis_subjects` 表。迁移文件的顺序应该是正确的。

### 问题 3: AI 分析不工作

**症状**: 点击分析按钮没有响应

**解决方案**:
```bash
# 检查 prompt_templates 表是否有数据
psql -h localhost -p 5432 -U postgres -d accountflow -c "SELECT * FROM prompt_templates;"

# 如果为空，运行 seed 脚本或手动插入
npm run db:seed
```

### 问题 4: 确认分析后右侧面板为空

**症状**: 点击确认按钮后，右侧分析结果面板仍然为空

**排查步骤**:
```bash
# 1. 检查 analysis_subjects 表是否有数据
psql -h localhost -p 5432 -U postgres -d accountflow -c "SELECT * FROM analysis_subjects WHERE scenario_id = 1;"

# 2. 检查 is_confirmed 标志
psql -h localhost -p 5432 -U postgres -d accountflow -c "SELECT id, code, name, is_confirmed FROM analysis_subjects WHERE scenario_id = 1;"

# 3. 检查 API 响应
curl http://localhost:3000/api/scenarios/1/confirmed-analysis
```

---

## 📝 后续优化建议

### 立即可做（已完成）
- ✅ 删除不需要的表
- ✅ 添加外键约束
- ✅ 添加索引优化
- ✅ 明确 `debit_side` / `credit_side` 结构
- ✅ 完善表注释

### 未来考虑（Phase 2）
- ⏳ 引入 `business_events` 表（会计事项概念）
- ⏳ 实现事项模板功能
- ⏳ 添加规则条件匹配引擎
- ⏳ 实现 `analysis_subjects.account_id` 的自动映射

---

## 📞 支持

如有问题，请检查：
1. `/home/user/journal-maker/apps/accountflow/src/server/db/migrations/0000_init.sql` - 迁移文件
2. `/home/user/journal-maker/apps/accountflow/src/server/db/schema.ts` - Schema 定义
3. `/home/user/journal-maker/apps/accountflow/src/server/db/queries/analysis.ts` - 数据访问层

---

**迁移完成日期**: 2026-02-06
**版本**: 1.0.0
**兼容性**: 不向下兼容（全新数据库）
