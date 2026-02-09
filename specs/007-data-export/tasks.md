# Tasks: Data Export (Excel/CSV)

**Input**: Design documents from `/specs/007-data-export/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `apps/accountflow/`:
- **Server code**: `src/server/`
- **Components**: `src/components/`
- **Composables**: `src/composables/`
- **Pages**: `src/pages/`
- **Tests**: `tests/` (at monorepo root, referenced from vitest config)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create foundational types/utilities that all user stories share

- [x] T001 Install `exceljs` and `archiver` dependencies, plus `@types/archiver` as devDependency in `apps/accountflow/package.json`
- [x] T002 Create export TypeScript types (`ExportRuleRow`, `ExportAccountRow`, `ExportScenarioData`) in `src/server/utils/export/types.ts`
- [x] T003 Update Zod export schema to add `csv` format option in `src/server/utils/schemas.ts` — change `exportScenarioSchema.format` from `z.enum(['json', 'excel'])` to `z.enum(['json', 'xlsx', 'csv'])`
- [x] T004 Add bulk export Zod schema (`bulkExportSchema`) with `scenarioIds` array and `format` enum in `src/server/utils/schemas.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data transformation and export building logic that MUST be complete before ANY user story UI/endpoint work can begin

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement data transformer utility in `src/server/utils/export/data-transformer.ts` — functions: `flattenRuleToRows(rule, scenarioName)` that handles both legacy single-entry and normalized multi-entry JSONB formats for `debitSide`/`creditSide`, returning `ExportRuleRow[]`; `mapAccountToRow(account)` returning `ExportAccountRow`; `extractAccountCodes(rules)` extracting unique account codes from all rule sides
- [x] T006 Implement Excel builder utility in `src/server/utils/export/excel-builder.ts` — function: `buildExcelWorkbook(scenarios: ExportScenarioData[])` that creates an `exceljs` Workbook with an "Accounts" worksheet and one rules worksheet per scenario (worksheet names truncated to 31 chars), returns the workbook buffer
- [x] T007 Implement CSV builder utility in `src/server/utils/export/csv-builder.ts` — functions: `buildCsvString(headers, rows)` with RFC 4180 escaping and UTF-8 BOM prefix; `buildCsvZipBuffer(files: {name, content}[])` using `archiver` to create a ZIP buffer from multiple CSV strings
- [x] T008 Implement filename sanitizer utility in `src/server/utils/export/data-transformer.ts` — function: `sanitizeFilename(name)` using pattern `/[<>:"/\\|?*\x00-\x1f]/g` to preserve Chinese characters while removing filesystem-unsafe characters

**Checkpoint**: Export utilities ready — endpoint and UI work can now begin

---

## Phase 3: User Story 1 & 2 — Export Confirmed Rules + Accounts for Single Scenario (Priority: P1) MVP

**Goal**: Users can export confirmed accounting rules and their referenced accounts from a single scenario in Excel or CSV format via the existing export endpoint.

**Independent Test**: Navigate to a scenario with confirmed rules, call `GET /api/scenarios/:id/export?format=xlsx`, verify the downloaded Excel file contains an "Accounts" worksheet with referenced accounts and a "Rules" worksheet with flattened confirmed rules. Repeat with `?format=csv` and verify ZIP contains `accounts.csv` and `rules.csv`.

**Why US1+US2 combined**: These two stories are tightly coupled — the export always includes both rules and accounts together. They share the same endpoint and the same export action. Implementing one without the other would produce incomplete exports.

### Implementation for User Story 1 & 2

- [x] T009 [US1] Implement export data query function in `src/server/db/queries/export.ts` — function: `getExportDataForScenarios(scenarioIds, companyId)` that queries `journal_rules` with `status = 'confirmed'` and `scenarioId IN (...)`, joins to `scenarios` for name, then queries `accounts` by extracted account codes from flattened rule sides. Returns `{ scenarios: [{name, rules}], accounts }`.
- [x] T010 [US1] Enhance existing export endpoint in `src/server/api/scenarios/[id]/export.get.ts` — add `xlsx` and `csv` format handling: parse format from query using updated Zod schema, call `getExportDataForScenarios`, transform via `data-transformer`, build via `excel-builder` or `csv-builder`, set correct `Content-Type` and `Content-Disposition` headers, return binary buffer. Keep existing `json` format path unchanged. Return JSON error message `{ success: false, message }` when no confirmed rules exist.
- [x] T011 [US1] Update filename generation in `src/server/api/scenarios/[id]/export.get.ts` — replace current regex `/[^a-zA-Z0-9\-_]/g` with `sanitizeFilename()` to preserve Chinese characters in filenames. Generate `{scenario-name}-export.xlsx` or `{scenario-name}-export.zip` filenames.

**Checkpoint**: Single-scenario export works via direct API call (`/api/scenarios/:id/export?format=xlsx|csv`). Both accounts and rules are included. MVP backend is complete.

---

## Phase 4: User Story 4 — Format Selection UI (Priority: P2)

**Goal**: Users see a format selector when clicking export, allowing them to choose between Excel and CSV formats before downloading.

**Independent Test**: Navigate to a scenario detail page, click export, verify a dropdown/dialog appears with "Excel (.xlsx)" and "CSV (.csv)" options, select one and verify the correct file downloads.

**Why Phase 4 before Phase 5**: The format selector component is reusable and needed by both the single-scenario export (US1/US2 UI) and the bulk export (US3). Building it first enables reuse.

### Implementation for User Story 4

- [x] T012 [P] [US4] Create `FormatSelector.vue` component in `src/components/export/FormatSelector.vue` — a dropdown or small dialog that emits selected format (`xlsx` or `csv`). Props: `disabled: boolean`. Emit: `select(format: 'xlsx' | 'csv')`. Style with Tailwind CSS consistent with existing buttons.
- [x] T013 [P] [US4] Create `useExport` composable in `src/composables/useExport.ts` — provides `exportScenario(scenarioId, format)` that opens `/api/scenarios/{id}/export?format={format}` in a new tab, and `exportScenarios(scenarioIds, format)` that POSTs to `/api/scenarios/export` and triggers download from the response blob. Handles the "no confirmed rules" JSON error response by showing a user-friendly alert/toast.
- [x] T014 [US4] Update scenario detail page in `src/pages/scenarios/[id]/index.vue` — replace current hardcoded `exportData('json')` button with `FormatSelector` component + `useExport` composable. On format select, call `exportScenario(id, format)`. Keep the same button position and styling (purple theme).

**Checkpoint**: Single-scenario export has full UI with format selection. Users can choose xlsx or csv from the scenario detail page.

---

## Phase 5: User Story 3 — Bulk Export from Multiple Scenarios (Priority: P2)

**Goal**: Users can select multiple scenarios from the scenario list page and export their combined confirmed rules and accounts in a single file.

**Independent Test**: Go to scenario list, check 2+ scenarios, click "Export Selected", choose a format, verify the downloaded file contains data from all selected scenarios with deduplicated accounts.

### Implementation for User Story 3

- [x] T015 [US3] Create bulk export API endpoint in `src/server/api/scenarios/export.post.ts` — validate request body with `bulkExportSchema`, verify all scenario IDs belong to the requesting user's company, call `getExportDataForScenarios(scenarioIds, companyId)`, deduplicate accounts by code, build Excel (one rules worksheet per scenario + shared Accounts worksheet) or CSV ZIP (one `{name}-rules.csv` per scenario + `accounts.csv`), return binary response with `Content-Disposition: attachment; filename="scenarios-export-{YYYY-MM-DD}.{ext}"`.
- [x] T016 [US3] Add scenario selection checkboxes to scenario list page in `src/pages/scenarios/index.vue` — add a `ref<Set<number>>` for selected scenario IDs, render a checkbox on each scenario card, show selection count.
- [x] T017 [US3] Add "Export Selected" action bar to scenario list page in `src/pages/scenarios/index.vue` — show a floating/sticky action bar when 1+ scenarios are selected, containing a `FormatSelector` component and an "Export Selected" button. Wire to `useExport.exportScenarios(selectedIds, format)`. Disable the action bar when no scenarios are selected.

**Checkpoint**: Bulk export from scenario list page works end-to-end. Users can select multiple scenarios and download combined exports.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, cleanup, and validation across all stories

- [x] T018 Handle edge case: worksheet name deduplication in `src/server/utils/export/excel-builder.ts` — when multiple scenarios have the same name (after truncation to 31 chars), append numeric suffix (e.g., "Purchase Order", "Purchase Order (2)")
- [x] T019 Handle edge case: empty export for bulk endpoint in `src/server/api/scenarios/export.post.ts` — if none of the selected scenarios have confirmed rules, return `{ success: false, message: "No confirmed rules found in any selected scenario" }` with status 400
- [x] T020 Verify Unicode handling end-to-end — ensure Chinese characters in scenario names, account names, and descriptions survive round-trip through filename sanitization, Excel worksheet content, and CSV encoding (BOM + UTF-8)
- [x] T021 Run quickstart.md validation — follow all steps in `specs/007-data-export/quickstart.md` to verify the feature works as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001-T004 complete)
- **US1+US2 (Phase 3)**: Depends on Phase 2 (T005-T008 complete)
- **US4 (Phase 4)**: Depends on Phase 3 (T009-T011 complete — needs working backend)
- **US3 (Phase 5)**: Depends on Phase 2 (T005-T008) and Phase 4 (T012-T013 for reusable components)
- **Polish (Phase 6)**: Depends on all prior phases

### User Story Dependencies

- **US1+US2 (P1)**: Can start after Foundational phase — no dependencies on other stories
- **US4 (P2)**: Can start after US1+US2 backend is working — needs export endpoint to wire up UI
- **US3 (P2)**: Can start after Foundational phase for backend (T015), but UI tasks (T016-T017) need FormatSelector from US4

### Within Each Phase

- T005, T006, T007, T008 are independent and can be developed in parallel (different files)
- T012 and T013 are independent and can be developed in parallel (different files)
- T016 and T017 modify the same file and must be sequential

### Parallel Opportunities

```
Phase 2 (all in parallel):
  T005: data-transformer.ts
  T006: excel-builder.ts
  T007: csv-builder.ts
  T008: sanitizeFilename in data-transformer.ts (same file as T005 — do sequentially with T005)

Phase 4 (in parallel):
  T012: FormatSelector.vue
  T013: useExport.ts
```

---

## Implementation Strategy

### MVP First (User Stories 1+2 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008)
3. Complete Phase 3: US1+US2 (T009-T011)
4. **STOP and VALIDATE**: Test via `curl` or browser — `GET /api/scenarios/:id/export?format=xlsx`
5. Deploy if ready — users get Excel/CSV export via direct URL even without format selector UI

### Incremental Delivery

1. Setup + Foundational → Core utilities ready
2. US1+US2 → Backend export works via API → Deploy (MVP!)
3. US4 → Format selection UI on scenario detail page → Deploy
4. US3 → Bulk export from scenario list → Deploy
5. Polish → Edge cases, validation → Final release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 and US2 are combined in Phase 3 because they share the same endpoint and export action — rules and accounts are always exported together
- No test tasks generated (not requested in spec)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
