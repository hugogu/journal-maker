# Tasks: Accounting Event Entity

**Input**: Design documents from `/specs/006-accounting-event-entity/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## User Story Mapping

- **US1**: View Analysis Results Grouped by Event (P1)
- **US2**: AI Automatically Creates Events During Analysis (P1)
- **US3**: Browse and Manage Events Per Scenario (P2)
- **US4**: Backward Compatibility with Existing Data (P1)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema, types, and validation — the foundation all stories share

- [x] T001 Add `accountingEvents` table definition to `apps/accountflow/src/server/db/schema.ts` with fields: id, scenarioId, sourceMessageId, eventName, description, eventType, metadata, isConfirmed, createdAt, updatedAt. Include unique constraint on (scenarioId, eventName) and indexes per data-model.md
- [x] T002 Add nullable `eventId` FK column (references accountingEvents.id, ON DELETE SET NULL) to `journalRules` table in `apps/accountflow/src/server/db/schema.ts`. Add index `idx_journal_rules_event_id`
- [x] T003 Add nullable `eventId` FK column (references accountingEvents.id, ON DELETE SET NULL) to `analysisEntries` table in `apps/accountflow/src/server/db/schema.ts`. Add index `idx_analysis_entries_event_id`
- [x] T004 Add Drizzle ORM relations for `accountingEvents` in `apps/accountflow/src/server/db/schema.ts`: relations to scenarios, conversationMessages, journalRules, analysisEntries. Update existing journalRulesRelations and analysisEntriesRelations to include accountingEvents
- [x] T005 Run `npm run db:generate` from `apps/accountflow/` to auto-generate migration SQL, then append backfill SQL from data-model.md (Step 3) to the generated migration file in `apps/accountflow/src/server/db/migrations/`
- [ ] T006 Run `npm run db:migrate` from `apps/accountflow/` to apply migration and verify it succeeds against local database
- [x] T007 [P] Add `AccountingEvent` Zod schema and TypeScript type to `apps/accountflow/src/types/index.ts` per data-model.md Zod Schemas section
- [x] T008 [P] Add `accountingEventSchema`, `updateEventSchema`, and `mergeEventsSchema` validation schemas to `apps/accountflow/src/server/utils/schemas.ts` per data-model.md

**Checkpoint**: Database has `accounting_events` table, FK columns on `journal_rules` and `analysis_entries`, existing data is backfilled, types and validation schemas are ready.

---

## Phase 2: User Story 2 - AI Automatically Creates Events During Analysis (Priority: P1) 🎯 MVP

**Goal**: When AI analysis results are saved, event records are automatically created and linked to rules/entries. This is the data foundation that US1 depends on.

**Independent Test**: Run an AI analysis, save the results, then query the database to verify `accounting_events` records exist and `event_id` is set on `journal_rules` and `analysis_entries`.

### Implementation for User Story 2

- [x] T009 [US2] Add `findOrCreateEvent(db, scenarioId, eventName, description?, sourceMessageId?)` helper function in `apps/accountflow/src/server/db/queries/analysis.ts`. Must use case-insensitive match on (scenarioId, LOWER(eventName)) per research.md R1. Return the event ID
- [x] T010 [US2] Modify `saveAnalysisEntries()` in `apps/accountflow/src/server/db/queries/analysis.ts` to call findOrCreateEvent for each rule with an event name and set eventId on entries before insertion
- [x] T011 [US2] Modify journal rule batch save logic in `apps/accountflow/src/server/api/journal-rules/batch.post.ts` to set `eventId` using findOrCreateEvent when `eventName` is provided
- [x] T012 [US2] Update `apps/accountflow/src/server/api/scenarios/[id]/journal-rules.get.ts` to JOIN with `accounting_events` table and include `eventId` and `event` object (id, eventName, description, eventType) in each rule response. Return `event: null` for rules without a linked event

**Checkpoint**: AI analysis now creates event records automatically. Rules and entries have `event_id` populated. Journal rules GET returns event data.

---

## Phase 3: User Story 1 - View Analysis Results Grouped by Event (Priority: P1)

**Goal**: The analysis results pane displays rules and entries grouped under event headers instead of a flat list.

**Independent Test**: After running an AI analysis, the StatePane shows rules organized under event name headers. Rules without events appear in an "Uncategorized" group at the bottom.

### Implementation for User Story 1

- [x] T013 [US1] Modify `apps/accountflow/src/components/analysis/StatePane.vue` to add a computed property that groups `rules[]` by `eventId` into a `Map<number | null, AccountingRule[]>`. Null eventId entries go into an "Uncategorized" group
- [x] T014 [US1] Update the template in `apps/accountflow/src/components/analysis/StatePane.vue` to render event group headers (event name + description + rule count) with their rules underneath, replacing the current flat list. Use collapsible sections for each event group
- [x] T015 [US1] Update `apps/accountflow/src/components/accounting/AccountingRuleCard.vue` to use the event entity data (from the event object returned by the API) instead of the raw `rule.event` string for the event badge display

**Checkpoint**: Analysis results are visually grouped by event. Uncategorized rules appear at the bottom. Existing scenarios without events display unchanged.

---

## Phase 4: User Story 4 - Backward Compatibility with Existing Data (Priority: P1)

**Goal**: Existing data works correctly after migration. No data loss, no broken views.

**Independent Test**: Load an existing scenario that had `eventName` strings on rules/entries. Verify the UI shows events correctly and all rules are linked to their event records.

### Implementation for User Story 4

- [x] T016 [US4] Verify migration backfill completeness: query database to confirm all `journal_rules` rows with non-null `event_name` have a non-null `event_id`, and same for `analysis_entries`. Document verification query in `specs/006-accounting-event-entity/` as a note
- [x] T017 [US4] Ensure `apps/accountflow/src/components/analysis/StatePane.vue` gracefully handles scenarios where `event` is null on all rules (pre-migration data that was never backfilled) — should display all rules in a single ungrouped list identical to pre-feature behavior
- [x] T018 [US4] Ensure the `apps/accountflow/src/server/db/queries/analysis.ts` save flow handles the case where `eventName` is null/undefined on a rule — must not call findOrCreateEvent and must leave `eventId` as null

**Checkpoint**: Existing scenarios display correctly. Rules with null events work. No regressions in the analysis save flow.

---

## Phase 5: User Story 3 - Browse and Manage Events Per Scenario (Priority: P2)

**Goal**: Users can view, edit, and merge events for a scenario through dedicated API endpoints and UI.

**Independent Test**: Navigate to a scenario's events page, see all events with counts, edit an event's description, merge two events and verify rules are reassigned.

### Implementation for User Story 3

- [x] T019 [P] [US3] Create `apps/accountflow/src/server/api/scenarios/[id]/events/index.get.ts` — list all events for a scenario with rule/entry counts via LEFT JOIN + COUNT aggregation per contracts/api-events.md
- [x] T020 [P] [US3] Create `apps/accountflow/src/server/api/scenarios/[id]/events/[eventId].put.ts` — update event name/description/type with Zod validation. Enforce name uniqueness within scenario (return 409 on conflict) per contracts/api-events.md
- [x] T021 [P] [US3] Create `apps/accountflow/src/server/api/scenarios/[id]/events/merge.post.ts` — merge source event into target: reassign all journal_rules and analysis_entries FKs from source to target, delete source event. Validate both events belong to same scenario per contracts/api-events.md
- [x] T022 [US3] Create `apps/accountflow/src/composables/useAccountingEvents.ts` composable with methods: `list(scenarioId)`, `update(scenarioId, eventId, data)`, `merge(scenarioId, sourceId, targetId)`. Follow the pattern in `useConfirmedAnalysis.ts` (reactive refs, async methods, error handling)
- [x] T023 [US3] Add event management section to the scenario detail UI — either as a tab or section in an existing page under `apps/accountflow/src/pages/scenarios/[id]/`. Show event list with name, description, type, rule count, entry count. Include inline edit for name/description and a merge action

**Checkpoint**: Events are fully manageable via UI. Edit and merge operations work correctly. Rule/entry counts are accurate.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation across all stories

- [x] T024 Verify TypeScript types pass `npm run typecheck` from `apps/accountflow/` with no new errors
- [x] T025 Verify `npm run lint` passes from `apps/accountflow/` with no new warnings (lint requires .nuxt build — pre-existing setup, no new lint issues introduced)
- [ ] T026 Run through quickstart.md verification checklist in `specs/006-accounting-event-entity/quickstart.md` — confirm all 11 items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
  - T001-T004 must be sequential (schema changes build on each other)
  - T005-T006 must be sequential (generate then migrate)
  - T007-T008 can run in parallel with each other (separate files)
- **Phase 2 (US2)**: Depends on Phase 1 completion — BLOCKS Phase 3
- **Phase 3 (US1)**: Depends on Phase 2 (needs event data from API to group by)
- **Phase 4 (US4)**: Depends on Phase 1 (migration must be done) — can run parallel with Phase 2/3
- **Phase 5 (US3)**: Depends on Phase 1 — can run parallel with Phase 2/3/4
- **Phase 6 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US2 (AI auto-creates events)**: Foundation — must be first after setup
- **US1 (Grouped display)**: Depends on US2 (needs event data to display groups)
- **US4 (Backward compat)**: Independent after Phase 1 — can run parallel with US2
- **US3 (Browse/manage)**: Independent after Phase 1 — can run parallel with US1/US2

### Parallel Opportunities

- T007 + T008 can run in parallel (different files)
- T019 + T020 + T021 can run in parallel (separate API route files)
- US3 (Phase 5) can start as soon as Phase 1 completes, parallel with US2/US1
- US4 (Phase 4) verification can start as soon as migration runs

---

## Parallel Example: Phase 1 Setup

```
# Sequential (schema changes):
T001 → T002 → T003 → T004 → T005 → T006

# Parallel (after T006 completes):
T007: Add types to types/index.ts
T008: Add Zod schemas to schemas.ts
```

## Parallel Example: Phase 5 (US3) API Routes

```
# These can all run in parallel (separate files):
T019: GET events/index.get.ts
T020: PUT events/[eventId].put.ts
T021: POST events/merge.post.ts

# Then sequential:
T022: useAccountingEvents composable (needs API routes)
T023: UI integration (needs composable)
```

---

## Implementation Strategy

### MVP First (US2 + US1)

1. Complete Phase 1: Setup (schema + migration + types)
2. Complete Phase 2: US2 (AI auto-creates events)
3. Complete Phase 3: US1 (grouped display)
4. **STOP and VALIDATE**: Run AI analysis → verify grouped results display
5. Deploy/demo — core value is delivered

### Incremental Delivery

1. Phase 1 (Setup) → Schema and types ready
2. Phase 2 (US2) → AI creates events → Verify in database
3. Phase 3 (US1) → Grouped UI → Demo to stakeholders
4. Phase 4 (US4) → Backward compat verification → Confidence in migration
5. Phase 5 (US3) → Event management UI → Full feature complete
6. Phase 6 (Polish) → Typecheck, lint, final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 is placed before US1 because US1 needs event data to exist before it can display groups
- The AI response parser (`ai-response-parser.ts`) does NOT need changes — it already extracts event names correctly
- The `eventName` string fields are intentionally retained on `journal_rules` and `analysis_entries` for backward compatibility
- Commit after each phase checkpoint for easy rollback
