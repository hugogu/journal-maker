# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Journal Maker (AccountFlow) is an AI-assisted accounting rule analysis tool. It analyzes business scenarios via AI to generate accounting journal entry rules and process flow diagrams. Built as a Nuxt 3 fullstack app with PostgreSQL.

## Repository Structure

Monorepo with a single app at `apps/accountflow/`. Source code lives under `apps/accountflow/src/` (configured via `srcDir: 'src/'` in nuxt.config.ts).

Key directories inside `src/`:
- `pages/` - Nuxt file-based routing (scenarios, admin, accounts, share)
- `components/` - Vue 3 components organized by domain (accounting, ai-config, analysis, conversation, prompt)
- `composables/` - Vue 3 composables for state and API logic
- `server/api/` - Nuxt API routes (file-based, maps to `/api/...`)
- `server/db/` - Drizzle ORM schema, migrations, queries, seed
- `server/utils/` - Server utilities including AI adapters, encryption, Zod schemas
- `server/utils/ai-adapters/` - Provider implementations (OpenAI, Azure, Ollama, custom) with factory pattern

Other top-level directories:
- `specs/` - Feature specifications (speckit format)
- `.specify/` - Speckit configuration, templates, and scripts
- `tests/` - Integration tests (referenced from vitest config via `../../tests/`)

## Development Commands

All commands run from `apps/accountflow/`:

```bash
npm run dev              # Start Nuxt dev server (localhost:3000)
npm run build            # Production build
npm run typecheck        # TypeScript checking (vue-tsc)
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier
npm run test             # Vitest unit tests (*.test.ts files only; *.spec.ts excluded for Playwright)
npm run test:e2e         # Playwright E2E tests
npm run db:generate      # Generate Drizzle migrations from schema changes
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database (tsx src/server/db/seed.ts)
npm run db:studio        # Drizzle Studio (interactive DB browser)
```

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript (strict), Tailwind CSS 3, TanStack Vue Table, Mermaid.js
- **Backend**: Nuxt API routes (Nitro), PostgreSQL 15+, Drizzle ORM, Zod validation
- **AI**: OpenAI SDK (`openai` package) with multi-provider support (OpenAI, Azure, Ollama, custom endpoints)
- **Testing**: Vitest (unit, `*.test.ts`), Playwright (E2E, `*.spec.ts`)
- **Database driver**: `postgres` (pure JS PostgreSQL driver)

## Architecture Principles (from Constitution)

- **Single Nuxt app** - no microservices. Backend is Nuxt API routes.
- **Drizzle ORM** - lightweight, SQL-first. No heavy ORM abstraction.
- **AI assists, humans decide** - all AI-generated rules require explicit user confirmation before persistence.
- **Visualization-first** - every analytical result needs visual representation (Mermaid flowcharts, tables for journal entries).
- **Scenario-centric** - each analysis session binds to a specific business scenario.

## Database

PostgreSQL with Drizzle ORM. Schema defined in `src/server/db/schema.ts`. Migrations in `src/server/db/migrations/`.

### Core Domain Tables

**Business Flow Tables:**
- `scenarios` - Business scenarios for analysis
- `accounts` - Chart of accounts with hierarchy (支持多体系)
- `accounting_systems` - 会计体系（如财务报表、管理报表）
- `system_accounts` - 科目与体系的关联表

**CRITICAL: Rules Storage Architecture (⚠️ 重要设计区分)**

有两个表存储规则/分录数据，但用途完全不同：

1. **`journal_rules`** - 可复用规则库（归一化存储）
   - **用途**: 用户手动创建或从AI分析中"保存"的规则
   - **场景**: 规则管理页面 `/journal-rules` 显示的内容
   - **生命周期**: 长期保存，可跨场景复用
   - **字段特点**: `debitSide`/`creditSide` (JSONB), `status` (proposal/confirmed), 支持公式计算
   - **体系关联**: 通过 `system_rules` 表关联到 `accounting_systems`

2. **`analysis_entries`** - AI分析结果归档（扁平化存储）
   - **用途**: 记录每次AI分析的结果快照
   - **场景**: 分析确认页面显示的内容
   - **生命周期**: 与特定消息绑定，仅供历史追溯
   - **字段特点**: `lines` (JSONB数组), `isConfirmed` (布尔), `systemId` (直接外键)
   - **写入时机**: 仅在"确认分析结果"时写入

**业务逻辑流程:**
```
AI分析生成规则
    ↓
显示在分析页面（临时状态）
    ↓
用户操作分支：
    ├─ "确认分析结果" → 保存到 analysis_entries（历史记录）
    └─ "保存到规则库" → 保存到 journal_rules（可复用规则）
```

**⚠️ 禁止双写**: 不要在确认分析时同时写入 journal_rules。两个表是独立的业务逻辑。

**其他分析相关表:**
- `analysis_subjects` - AI识别的会计科目
- `analysis_diagrams` - AI生成的流程图
- `sample_transactions` - 示例交易数据

### AI/Config Tables
- `ai_providers`, `ai_models` - AI供应商和模型配置
- `prompt_templates`, `prompt_versions` - 提示词模板管理
- `user_preferences` - 用户偏好设置

### Conversation Tables
- `conversation_messages` - AI对话消息历史
- `conversation_shares` - 对话分享功能

### Key Enums
- `scenario_status` (draft/confirmed/archived)
- `account_type` (asset/liability/equity/revenue/expense)
- `provider_type` (openai/azure/ollama/custom)
- `prompt_scenario_type` (scenario_analysis/sample_generation/prompt_generation/flowchart_generation)

## Environment Variables

Required in `apps/accountflow/.env` (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY`, `OPENAI_API_ENDPOINT`, `OPENAI_MODEL` - default AI config
- `AI_KEY_ENCRYPTION_SECRET` - 32-char key for encrypting stored provider API keys
- `MOCK_AI=true` - enables mock AI mode for development without API keys

## Commit Convention

`feat:`, `fix:`, `ux:`, `chore:`, `docs:`, `refactor:` prefixes.

## Speckit Integration

Feature planning uses speckit workflow: `/speckit.specify` -> `/speckit.clarify` -> `/speckit.plan` -> `/speckit.tasks` -> `/speckit.implement`. Specs stored in `specs/` with numbered directories (e.g., `001-accounting-ai-mvp/`). Templates in `.specify/templates/`.
