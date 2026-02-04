# Research: 分析页面双栏布局重构

**Feature**: 004-analyze-dual-pane-layout
**Date**: 2026-02-04
**Status**: Complete

## Research Tasks

### 1. AI 响应结构化数据提取策略

**Question**: 如何从 AI 的自然语言响应中可靠地提取会计科目、规则和 mermaid 流程图？

**Decision**: 采用混合策略：结构化标记 + 正则表达式解析

**Rationale**:
- AI 响应已包含 mermaid 代码块（```mermaid），可通过正则提取
- 会计科目和规则需要在 prompt 中要求 AI 以特定格式输出（JSON 或表格）
- 结合现有 `promptTemplates` 表，可版本化控制输出格式

**Alternatives Considered**:
1. ❌ 纯正则表达式：不可靠，AI 输出格式变化大
2. ❌ 二次 AI 调用解析：增加延迟和成本
3. ✅ Prompt 约束 + 宽松解析：平衡可靠性和用户体验

**Implementation Notes**:
```typescript
// 解析策略示例
interface ParsedAnalysis {
  subjects: AccountingSubject[]  // 从 JSON 或表格提取
  rules: AccountingRule[]        // 从 JSON 或表格提取
  diagrams: string[]             // mermaid 代码块
  rawContent: string             // 原始内容保留
}
```

### 2. 双栏布局响应式设计

**Question**: 如何在不同屏幕尺寸下保持良好的双栏布局体验？

**Decision**: 使用 TailwindCSS Grid + 响应式断点

**Rationale**:
- 桌面端（≥1024px）：左右双栏各 50%
- 平板端（768px-1024px）：左右双栏 60%/40%
- 移动端（<768px）：垂直堆叠，可切换 Tab 显示

**Implementation**:
```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
  <ChatPane class="lg:col-span-1 overflow-hidden" />
  <StatePane class="lg:col-span-1 overflow-hidden" />
</div>
```

**Alternatives Considered**:
1. ❌ Flexbox：对高度控制不如 Grid 直观
2. ✅ CSS Grid：天然支持独立滚动区域和响应式

### 3. 已确认分析数据持久化方案

**Question**: 如何存储用户确认的分析结果？

**Decision**: 新建 `confirmed_analysis` 表，每场景一条记录（覆盖更新）

**Rationale**:
- 符合 spec 中"确认操作会覆盖之前 StatePane 中的内容"的假设
- 简化数据模型，避免版本历史复杂性
- 可通过 `conversationMessages` 追溯分析过程

**Schema Design**:
```sql
CREATE TABLE confirmed_analysis (
  id SERIAL PRIMARY KEY,
  scenario_id INTEGER NOT NULL UNIQUE REFERENCES scenarios(id),
  subjects JSONB NOT NULL DEFAULT '[]',
  rules JSONB NOT NULL DEFAULT '[]',
  diagram_mermaid TEXT,
  source_message_id INTEGER REFERENCES conversation_messages(id),
  confirmed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Alternatives Considered**:
1. ❌ 存入 scenarios 表的 JSONB 字段：污染场景核心数据
2. ❌ 每次确认创建新记录：增加复杂性，不符合需求
3. ✅ 独立表 + UPSERT：语义清晰，操作简单

### 4. Mermaid 渲染复用

**Question**: 如何在 ChatPane 和 StatePane 中复用 Mermaid 渲染逻辑？

**Decision**: 提取为独立的 `FlowDiagramViewer.vue` 组件

**Rationale**:
- 现有 analyze.vue 中 Mermaid 初始化和渲染逻辑完整
- 提取为组件后可在多处复用
- 组件内部管理 mermaid 实例生命周期

**Implementation**:
```vue
<!-- FlowDiagramViewer.vue -->
<template>
  <div ref="container" class="mermaid-viewer"></div>
</template>

<script setup lang="ts">
defineProps<{
  mermaidCode: string
  containerId?: string
}>()
// 复用现有 renderMermaidDiagrams 逻辑
</script>
```

### 5. 确认按钮状态管理

**Question**: 确认按钮何时可用？如何防止重复确认？

**Decision**: 基于消息状态和解析结果控制按钮状态

**Rules**:
1. AI 响应流式传输中 → 按钮禁用
2. 最新 AI 响应无可提取内容 → 按钮禁用 + 提示
3. 最新 AI 响应有可提取内容 → 按钮可用
4. 点击确认后 → 按钮短暂禁用，显示成功反馈

**Implementation**:
```typescript
const canConfirm = computed(() => {
  if (streaming.value) return false
  if (!latestAssistantMessage.value) return false
  const parsed = parseAnalysis(latestAssistantMessage.value.content)
  return parsed.subjects.length > 0 || parsed.rules.length > 0 || parsed.diagrams.length > 0
})
```

## Summary

所有研究任务已完成，无遗留的 NEEDS CLARIFICATION。技术方案可行，与现有架构兼容。

| Task | Status | Key Decision |
|------|--------|--------------|
| AI 响应解析 | ✅ Done | Prompt 约束 + 宽松解析 |
| 双栏布局 | ✅ Done | CSS Grid + 响应式断点 |
| 数据持久化 | ✅ Done | 独立表 + UPSERT |
| Mermaid 复用 | ✅ Done | 提取为独立组件 |
| 确认按钮状态 | ✅ Done | 基于解析结果计算 |
