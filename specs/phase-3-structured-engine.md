# Phase 3: 结构化分析与交互引擎实现

## 目标
实现 AI 对话内容的结构化提取，并构建 "Chat-to-State" 的实时交互闭环。

## 任务清单

### 1. 后端基础设施 (Server-side Infrastructure)
- **引入 Zod Schema**: 在 `apps/accountflow/src/server/utils/schemas.ts` 中定义 `JournalRuleSchema`, `AccountSchema`, `ScenarioContextSchema`。确保包含详细的 `describe` 以便生成高质量的 JSON Schema。
- **改造 Chat API**: 重构 `apps/accountflow/src/server/api/chat.post.ts`。
  - 实现动态 System Prompt 组装器，将数据库中的 `active accounts` 注入上下文。
  - 配置 OpenAI `tools` 参数，注册 `propose_journal_rule` 和 `update_flowchart` 工具。
  - 处理 `tool_calls` 响应，将其透传给前端，而不是直接执行数据库写操作。

### 2. 前端交互组件 (Frontend Interaction)
- **重构分析页面**: 将 `apps/accountflow/src/pages/scenarios/[id]/analyze.vue` 改造为左右分栏布局。
- **开发提案组件**:
  - 创建 `apps/accountflow/src/components/proposals/RuleProposalCard.vue`: 用于展示和编辑 AI 提取的记账规则草稿。
  - 创建 `apps/accountflow/src/components/visualizer/LiveFlowchart.vue`: 用于实时渲染 Mermaid 流程图。
- **状态同步**: 实现前端状态管理，当 Chat 组件接收到 `tool_calls` 数据时，自动更新右侧 Dashboard 的数据，并高亮显示变更部分。

### 3. 业务逻辑闭环
- 实现 "确认并保存" 接口：当用户在 UI 上点击确认 AI 的提案后，调用新的 API 端点将结构化数据写入 `journal_rules` 和 `flowchart_data` 表。

## 验收标准
1. 用户在对话框输入："用户支付 100 元，其中 1% 是手续费，剩余进入余额。"
2. 页面不刷新，右侧自动弹出规则确认卡片，显示借贷分录：借：银行存款 100；贷：用户余额 99，手续费支出 1。
3. 右侧流程图自动更新节点连接。
4. 用户点击确认后，数据库 `journal_rules` 表新增记录。
