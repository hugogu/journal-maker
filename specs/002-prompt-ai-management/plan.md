# Implementation Plan: Prompt版本化管理与AI服务增强

**Branch**: `002-prompt-ai-management` | **Date**: 2026-02-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-prompt-ai-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a comprehensive Prompt management system with version control, multi-AI Provider support with automatic model discovery, company profile management for AI context, conversation persistence with request logging and usage statistics, and session export/sharing capabilities. This enhances the existing AI analysis infrastructure to be more flexible, observable, and collaborative.

## Technical Context

**Language/Version**: TypeScript 5.x, Nuxt 3  
**Primary Dependencies**: drizzle-orm, OpenAI-compatible SDK, Vue 3  
**Storage**: PostgreSQL 15+ (JSONB for flexible storage)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Web application (Docker deployment)  
**Project Type**: Web (frontend + backend in single Nuxt app)  
**Performance Goals**: <500ms for message persistence, <1s for page load with conversation history  
**Constraints**: Single Nuxt app (no microservices), lightweight ORM, no external auth  
**Scale/Scope**: Personal/small team use, <10k conversations, <100 Prompt versions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Lightweight Architecture | ✓ PASS | Reuses existing infrastructure, no new services |
| II. AI-Human Collaboration | ✓ PASS | Prompt versioning aligns with human oversight requirement |
| III. Component Reusability | ✓ PASS | Admin UI components can reuse existing patterns |
| IV. Visualization-First | ✓ PASS | Request logs and statistics will be visualized |
| V. Scenario-Centric | ✓ PASS | Conversation persistence per scenario maintained |

**All gates passed** - Proceed with Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/002-prompt-ai-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/accountflow/
├── src/
│   ├── components/          # Vue components
│   │   ├── ui/             # Reusable UI (Button, Modal, Table, Editor)
│   │   ├── prompt/         # NEW: Prompt editor, version viewer, diff viewer
│   │   ├── ai-config/      # NEW: Provider config, model selector
│   │   └── conversation/   # NEW: Export button, share button, stats panel
│   ├── composables/         # Composables
│   │   ├── usePrompts.ts   # NEW: Prompt CRUD + versioning
│   │   ├── useAIProviders.ts # NEW: Multi-provider management
│   │   ├── useCompany.ts   # NEW: Company profile management
│   │   ├── useConversation.ts # Enhanced: Add export/share/stats
│   │   └── useLocalStorage.ts # To be deprecated (migrating to DB)
│   ├── pages/              # Nuxt pages
│   │   ├── admin/
│   │   │   ├── prompts/    # NEW: Prompt management pages
│   │   │   │   ├── index.vue    # Prompt list by scenario
│   │   │   │   ├── [id].vue     # Prompt editor with versioning
│   │   │   │   └── new.vue      # Create new Prompt
│   │   │   ├── ai-config.vue    # EXTENDED: Multi-provider support
│   │   │   └── company.vue     # NEW: Company profile settings
│   │   └── scenarios/
│   │       └── [id]/
│   │           └── analyze.vue  # EXTENDED: Provider selector, logs, stats
│   ├── server/             # Nuxt Server API
│   │   ├── api/
│   │   │   ├── prompts/    # NEW: Prompt template/version APIs
│   │   │   ├── ai-providers/ # NEW: Provider and model APIs
│   │   │   ├── company/    # NEW: Company profile API
│   │   │   ├── conversations/ # EXTENDED: Add messages DB persistence
│   │   │   └── shares/     # NEW: Share link generation and access
│   │   └── utils/
│   │       └── ai-service.ts    # EXTENDED: Multi-provider support
│   └── db/
│       └── schema.ts       # EXTENDED: New tables for Prompts, Providers, Shares
└── tests/
    ├── unit/               # Vitest tests
    └── e2e/                # Playwright tests
```

**Structure Decision**: Extends existing `apps/accountflow` structure. New features integrated into existing admin pages and scenario analysis flow. No new projects or services.

## Complexity Tracking

> No Constitution violations detected. All changes align with existing architecture.

