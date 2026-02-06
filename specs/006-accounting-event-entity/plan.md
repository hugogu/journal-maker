# Implementation Plan: Accounting Event Entity

**Branch**: `006-accounting-event-entity` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-accounting-event-entity/spec.md`

## Summary

Promote "accounting event" from a loose `eventName` varchar field on `journal_rules` and `analysis_entries` to a first-class domain entity with its own table. Add foreign key references, automatic event creation during AI analysis, UI grouping by event, a CRUD composable, and a data migration for existing records.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Nuxt 3, Vue 3, Drizzle ORM, Zod, OpenAI SDK
**Storage**: PostgreSQL 15+ via Drizzle ORM (`drizzle-orm` + `postgres` driver)
**Testing**: Vitest (unit, `*.test.ts`), Playwright (E2E, `*.spec.ts`)
**Target Platform**: Web application (SSR via Nuxt/Nitro)
**Project Type**: Full-stack web (single Nuxt app)
**Performance Goals**: Event grouping renders instantly; event upsert adds <100ms to analysis save
**Constraints**: Must be backward compatible with existing `eventName` string data; migration must be reversible
**Scale/Scope**: Dozens of scenarios, each with 3-15 events; single-tenant deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Lightweight Architecture | PASS | Single new table with minimal fields. No new libraries. Drizzle ORM (approved). Migration is reversible (add column + table, old fields retained). |
| II. AI-Human Collaboration | PASS | Events are AI-generated but user can edit/merge them. Rules still require confirmation. |
| III. Component Reusability | PASS | New composable (`useAccountingEvents`) follows existing pattern. Event grouping component is domain-agnostic (groups any items by a key). |
| IV. Visualization-First | PASS | Events improve visualization by adding grouping structure to flat rule lists. |
| V. Scenario-Centric | PASS | Events are scoped per-scenario. Audit trail via timestamps and sourceMessageId. |
| No microservices | PASS | All changes within existing Nuxt app API routes. |
| No ORM overhead | PASS | Using Drizzle ORM (lightweight, already in use). |
| Reversible schema changes | PASS | New table + new nullable FK columns. Old `eventName` fields retained. Rollback = drop new columns + table. |

**Gate result: PASS** — No violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-accounting-event-entity/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-events.md    # Event API endpoints
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/accountflow/src/
├── server/
│   ├── db/
│   │   ├── schema.ts                          # ADD: accountingEvents table + relations
│   │   ├── migrations/                        # ADD: new migration (table + FK columns + backfill)
│   │   └── queries/
│   │       └── analysis.ts                    # MODIFY: event upsert logic in save flow
│   ├── api/scenarios/[id]/
│   │   ├── events/
│   │   │   ├── index.get.ts                   # NEW: list events for scenario
│   │   │   └── [eventId].put.ts               # NEW: update event
│   │   ├── events/merge.post.ts               # NEW: merge two events
│   │   ├── analysis-artifacts.post.ts         # MODIFY: create/link events on save
│   │   └── journal-rules.get.ts               # MODIFY: include eventId in response
│   └── utils/
│       └── schemas.ts                         # ADD: event Zod schemas
├── composables/
│   └── useAccountingEvents.ts                 # NEW: event CRUD composable
├── components/
│   ├── analysis/
│   │   └── StatePane.vue                      # MODIFY: group rules by event
│   └── accounting/
│       └── AccountingRuleCard.vue             # MODIFY: show event badge from entity
├── types/
│   └── index.ts                               # ADD: AccountingEvent type
└── utils/
    └── ai-response-parser.ts                  # NO CHANGE (already extracts event names)

tests/
└── accounting-events.test.ts                  # NEW: event upsert and migration tests
```

## Complexity Tracking

> No constitution violations — this section is empty.
