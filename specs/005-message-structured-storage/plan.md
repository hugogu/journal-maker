# Implementation Plan: 消息与结构化产出分离存储

**Branch**: `005-message-structured-storage` | **Date**: 2026-02-04 | **Spec**: [specs/005-message-structured-storage/spec.md](specs/005-message-structured-storage/spec.md)
**Input**: Feature specification from `/specs/005-message-structured-storage/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

从会话消息中分离保存文本与结构化产出，统一使用 `conversation_messages` 表作为消息存储；保存 `content` 与 `structuredData`/`requestLog`/`responseStats`，并把AI分析产生的科目、分录、图表单独提取成可追溯的分析产物；为 Journal Rules 增加可执行结构（借方/贷方 JSONB、触发类型、状态），保留人类可读的 `amountFormula` 作为说明但执行以结构化为准。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9 (Nuxt 3, Node.js 18+)  
**Primary Dependencies**: Nuxt 3, drizzle-orm, postgres, zod, mermaid, @tanstack/vue-table  
**Storage**: PostgreSQL 15+ (JSONB for AI conversation storage)  
**Testing**: Vitest, Playwright  
**Target Platform**: Web app (Nuxt server + browser clients)
**Project Type**: Web application (single Nuxt app with API routes)  
**Performance Goals**: Not specified; maintain interactive analysis response times for admin workflows  
**Constraints**: Docker Compose single-command startup; DB schema changes reversible; JSONB for flexible payloads  
**Scale/Scope**: Single app in `apps/accountflow` supporting scenario-based analysis

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ Lightweight Architecture: Use existing Nuxt app and existing DB; avoid new services or heavy abstractions.
- ✅ AI-Human Collaboration: Journal rules require explicit confirmation (status), AI outputs remain drafts until confirmed.
- ✅ Component Reusability: Data model changes are backend-focused; no UI duplication introduced.
- ✅ Visualization-First Communication: Analysis artifacts (rules, entries, diagrams) preserved for visualization workflows.
- ✅ Scenario-Centric Context: All stored messages and artifacts remain scoped to scenario IDs.

**Post-Design Check**: No new violations introduced by Phase 1 outputs.

## Project Structure

### Documentation (this feature)

```text
specs/005-message-structured-storage/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/accountflow/
├── src/
│   ├── components/
│   ├── composables/
│   ├── pages/
│   ├── layouts/
│   ├── server/
│   │   ├── api/
│   │   ├── db/
│   │   └── utils/
│   ├── types/
│   └── utils/
├── docker-compose.yml
├── nuxt.config.ts
└── package.json
```

**Structure Decision**: Single Nuxt web app with server API routes under `apps/accountflow/src/server`.

## Complexity Tracking

No constitution violations requiring justification.
