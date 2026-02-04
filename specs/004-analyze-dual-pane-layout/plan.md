# Implementation Plan: 分析页面双栏布局重构

**Branch**: `004-analyze-dual-pane-layout` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-analyze-dual-pane-layout/spec.md`

## Summary

将现有的 `analyze.vue` 单栏布局重构为左右双栏布局，左侧 ChatPane 保留实时 AI 对话分析功能，右侧 StatePane 显示用户确认后的会计科目、规则和资金/信息流程图。技术方案基于现有 Vue 3 + Nuxt 3 架构，复用 Mermaid.js 渲染逻辑，新增 `confirmedAnalysis` 表存储已确认分析结果。

## Technical Context

**Language/Version**: TypeScript 5.7+ / Vue 3.5+ / Nuxt 3.15+
**Primary Dependencies**: Vue 3, Nuxt 3, Mermaid.js 11.4+, TailwindCSS 3.4, Drizzle ORM 0.39+
**Storage**: PostgreSQL 15+ (existing Drizzle schema, need to extend)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Nuxt 3 monorepo structure)
**Performance Goals**: 页面加载 <1s, 确认操作 <3s, 流程图渲染成功率 >95%
**Constraints**: 现有 analyze.vue 功能 100% 保留, 双栏独立滚动
**Scale/Scope**: 单场景分析会话，5+ 会计科目，3+ 会计规则，1 流程图

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Lightweight Architecture | ✅ PASS | 复用现有组件，仅新增必要的 StatePane 组件和数据表 |
| II. AI-Human Collaboration | ✅ PASS | 核心功能：AI 分析需要用户明确确认才持久化到 StatePane |
| III. Component Reusability | ✅ PASS | ChatPane 和 StatePane 可独立复用，会计科目/规则渲染逻辑抽取为子组件 |
| IV. Visualization-First | ✅ PASS | StatePane 以可视化形式展示流程图、科目列表、规则卡片 |
| V. Scenario-Centric | ✅ PASS | 已确认分析结果绑定到具体场景，支持审计追溯 |

**Code Quality Gates**:
- TypeScript strict mode: ✅ 已启用
- Component props fully typed: ✅ 将遵循
- API routes validated with Zod: ✅ 已有 schemas.ts
- Database migrations tested: ✅ 将使用 drizzle-kit

## Project Structure

### Documentation (this feature)

```text
specs/004-analyze-dual-pane-layout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/accountflow/
├── src/
│   ├── components/
│   │   ├── analysis/                    # NEW: Analysis-specific components
│   │   │   ├── ChatPane.vue             # NEW: 左侧对话面板
│   │   │   ├── StatePane.vue            # NEW: 右侧状态面板
│   │   │   ├── AccountingSubjectList.vue # NEW: 会计科目列表渲染
│   │   │   ├── AccountingRuleCard.vue   # NEW: 会计规则卡片渲染
│   │   │   ├── FlowDiagramViewer.vue    # NEW: 流程图渲染组件
│   │   │   └── ConfirmAnalysisButton.vue # NEW: 确认按钮组件
│   │   ├── conversation/                 # EXISTING: 对话相关组件
│   │   │   ├── RequestLogViewer.vue
│   │   │   ├── ResponseStatsViewer.vue
│   │   │   ├── ExportButton.vue
│   │   │   └── ShareManager.vue
│   │   └── ai-config/
│   │       └── ProviderModelSelector.vue
│   ├── composables/
│   │   ├── useConversation.ts           # EXISTING: 对话管理
│   │   └── useConfirmedAnalysis.ts      # NEW: 已确认分析管理
│   ├── pages/
│   │   └── scenarios/
│   │       └── [id]/
│   │           └── analyze.vue          # MODIFY: 重构为双栏布局
│   ├── server/
│   │   ├── api/
│   │   │   └── scenarios/
│   │   │       └── [id]/
│   │   │           ├── confirmed-analysis.get.ts    # NEW
│   │   │           ├── confirmed-analysis.post.ts   # NEW
│   │   │           └── confirmed-analysis.delete.ts # NEW
│   │   └── db/
│   │       ├── schema.ts                # MODIFY: 添加 confirmedAnalysis 表
│   │       └── queries/
│   │           └── confirmed-analysis.ts # NEW
│   └── utils/
│       └── ai-response-parser.ts        # NEW: 从 AI 响应提取结构化数据
└── tests/
    ├── unit/
    │   └── ai-response-parser.spec.ts   # NEW
    └── e2e/
        └── analyze-dual-pane.spec.ts    # NEW
```

**Structure Decision**: 使用现有 Nuxt 3 应用结构，新组件放入 `components/analysis/` 目录，API 路由遵循现有 RESTful 模式。

## Complexity Tracking

> No constitution violations. All design decisions align with existing patterns.

| Decision | Rationale |
|----------|-----------|
| 新建 `components/analysis/` 目录 | 分析相关组件逻辑内聚，与现有 conversation 组件分离 |
| 复用 Mermaid 渲染逻辑 | 现有 analyze.vue 已有完整实现，提取为独立组件 |
| 新增 `confirmedAnalysis` 表 | 与 `conversationMessages` 分离，符合"分析过程" vs "分析结果"的语义区分 |
