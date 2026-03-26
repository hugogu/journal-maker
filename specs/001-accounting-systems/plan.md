# Implementation Plan: Multi-Accounting System Support

**Branch**: `001-accounting-systems` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-accounting-systems/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement support for multiple accounting systems (体系) allowing different frameworks (Financial Reporting and Management Reporting) to coexist with independent accounts, journal rules, and preferences while sharing business scenarios. Built-in systems are pre-configured; custom systems can be added. Analysis results are system-specific with cross-system comparison capabilities.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: Nuxt 3 (Vue 3 + Nitro), Drizzle ORM, OpenAI SDK, Zod, TanStack Vue Table, Mermaid.js  
**Storage**: PostgreSQL 15+ (with Drizzle ORM)  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Web (modern browsers)  
**Project Type**: Web application (full-stack Nuxt 3)  
**Performance Goals**: <3 second system switch, <5 minute system setup  
**Constraints**: AI responses structured as JSON/tables, user confirmation required for rule persistence  
**Scale/Scope**: Hundreds of accounts per system, support for 2+ concurrent accounting frameworks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Lightweight Architecture ✓
- Uses existing Nuxt 3 + Drizzle ORM stack (no new infrastructure)
- Single app architecture maintained (no microservices)
- Database migrations reversible (standard Drizzle practice)

### Principle II: AI-Human Collaboration ✓
- AI generates system-specific rules; user confirms before persistence
- Prompts will include system context (accounts/rules specific to selected system)
- AI responses structured as JSON for journal entries and rules

### Principle III: Component Reusability ✓
- System selector component reusable across analysis and admin pages
- Account/rule management extends existing admin components
- Shared scenario context maintained (no duplication)

### Principle IV: Visualization-First ✓
- Side-by-side comparison uses visual diff highlighting
- System indicator prominently displayed in analysis view
- Cross-system differences shown in tables and flowcharts

### Principle V: Scenario-Centric Context ✓
- Business scenarios shared across all systems
- Analysis results tagged with system reference
- Audit trail maintained per scenario per system

**Constitution Compliance**: ALL PRINCIPLES SATISFIED

**No violations requiring justification**

## Project Structure

### Documentation (this feature)

```text
specs/001-accounting-systems/
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
│   │   ├── accounting/      # Accounting-specific components
│   │   ├── ai-config/       # AI configuration
│   │   ├── analysis/        # Analysis components
│   │   ├── conversation/    # Chat/conversation UI
│   │   ├── prompt/          # Prompt management
│   │   └── ui/              # Shared UI components
│   ├── composables/         # Vue 3 composables
│   ├── pages/               # Nuxt file-based routing
│   │   ├── scenarios/       # Scenario management
│   │   ├── admin/           # Admin pages (NEW: systems/)
│   │   ├── accounts/        # Account management
│   │   └── share/           # Sharing functionality
│   ├── server/
│   │   ├── api/             # Nuxt API routes
│   │   │   ├── systems/     # NEW: Accounting system endpoints
│   │   │   ├── accounts/    # Account management endpoints
│   │   │   └── rules/       # Journal rule endpoints
│   │   ├── db/
│   │   │   ├── schema.ts    # Drizzle ORM schema (NEW: systems table)
│   │   │   ├── queries/     # Database queries
│   │   │   └── migrations/  # Database migrations
│   │   └── utils/
│   │       ├── ai-adapters/ # AI provider implementations
│   │       └── schemas.ts   # Zod validation schemas
│   └── types/               # TypeScript type definitions
├── tests/
│   ├── unit/                # Vitest tests (*.test.ts)
│   └── e2e/                 # Playwright tests (*.spec.ts)
└── nuxt.config.ts           # Nuxt configuration
```

**Structure Decision**: Monorepo with single Nuxt 3 app at `apps/accountflow/`. Feature implementation spans:
- **Frontend**: New system selector component, system management pages, cross-system comparison view
- **Backend**: New API routes for system CRUD, schema updates for system relationships
- **Database**: New `systems` table, many-to-many relationships (systems_accounts, systems_rules)

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design completion*

### Principle I: Lightweight Architecture ✓
**Status**: SATISFIED
- No new infrastructure required (uses existing Nuxt/Drizzle/Postgres)
- Many-to-many junction tables are standard SQL pattern
- API endpoints follow existing Nuxt API route conventions
- Single database schema extension (4 new tables)

### Principle II: AI-Human Collaboration ✓
**Status**: SATISFIED
- `/api/systems/{systemId}/context` endpoint provides AI with system-specific accounts/rules
- Analysis endpoints include system_id for context-aware generation
- User confirmation flow unchanged (existing pattern applied per-system)
- Structured output maintained (journal entries as JSON)

### Principle III: Component Reusability ✓
**Status**: SATISFIED
- `SystemSelector` component designed as reusable across all pages
- Account/rule management extends existing admin components with system filter
- No copy-paste UI patterns identified
- Shared scenario components remain unchanged

### Principle IV: Visualization-First ✓
**Status**: SATISFIED
- Comparison API returns structured data for visual diff rendering
- Flowcharts included in comparison results (Mermaid.js)
- System indicator prominent in analysis view design
- Tables used for journal entry comparison (TanStack Table)

### Principle V: Scenario-Centric Context ✓
**Status**: SATISFIED
- Scenario table remains central (unchanged)
- Analysis entries reference both scenario and system (audit trail)
- Cross-system comparison API uses scenario as anchor point
- Complete audit: who, when, what system, what scenario

### Design Validation Summary

**All Constitution principles remain satisfied after detailed design.**

No design changes required. Proceeding to Phase 2 (Task Generation) is approved.

## Generated Artifacts

### Phase 0: Research
- ✅ `research.md` - Technical decisions documented, all NEEDS CLARIFICATION resolved

### Phase 1: Design
- ✅ `data-model.md` - Entity relationships, schema design, migration strategy
- ✅ `contracts/systems-api.yaml` - System CRUD API specification
- ✅ `contracts/analysis-api.yaml` - System-aware analysis API specification
- ✅ `contracts/comparison-api.yaml` - Cross-system comparison API specification
- ✅ `quickstart.md` - Developer setup and testing guide
- ✅ Agent context updated (opencode)

## Next Steps

Run `/speckit.tasks` to generate implementation tasks based on this plan.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified.**
