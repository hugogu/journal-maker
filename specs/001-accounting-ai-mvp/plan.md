# Implementation Plan: AI辅助会计规则分析工具 MVP

**Branch**: `001-accounting-ai-mvp` | **Date**: 2025-02-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-accounting-ai-mvp/spec.md`

## Summary

构建AI辅助的会计规则分析工具MVP。管理员配置AI服务、创建基准范例；产品用户通过AI对话分析新场景的会计分录设计。核心特性：共享科目管理、实时流程图可视化、自动示例交易生成、结构化导出。技术栈：Nuxt 3 + PostgreSQL + OpenAI API + Mermaid.js。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: Nuxt 3.15+, Vue 3.5+, drizzle-orm 0.30+, postgres 3.4+, OpenAI SDK 4.x, Mermaid 11.x, @tanstack/vue-table  
**Storage**: PostgreSQL 15+ (JSONB存储对话和流程图数据)  
**Testing**: Vitest (unit), Playwright (e2e), MSW (API mocking)  
**Target Platform**: Web (Chrome/Firefox/Safari latest 2 versions), Docker Linux  
**Project Type**: Web (single Nuxt app with API routes)  
**Performance Goals**: 首屏加载 <3s, AI响应流式展示 <500ms首字, 流程图渲染 <2s  
**Constraints**: Docker单命令启动 <3min, 无外部依赖(除AI API), 支持离线开发(模拟AI响应)  
**Scale/Scope**: 20并发用户, 单实例部署, 数据量<10GB(3年)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Plan Compliance | Notes |
|-----------|-------------|-----------------|-------|
| I. Lightweight Architecture | Docker Compose单命令启动, YAGNI, 可逆Schema变更 | ✅ PASS | 单Nuxt应用+Postgres容器, drizzle migrations |
| II. AI-Human Collaboration | 人工确认AI规则, Prompt版本化, 结构化输出 | ✅ PASS | 显式确认UI, Prompt模板版本字段, Zod解析AI响应 |
| III. Component Reusability | Vue组件域无关, 会计逻辑隔离composables, 无复制粘贴 | ✅ PASS | 通用组件库+accounting/目录专用composables |
| IV. Visualization-First | 流程图/表格/图表, 文本fallback | ✅ PASS | Mermaid流程图+TanStack Table, 降级显示原始JSON |
| V. Scenario-Centric | 场景绑定分析, 全局设置继承, 审计追踪 | ✅ PASS | Scenario上下文+Company全局配置+updated_by字段 |

**Constitution Check Result**: ✅ **ALL GATES PASS** - Proceed to Phase 0

---

## Constitution Re-Check (Post Phase 1)

*Completed after Phase 1 design: data model, API contracts, project structure*

| Principle | Design Compliance | Verification |
|-----------|-------------------|--------------|
| I. Lightweight | ✅ PASS | drizzle-orm (not Prisma), single Nuxt app, no microservices |
| II. AI-Human | ✅ PASS | SSE streaming for real-time, confirm endpoint, versioned prompt field |
| III. Reusability | ✅ PASS | components/ui/ vs components/accounting/ structure defined |
| IV. Visualization | ✅ PASS | FlowchartData entity, Mermaid integration planned |
| V. Scenario-Centric | ✅ PASS | Scenario table with status enum, company_id FK, audit fields |

**Phase 1 Result**: ✅ **DESIGN COMPLIES WITH ALL PRINCIPLES** - Ready for task generation

## Project Structure

### Documentation (this feature)

```text
specs/001-accounting-ai-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/accountflow/
├── nuxt.config.ts
├── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── src/
│   ├── components/          # Vue组件
│   │   ├── ui/             # 通用UI组件 (Button, Modal, Table)
│   │   ├── layout/         # 布局组件 (Sidebar, Header)
│   │   └── accounting/     # 会计专用组件 (AccountPicker, JournalEntryTable)
│   ├── composables/         # 可组合函数
│   │   ├── useAI.ts        # AI对话管理
│   │   ├── useAccounts.ts  # 科目CRUD
│   │   ├── useScenarios.ts # 场景管理
│   │   ├── useFlowchart.ts # 流程图数据转换
│   │   └── useLocalStorage.ts # 浏览器本地存储管理
│   ├── pages/              # Nuxt页面
│   │   ├── index.vue       # 首页/场景列表
│   │   ├── admin/
│   │   │   ├── ai-config.vue
│   │   │   └── accounts.vue
│   │   ├── scenarios/
│   │   │   ├── [id]/
│   │   │   │   ├── index.vue    # 场景详情（支持编辑描述）
│   │   │   │   └── analyze.vue  # AI分析页面（含localStorage持久化）
│   │   │   └── new.vue
│   │   └── accounts/
│   │       └── index.vue   # 科目管理(共享)
│   ├── server/             # Nuxt Server API
│   │   ├── api/
│   │   │   ├── accounts/
│   │   │   ├── scenarios/
│   │   │   ├── ai/
│   │   │   │   ├── chat.post.ts
│   │   │   │   ├── analyze.post.ts
│   │   │   │   └── generate-sample.post.ts
│   │   │   └── config/
│   │   └── db/             # 数据库
│   │       ├── schema.ts   # Drizzle schema
│   │       ├── migrations/
│   │       └── seed.ts
│   ├── types/              # TypeScript类型
│   │   ├── account.ts
│   │   ├── scenario.ts
│   │   ├── ai.ts
│   │   └── index.ts
│   └── utils/              # 工具函数
│       ├── ai-parser.ts    # AI响应解析
│       ├── flowchart.ts    # 流程图生成
│       └── export.ts       # 导出逻辑
└── tests/
    ├── unit/
    ├── e2e/
    └── fixtures/
```

**Structure Decision**: 采用单Nuxt应用架构，前后端同构。`src/components/ui/`存放通用组件，`src/components/accounting/`存放会计领域组件。Server API routes处理AI调用和数据库操作，避免暴露API密钥。Drizzle ORM用于类型安全的数据库操作。

## Complexity Tracking

> No Constitution violations. Architecture follows lightweight principle with single Nuxt app.

| Decision | Rationale |
|----------|-----------|
| Single Nuxt app (not separate frontend/backend) | Constitution I: 轻量化, 减少部署复杂度, 共享类型定义 |
| drizzle-orm (not raw postgres) | Constitution I: 轻量ORM, 类型安全, migration支持, 非 prohibited "heavy ORM" |
| Server API routes (not external API) | Constitution II: API密钥保密, Constitution I: 单应用架构 |
| Components split ui/ vs accounting/ | Constitution III: 复用通用组件, 隔离领域逻辑 |
