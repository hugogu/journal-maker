# Implementation Tasks: Multi-Accounting System Support

**Branch**: `001-accounting-systems`  
**Generated**: 2026-03-26  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Data Model**: [data-model.md](data-model.md)

## Overview

Total Tasks: 65  
Estimated Effort: 2-3 weeks (3-4 developers)  
MVP Scope: User Stories 1 & 2 (Foundation + System-Aware Analysis)

---

## Phase 1: Database Schema & Migration (Foundation)

**Goal**: Create database tables and migration for accounting systems support

**Independent Test**: Run migrations successfully, verify tables created with proper constraints

- [X] T001 Create accounting_systems table migration in apps/accountflow/src/server/db/migrations/0008_create_accounting_systems.sql
- [X] T002 Create system_accounts junction table migration in apps/accountflow/src/server/db/migrations/0009_create_system_accounts.sql
- [X] T003 Create system_rules junction table migration in apps/accountflow/src/server/db/migrations/0010_create_system_rules.sql
- [X] T004 Create system_preferences table migration in apps/accountflow/src/server/db/migrations/0011_create_system_preferences.sql
- [X] T005 Add system_id column to analysis_entries in apps/accountflow/src/server/db/migrations/0012_add_system_id_to_analysis.sql
- [X] T006 Seed built-in systems (Financial Reporting, Management Reporting) in apps/accountflow/src/server/db/seed/systems.sql
- [X] T007 Update Drizzle schema definitions in apps/accountflow/src/server/db/schema.ts

---

## Phase 2: Backend API - System CRUD (User Story 1 - P1)

**Goal**: Enable creating and managing accounting systems

**Independent Test**: Can create custom system via API, list systems, update metadata, delete custom system

- [X] T008 [P] [US1] Create GET /api/systems endpoint in apps/accountflow/src/server/api/systems/index.ts
- [X] T009 [US1] Create POST /api/systems endpoint in apps/accountflow/src/server/api/systems/index.ts
- [X] T010 [US1] Create GET /api/systems/[id] endpoint in apps/accountflow/src/server/api/systems/index.ts
- [X] T011 [US1] Create PATCH /api/systems/[id] endpoint in apps/accountflow/src/server/api/systems/index.ts
- [X] T012 [US1] Create DELETE /api/systems/[id] endpoint in apps/accountflow/src/server/api/systems/index.ts
- [X] T013 [P] [US1] Create Zod schemas for system validation in apps/accountflow/src/server/utils/schemas.ts
- [X] T014 [P] [US1] Create system queries module in apps/accountflow/src/server/db/queries/systems.ts
- [X] T015 [US1] Add system name uniqueness validation in apps/accountflow/src/server/api/systems/index.ts
- [X] T016 [US1] Implement built-in system protection middleware in apps/accountflow/src/server/api/systems/index.ts

---

## Phase 3: Frontend - System Management UI (User Story 1 - P1)

**Goal**: Provide UI for administrators to manage accounting systems

**Independent Test**: Can navigate to admin, create system, see it in list, edit, delete

- [X] T017 [P] [US1] Create SystemSelector component in apps/accountflow/src/components/accounting/SystemSelector.vue
- [X] T018 [P] [US1] Create SystemList page in apps/accountflow/src/pages/admin/systems/index.vue
- [X] T019 [US1] Create SystemCreate page in apps/accountflow/src/pages/admin/systems/new.vue
- [X] T020 [US1] Create SystemEdit page in apps/accountflow/src/pages/admin/systems/[id]/edit.vue
- [X] T021 [P] [US1] Create system store composable in apps/accountflow/src/composables/useSystems.ts
- [X] T022 [US1] Add system management to admin navigation in apps/accountflow/src/pages/admin/index.vue
- [X] T023 [US1] Create SystemCard component for list view in apps/accountflow/src/components/accounting/SystemCard.vue
- [X] T024 [P] [US1] Add system type and status badges in apps/accountflow/src/components/accounting/SystemBadge.vue

---

## Phase 4: Backend - System Context & AI Integration (User Story 2 - P1)

**Goal**: Enable system-aware analysis by providing context to AI

**Independent Test**: API returns system-specific accounts and rules; analysis stores system reference

- [X] T025 [P] [US2] Create GET /api/systems/[id]/context endpoint in apps/accountflow/src/server/api/systems/[id]/context.get.ts
- [X] T026 [US2] Create GET /api/systems/[id]/accounts endpoint in apps/accountflow/src/server/api/systems/[id]/accounts.ts
- [X] T027 [US2] Create POST /api/systems/[id]/accounts endpoint in apps/accountflow/src/server/api/systems/[id]/accounts.ts
- [X] T028 [US2] Update analysis service to include system_id in apps/accountflow/src/server/db/queries/analysis.ts
- [ ] T029 [US2] Update AI adapter to include system context in apps/accountflow/src/server/utils/ai-adapters/base.ts
- [ ] T030 [US2] Modify prompt templates to include system info in apps/accountflow/src/server/utils/prompts/analysis.ts
- [X] T031 [P] [US2] Create system-aware account queries in apps/accountflow/src/server/db/queries/accounts.ts
- [X] T032 [P] [US2] Create system-aware rule queries in apps/accountflow/src/server/db/queries/rules.ts

---

## Phase 5: Frontend - System-Aware Analysis (User Story 2 - P1)

**Goal**: Allow users to select system and see system-specific analysis results

**Independent Test**: Can select system, analyze scenario, see results tagged with system

- [X] T033 [P] [US2] Add SystemSelector to analysis page header in apps/accountflow/src/pages/scenarios/[id]/analyze.vue
- [X] T034 [US2] Update scenario analysis flow to include system_id in apps/accountflow/src/composables/useConfirmedAnalysis.ts
- [X] T035 [US2] Create SystemIndicator component in apps/accountflow/src/components/analysis/SystemIndicator.vue
- [X] T036 [US2] Display system name in analysis results in apps/accountflow/src/pages/scenarios/[id]/analyze.vue
- [X] T037 [US2] Add system switcher during analysis in apps/accountflow/src/components/analysis/SystemSwitcher.vue
- [X] T038 [P] [US2] Persist selected system in component state in apps/accountflow/src/pages/scenarios/[id]/analyze.vue
- [X] T039 [US2] Update analysis save to include system_id in apps/accountflow/src/composables/useConfirmedAnalysis.ts
- [X] T040 [P] [US2] Add system context to chat API in apps/accountflow/src/components/analysis/ChatPane.vue

---

## Phase 6: Backend - System-Specific Account Management (User Story 3 - P2)

**Goal**: Support assigning accounts to specific systems

**Independent Test**: Can create account assigned to specific system, query returns only that system's accounts

- [ ] T041 [P] [US3] Update account creation to support system assignment in apps/accountflow/src/server/api/accounts/index.post.ts
- [ ] T042 [US3] Update account update endpoint for system changes in apps/accountflow/src/server/api/accounts/[id].patch.ts
- [ ] T043 [P] [US3] Add system filter to account list queries in apps/accountflow/src/server/db/queries/accounts.ts
- [ ] T044 [US3] Create endpoint to get accounts by system in apps/accountflow/src/server/api/systems/[id]/accounts.get.ts
- [ ] T045 [P] [US3] Update account Zod schema for system_ids in apps/accountflow/src/server/utils/schemas/accounts.ts

---

## Phase 7: Frontend - System-Specific Account Management (User Story 3 - P2)

**Goal**: UI for managing accounts within specific systems

**Independent Test**: Can create account, assign to Management Reporting, verify not in Financial Reporting

- [ ] T046 [P] [US3] Add system selector to account creation form in apps/accountflow/src/components/accounts/AccountForm.vue
- [ ] T047 [US3] Display system badges in account list in apps/accountflow/src/components/accounts/AccountList.vue
- [ ] T048 [P] [US3] Filter account list by selected system in apps/accountflow/src/pages/admin/accounts/index.vue
- [ ] T049 [US3] Show system membership in account details in apps/accountflow/src/components/accounts/AccountDetails.vue
- [ ] T050 [US3] Add system filter to account management in apps/accountflow/src/composables/useAccounts.ts

---

## Phase 8: Backend - System-Specific Journal Rules (User Story 4 - P2)

**Goal**: Support system-scoped journal rules

**Independent Test**: Can create rule for specific system, analysis uses only that system's rules

- [X] T051 [P] [US4] Update rule creation with system assignment in apps/accountflow/src/server/api/rules/index.post.ts
- [X] T052 [US4] Update rule queries to filter by system in apps/accountflow/src/server/db/queries/rules.ts
- [X] T053 [P] [US4] Create GET /api/systems/[id]/rules endpoint in apps/accountflow/src/server/api/systems/[id]/rules.get.ts
- [X] T054 [US4] Update rule Zod schema for system_ids in apps/accountflow/src/server/utils/schemas.ts

---

## Phase 9: Frontend - System-Specific Rules (User Story 4 - P2)

**Goal**: UI for managing rules within specific systems

**Independent Test**: Can create rule for Management Reporting, verify not applied to Financial Reporting

- [ ] T055 [P] [US4] Add system selector to rule creation form in apps/accountflow/src/components/rules/RuleForm.vue
- [ ] T056 [US4] Display system badges in rule list in apps/accountflow/src/components/rules/RuleList.vue
- [ ] T057 [P] [US4] Filter rules by selected system in apps/accountflow/src/pages/admin/rules/index.vue
- [ ] T058 [US4] Update rule composable with system filter in apps/accountflow/src/composables/useRules.ts

---

## Phase 10: Backend - Cross-System Comparison (User Story 5 - P3)

**Goal**: Enable comparing analyses across different systems

**Independent Test**: Can compare Financial vs Management analysis results via API

- [ ] T059 [P] [US5] Create GET /api/scenarios/[id]/compare endpoint in apps/accountflow/src/server/api/scenarios/[id]/compare.get.ts
- [ ] T060 [US5] Create POST /api/analyses/compare endpoint in apps/accountflow/src/server/api/analyses/compare.post.ts
- [ ] T061 [P] [US5] Implement diff algorithm for journal entries in apps/accountflow/src/server/utils/diff/journal-entries.ts
- [ ] T062 [P] [US5] Create comparison service in apps/accountflow/src/server/services/comparison.ts
- [ ] T063 [US5] Add GET /api/scenarios/[id]/systems endpoint in apps/accountflow/src/server/api/scenarios/[id]/systems.get.ts

---

## Phase 11: Frontend - Cross-System Comparison (User Story 5 - P3)

**Goal**: Side-by-side comparison view with visual diff

**Independent Test**: Can view comparison with highlighted differences between two systems

- [ ] T064 [P] [US5] Create SystemComparison component in apps/accountflow/src/components/analysis/SystemComparison.vue
- [ ] T065 [P] [US5] Create ComparisonDiff view in apps/accountflow/src/pages/scenarios/[id]/compare.vue
- [ ] T066 [US5] Add diff highlighting styles in apps/accountflow/src/assets/styles/comparison.css
- [ ] T067 [US5] Create comparison composable in apps/accountflow/src/composables/useComparison.ts
- [ ] T068 [P] [US5] Add "Compare with Another System" button in apps/accountflow/src/components/analysis/AnalysisActions.vue

---

## Phase 12: Polish & Cross-Cutting Concerns

**Goal**: Performance optimization, error handling, and final integration

**Independent Test**: All success criteria met (performance, usability, correctness)

- [ ] T069 [P] Add database indexes for system queries in apps/accountflow/src/server/db/migrations/0014_add_system_indexes.sql
- [ ] T070 Update TypeScript types for all new entities in apps/accountflow/src/types/systems.ts
- [ ] T071 Add error handling for system operations in apps/accountflow/src/composables/useErrorHandler.ts
- [ ] T072 Add loading states for system operations in apps/accountflow/src/components/ui/SystemLoading.vue
- [ ] T073 [P] Optimize system context queries in apps/accountflow/src/server/db/queries/systems.ts
- [ ] T074 Add system validation to analysis endpoints in apps/accountflow/src/server/utils/validators/analysis.ts
- [ ] T075 [P] Create system preference management UI in apps/accountflow/src/components/admin/SystemPreferences.vue
- [ ] T076 Add system preference endpoints in apps/accountflow/src/server/api/systems/[id]/preferences.ts

---

## Dependencies Graph

```
Phase 1 (DB Schema)
    ↓
Phase 2 (System API) ←→ Phase 3 (System UI)
    ↓                      ↓
Phase 4 (Analysis API) ←→ Phase 5 (Analysis UI)
    ↓
Phase 6 (Account API) ←→ Phase 7 (Account UI)
    ↓
Phase 8 (Rules API) ←→ Phase 9 (Rules UI)
    ↓
Phase 10 (Compare API) ←→ Phase 11 (Compare UI)
    ↓
Phase 12 (Polish)
```

## Parallel Execution Examples

### Within Phase 2 (System API):
- T008 (GET /api/systems) and T013 (Zod schemas) can be done in parallel
- T014 (queries) and T015 (validators) can be done in parallel
- T016 (middleware) depends on T014

### Within Phase 3 (System UI):
- T017 (SystemSelector), T021 (store), T024 (badges) can be done in parallel
- T018 (SystemList) depends on T017
- T022 (navigation) depends on T018

### Across Phases (Backend/Frontend):
- Phase 2 API and Phase 3 UI can be developed in parallel by different developers
- Phase 4 API and Phase 5 UI can be developed in parallel
- Each API endpoint has a corresponding UI component

## Implementation Strategy

### MVP (Minimum Viable Product) - Week 1-2
Focus on User Stories 1 & 2:
- Database schema (T001-T007)
- System CRUD API (T008-T016)
- System Management UI (T017-T024)
- System-Aware Analysis API (T025-T032)
- System-Aware Analysis UI (T033-T040)
- Basic polish (T069, T070, T071, T074)

**Deliverable**: Users can create systems, select system for analysis, see system-tagged results

### Incremental Delivery - Week 2-3
Add User Stories 3 & 4:
- System-specific accounts (T041-T050)
- System-specific rules (T051-T058)
- Preferences UI (T075-T076)

**Deliverable**: Full account and rule management per system

### Advanced Features - Week 3-4
Add User Story 5:
- Comparison API (T059-T063)
- Comparison UI (T064-T068)
- Final polish and optimization (T072, T073)

**Deliverable**: Complete feature set with cross-system comparison

## Task Validation Checklist

All tasks follow required format:
- ✅ Checkbox: `- [ ]`
- ✅ Task ID: T001-T076
- ✅ Parallel marker: `[P]` where applicable (different files, no dependencies)
- ✅ Story label: [US1], [US2], [US3], [US4], [US5] for user story phases
- ✅ File paths: Absolute paths from repo root
- ✅ Total: 76 tasks
- ✅ Organized by user story and priority (P1, P2, P3)

## Success Criteria Mapping

| Success Criteria | Tasks |
|-----------------|-------|
| SC-001: <5 min system setup | T008-T024, T070-T071 |
| SC-002: 100% correct analysis | T025-T032, T034, T037 |
| SC-003: System indicator visible | T035, T036, T040 |
| SC-004: <3 sec system switch | T033, T038, T073 |
| SC-005: Admin self-service | T017-T024 |
| SC-006: 90%+ comparison comprehension | T064-T068 |
| SC-007: Built-in systems ready | T006-T007 |

## Notes

- **No new infrastructure**: Uses existing Nuxt 3 + Drizzle ORM stack
- **Many-to-many pattern**: Junction tables for system_accounts and system_rules
- **AI integration**: System context added to prompts, structured JSON responses
- **Constitution compliance**: All 5 principles satisfied (verified in plan.md)
- **Testing**: Integration via manual test checklist in quickstart.md
- **MVP scope**: Stories 1 & 2 provide core value; stories 3-5 are enhancements
