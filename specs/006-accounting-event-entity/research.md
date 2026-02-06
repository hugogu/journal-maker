# Research: Accounting Event Entity

**Feature**: 006-accounting-event-entity
**Date**: 2026-02-06

## R1: Event Deduplication Strategy

**Decision**: Case-insensitive exact match on `(scenarioId, LOWER(eventName))`

**Rationale**: The AI response parser already normalizes event names. The existing `eventName` field on `journal_rules` uses exact matches for the `ruleKey` unique constraint. Case-insensitive matching handles trivial formatting differences (e.g., "payment received" vs "Payment Received") without introducing fuzzy-matching complexity.

**Alternatives considered**:
- Fuzzy matching (Levenshtein distance): Rejected — adds complexity, risk of false merges, and no proven need. Can be added later if data shows near-duplicates are a real problem.
- Exact case-sensitive match: Rejected — too brittle. AI may return "Payment Received" in one analysis and "payment received" in another.

## R2: Event-to-Rule Linking Mechanism

**Decision**: Add nullable `event_id` integer FK column to both `journal_rules` and `analysis_entries` tables. Retain existing `event_name` varchar fields.

**Rationale**:
- Nullable FK allows backward compatibility — existing rows without events remain valid.
- Retaining `event_name` string enables rollback and serves as denormalized cache for display (avoids JOIN in simple queries).
- Follows the same pattern as `account_id` on `analysis_subjects` (nullable FK to a master table).

**Alternatives considered**:
- Junction/bridge table: Rejected — overkill for a 1:N relationship. Events don't have many-to-many with rules.
- Replace `event_name` with only FK: Rejected — breaks backward compatibility and prevents rollback.

## R3: Event Upsert During AI Analysis Save

**Decision**: Implement find-or-create pattern in the analysis save flow (`saveAndConfirmAnalysis` in `queries/analysis.ts`).

**Rationale**: The current save flow already iterates over rules and entries. Adding an event upsert step before rule/entry insertion fits naturally. The upsert uses `(scenarioId, LOWER(eventName))` as the lookup key. This mirrors the existing upsert pattern used for `analysisSubjects`.

**Implementation approach**:
1. Extract unique event names from parsed rules/entries
2. For each unique event name: query existing → create if not found → return ID
3. Set `eventId` on each rule/entry before insertion
4. All within the existing transaction scope

## R4: Migration Strategy for Existing Data

**Decision**: Single Drizzle migration with 3 steps: (1) create `accounting_events` table, (2) add `event_id` columns, (3) backfill via SQL.

**Rationale**: Drizzle Kit generates migration SQL from schema diffs. The backfill SQL can be appended to the generated migration file. This keeps everything in one atomic migration that runs via `npm run db:migrate`.

**Backfill logic** (SQL):
1. `INSERT INTO accounting_events (scenario_id, event_name, ...) SELECT DISTINCT scenario_id, event_name FROM journal_rules WHERE event_name IS NOT NULL`
2. `UPDATE journal_rules SET event_id = (SELECT id FROM accounting_events WHERE ...)`
3. Same for `analysis_entries`

**Alternatives considered**:
- Separate seed script: Rejected — migration should be self-contained and run automatically.
- Application-level backfill on startup: Rejected — fragile, runs on every restart, hard to make idempotent reliably.

## R5: UI Grouping Approach

**Decision**: Group rules by `eventId` in StatePane.vue using a computed property. Events with no ID go into an "Uncategorized" group rendered last.

**Rationale**: The StatePane already renders a flat list of `AccountingRuleCard` components. Wrapping them in event groups requires a computed that transforms `rules[]` into `Map<eventId | null, rules[]>`. This is a pure frontend transformation — no API changes needed for grouping itself.

**Alternatives considered**:
- Server-side grouping in API response: Rejected — adds API complexity. The client already has all rules loaded; grouping is a trivial O(n) operation.
- Separate "events with rules" API: Rejected for P1 — may be useful later for the P2 event management page, but not needed for the primary analysis view.

## R6: Event Merge Implementation

**Decision**: Single API endpoint `POST /api/scenarios/:id/events/merge` that reassigns all FKs and deletes the source event.

**Rationale**: Merge is a P2 feature but needs upfront design to ensure the data model supports it. The operation is: (1) update all `journal_rules` where `event_id = sourceId` to `event_id = targetId`, (2) same for `analysis_entries`, (3) delete the source event record. Uses `ON DELETE SET NULL` FK constraint as safety net.

**Alternatives considered**:
- Soft-delete merged events: Rejected — adds ghost records. A clean delete after reassignment is simpler and the audit trail is maintained via rule timestamps.
