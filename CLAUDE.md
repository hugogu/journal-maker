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

Core domain tables: `scenarios`, `accounts` (chart of accounts with hierarchy), `journal_rules`, `analysis_entries`, `analysis_subjects`, `analysis_diagrams`, `sample_transactions`.

AI/config tables: `ai_providers`, `ai_models`, `prompt_templates`, `prompt_versions`, `user_preferences`.

Conversation tables: `conversation_messages`, `conversation_shares`.

Key enums: `scenario_status` (draft/confirmed/archived), `account_type` (asset/liability/equity/revenue/expense), `provider_type` (openai/azure/ollama/custom), `prompt_scenario_type` (scenario_analysis/sample_generation/prompt_generation/flowchart_generation).

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
