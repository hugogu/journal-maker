# Quickstart: Accounting Event Entity

**Feature**: 006-accounting-event-entity
**Date**: 2026-02-06

## Implementation Order

Follow this sequence to minimize broken states during development:

### Phase 1: Data Layer (no UI changes yet)

1. **Add `accountingEvents` table to `schema.ts`**
   - New table definition with all fields from data-model.md
   - Add `eventId` nullable FK column to `journalRules` and `analysisEntries`
   - Add Drizzle relations for the new entity
   - Run `npm run db:generate` to create migration SQL

2. **Append backfill SQL to the generated migration**
   - Use the SQL from data-model.md Migration Step 3
   - Test with `npm run db:migrate` on a local database with existing data

3. **Add Zod schemas to `schemas.ts`**
   - `accountingEventSchema`, `updateEventSchema`, `mergeEventsSchema`
   - Add `AccountingEvent` type to `types/index.ts`

### Phase 2: Server-Side Logic

4. **Create event API routes**
   - `GET /api/scenarios/[id]/events/index.get.ts` — list with counts
   - `PUT /api/scenarios/[id]/events/[eventId].put.ts` — update
   - `POST /api/scenarios/[id]/events/merge.post.ts` — merge

5. **Modify analysis save flow** (`queries/analysis.ts`)
   - Add `findOrCreateEvent(scenarioId, eventName)` helper
   - Call it in `saveAndConfirmAnalysis()` before rule/entry insertion
   - Set `eventId` on rules and entries

6. **Modify journal-rules GET** to include event data via JOIN

### Phase 3: Frontend

7. **Create `useAccountingEvents` composable**
   - `list(scenarioId)`, `update(eventId, data)`, `merge(sourceId, targetId)`
   - Follow the `useConfirmedAnalysis` pattern

8. **Modify `StatePane.vue`** for event grouping
   - Add computed property to group rules by `eventId`
   - Render event header sections with collapsible groups
   - "Uncategorized" group for null eventId at bottom

9. **Update `AccountingRuleCard.vue`**
   - Use event entity data instead of raw `rule.event` string

### Phase 4: Testing & Polish

10. **Write tests**
    - Unit test: event upsert logic (find-or-create, case-insensitive matching)
    - Unit test: migration backfill correctness
    - Integration test: full analysis flow creates and links events

## Key Files to Modify

| File | Change Type | Effort |
|------|-------------|--------|
| `src/server/db/schema.ts` | ADD table + columns + relations | Medium |
| `src/server/db/migrations/` | NEW migration file | Medium |
| `src/server/db/queries/analysis.ts` | MODIFY save flow | Medium |
| `src/server/utils/schemas.ts` | ADD schemas | Low |
| `src/types/index.ts` | ADD type | Low |
| `src/server/api/scenarios/[id]/events/` | NEW (3 routes) | Medium |
| `src/server/api/scenarios/[id]/journal-rules.get.ts` | MODIFY response | Low |
| `src/composables/useAccountingEvents.ts` | NEW composable | Medium |
| `src/components/analysis/StatePane.vue` | MODIFY grouping | Medium |
| `src/components/accounting/AccountingRuleCard.vue` | MODIFY display | Low |
| `tests/accounting-events.test.ts` | NEW tests | Medium |

## Verification Checklist

- [ ] Migration creates `accounting_events` table and adds `event_id` columns
- [ ] Migration backfills existing `eventName` data into new table and links FKs
- [ ] Migration is reversible (rollback SQL works)
- [ ] `findOrCreateEvent` correctly deduplicates by case-insensitive name match
- [ ] AI analysis flow automatically creates events and links rules/entries
- [ ] StatePane groups rules under event headers
- [ ] Null-event rules appear in "Uncategorized" group
- [ ] Event list API returns correct rule/entry counts
- [ ] Event update API enforces name uniqueness within scenario
- [ ] Event merge reassigns all linked artifacts and deletes source
- [ ] Existing scenarios without events continue to work unchanged
