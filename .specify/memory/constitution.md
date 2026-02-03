# AccountFlow Constitution
<!--
  Sync Impact Report:
  Version change: N/A → 1.0.0
  Modified principles: New constitution (all new)
  Added sections: All sections (Core Principles, Technology Stack, Development Workflow, Governance)
  Removed sections: None
  Templates requiring updates: None (initial creation)
  Follow-up TODOs: None
-->

## Core Principles

### I. Lightweight Architecture (MUST)
Every component must justify its existence. Prefer proven libraries over custom implementations. Docker Compose single-command local deployment is mandatory. Database schema changes must be reversible. YAGNI applies to all features.

**Rationale**: The tool is meant for quick analysis sessions, not enterprise complexity. Over-engineering kills adoption.

### II. AI-Human Collaboration (MUST)
AI assists, humans decide. All AI-generated rules require explicit user confirmation before persistence. Prompts are versioned and auditable. AI responses must be structured (JSON/Tables) for machine parsing and visualization.

**Rationale**: Accounting rules are legally binding; AI provides draft, human owns final decision.

### III. Component Reusability (MUST)
Vue components must be domain-agnostic when possible. Accounting-specific logic isolated in composables. No copy-paste UI code across admin/product views. Shared科目 (account) management accessible to all roles.

**Rationale**: Two user roles share 80% of UI patterns. DRY reduces maintenance burden.

### IV. Visualization-First Communication (MUST)
Every analytical result requires visual representation: flowcharts for information/capital flow, tables for journal entries, graphs for relationships. Raw text only as fallback.

**Rationale**: Accounting concepts are abstract; visual representation reduces cognitive load and errors.

### V. Scenario-Centric Context (MUST)
Each analysis session binds to a specific business scenario. Global company settings inherited, scenario-specific overrides allowed. Complete audit trail: who, when, what changed in each scenario.

**Rationale**: Enables comparative analysis across scenarios and regulatory audit requirements.

## Technology Stack

### Mandatory Choices
- **Framework**: Nuxt 3 (Vue 3 + SSR/SSG flexibility)
- **Database**: PostgreSQL 15+ (JSONB for flexible AI conversation storage)
- **AI Integration**: OpenAI-compatible API (configurable endpoint + key)
- **Visualization**: Mermaid.js for flowcharts, TanStack Table for data grids
- **Deployment**: Docker + Docker Compose, single `docker-compose up` startup

### Prohibited Patterns
- No microservices (single Nuxt app with API routes)
- No ORM overhead (use `postgres` driver directly or lightweight `drizzle-orm`)
- No external auth (simple role-based, session in JWT or DB)
- No real-time WebSockets (polling sufficient for analysis sessions)

## Development Workflow

### Phase 0: Scenario Definition
Product user describes business scenario → System validates against existing科目 → AI asks clarifying questions → Structured scenario metadata stored.

### Phase 1: AI Analysis
Background AI session initiated automatically → Existing科目 + template rules provided as context → AI proposes科目 mappings and journal entries → Real-time flowchart generation → User iterates via chat interface.

### Phase 2: Rule Finalization
User confirms/modifies AI proposal → System generates sample transaction with full journal entries → Final rules persisted with version → Exportable formats (JSON, Excel, PDF report).

### Code Quality Gates
- TypeScript strict mode enabled
- Component props fully typed
- API routes validated with Zod schemas
- Database migrations tested on clean Postgres instance

## Governance

### Amendment Procedure
Constitution changes require: (1) Impact analysis on existing scenarios, (2) Version bump following semver, (3) Migration plan for in-flight analyses, (4) Documentation update in `.specify/templates/`.

### Versioning Policy
`MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes to data models or AI prompt contracts
- MINOR: New visualization types, additional export formats, new AI provider support
- PATCH: UI refinements, bug fixes, performance optimizations

### Compliance Review
Before each release: verify Docker compose works on fresh machine, verify AI prompts produce consistent structured output, verify科目 changes don't break existing scenario rules.

## 交互范式：双栏工作台 (Two-Pane Workbench)
- 系统核心界面必须采用**双栏布局**。
- **左侧 (Chat)**：负责自然语言交互、需求澄清和指令输入。
- **右侧 (State Dashboard)**：负责实时展示结构化的业务状态。右侧必须包含 Tabs：
  - **流程图 (Flow)**: 实时渲染 Mermaid 资金流图。
  - **规则预览 (Rules)**: 展示 AI 提取的结构化记账规则。
  - **科目映射 (Accounts)**: 展示当前场景涉及的科目。
- 禁止 AI 直接修改数据库中的确认状态。AI 的产出必须先在右侧作为"提案 (Proposal)"展示，经用户前端确认后才可持久化。

## 数据处理原则：结构化优先 (Structure-First)
- 禁止使用纯文本或 Regex 解析业务数据。
- **必须使用 OpenAI Function Calling (Tools) 配合 Zod Schema** 进行非结构化对话到结构化数据的转换。
- 后端 API (Nuxt Server) 必须作为 "Tools Provider"，为 AI 提供以下能力：
  - `query_accounts`: 获取现有科目表作为上下文。
  - `propose_journal_rule`: 提交规则草案。
  - `simulate_transaction`: 基于当前规则进行试算。

## 会计一致性约束
- 系统必须维护全局唯一的会计科目表 (Accounts Table)。
- AI 在分析新场景时，必须优先复用现有科目。
- 新增科目必须通过显式的 `AccountProposal` 流程，不能静默创建。

**Version**: 1.0.0 | **Ratified**: 2025-02-01 | **Last Amended**: 2025-02-01
