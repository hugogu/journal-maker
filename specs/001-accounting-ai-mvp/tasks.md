# Tasks: AI辅助会计规则分析工具 MVP

**Input**: Design documents from `/specs/001-accounting-ai-mvp/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Nuxt 3 project structure in `apps/accountflow/`
- [x] T002 [P] Configure TypeScript strict mode and path aliases
- [x] T003 [P] Setup ESLint, Prettier, and lint-staged
- [x] T004 Configure TailwindCSS and base UI theme

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Setup PostgreSQL with Docker Compose
- [x] T006 [P] Configure drizzle-orm with database schema and migrations
- [x] T007 [P] Create base types (Account, Scenario, User, Company) in `src/types/`
- [x] T008 Implement Zod validation schemas for all entities
- [x] T009 Setup error handling middleware and API response utilities
- [x] T010 Configure environment variables and secrets management
- [x] T011 Create mock AI service for offline development

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 管理员配置AI和基准范例 (Priority: P1) 🎯 MVP

**Goal**: Admin can configure AI service, edit prompts, and create template scenario

**Independent Test**: Admin completes AI config and creates a working template scenario

### Implementation for User Story 1

- [ ] T012 [P] Create Company entity and API endpoints in `src/server/api/config/`
- [ ] T013 [P] Create AIConfig entity and encrypted storage in `src/server/db/`
- [ ] T014 [US1] Implement admin AI config UI page at `src/pages/admin/ai-config.vue`
- [ ] T015 [US1] Create AI connection test endpoint `src/server/api/ai/test.post.ts`
- [ ] T016 [US1] Implement prompt template editor with variable highlighting
- [ ] T017 [US1] Create template scenario creation flow at `src/pages/scenarios/new.vue`
- [ ] T018 [US1] Add admin role-based access control middleware

**Checkpoint**: Admin can configure AI and save a template scenario

---

## Phase 4: User Story 2 - 共享科目管理 (Priority: P1) 🎯 MVP

**Goal**: All users can manage shared accounting accounts across all scenarios

**Independent Test**: CRUD operations on accounts reflect across the system

### Implementation for User Story 2

- [ ] T019 [P] Create Account entity and CRUD API in `src/server/api/accounts/`
- [ ] T020 [P] Implement account validation (unique codes, referential integrity)
- [ ] T021 [US2] Create account management page at `src/pages/accounts/index.vue`
- [ ] T022 [US2] Build AccountPicker component in `src/components/accounting/AccountPicker.vue`
- [ ] T023 [US2] Add account deletion protection (check usage in scenarios)
- [ ] T024 [US2] Implement account list with filtering and sorting
- [ ] T025 [US2] Create inline account editing in tables

**Checkpoint**: Users can fully manage shared accounts

---

## Phase 5: User Story 3 - 产品用户分析新场景 (Priority: P1) 🎯 MVP

**Goal**: Product users create scenarios and use AI to analyze accounting rules

**Independent Test**: Product user creates scenario and gets AI-generated accounting entries

### Implementation for User Story 3

- [ ] T026 [P] Create Scenario entity and CRUD API in `src/server/api/scenarios/`
- [ ] T027 [P] Implement Conversation entity for AI chat history
- [ ] T028 [P] Build AI chat service with streaming (SSE) in `src/server/api/ai/`
- [ ] T029 [US3] Create scenario creation form at `src/pages/scenarios/new.vue`
- [ ] T030 [US3] Implement AI analysis page at `src/pages/scenarios/[id]/analyze.vue`
- [ ] T031 [US3] Build chat interface component with streaming display
- [ ] T032 [US3] Create AI response parser (structured data extraction)
- [ ] T033 [US3] Implement scenario confirmation and persistence flow
- [ ] T034 [US3] Add context assembly service (company + accounts + template)

**Checkpoint**: Product users can analyze scenarios with AI assistance

---

## Phase 6: User Story 4 - 实时流程图可视化 (Priority: P2)

**Goal**: Real-time flowchart visualization of information/capital flow from AI analysis

**Independent Test**: AI output renders as interactive flowchart automatically

### Implementation for User Story 4

- [ ] T035 [P] Create FlowchartData entity in database schema
- [ ] T036 [P] Implement Mermaid syntax generator from AI structured output
- [ ] T037 [US4] Build FlowchartViewer component with pan/zoom in `src/components/`
- [ ] T038 [US4] Integrate flowchart rendering into analysis page
- [ ] T039 [US4] Add node click handler to show corresponding journal entries
- [ ] T040 [US4] Implement real-time flowchart updates on AI response
- [ ] T041 [US4] Create flowchart layout persistence (manual adjustments)

**Checkpoint**: Flowcharts render and update in real-time during analysis

---

## Phase 7: User Story 5 - 示例交易记账数据生成 (Priority: P2)

**Goal**: Auto-generate complete sample transaction journal entries after analysis

**Independent Test**: Confirmed scenario shows sample transaction with full entries

### Implementation for User Story 5

- [x] T042 [P] Create SampleTransaction entity in database schema
- [x] T043 [P] Implement background AI service for sample generation
- [x] T044 [US5] Build sample transaction display page at `src/pages/scenarios/[id]/sample.vue`
- [x] T045 [US5] Create JournalEntryTable component with timeline view
- [x] T046 [US5] Implement auto-trigger on scenario confirmation
- [x] T047 [US5] Add expandable entry details with business context
- [x] T048 [US5] Create visual timeline of multi-step transactions

**Checkpoint**: Sample transactions auto-generate and display beautifully

---

## Phase 8: User Story 6 - 结构化导出 (Priority: P2)

**Goal**: Export analysis results as JSON and Excel

**Independent Test**: Export buttons produce valid downloadable files

### Implementation for User Story 6

- [x] T049 [P] Implement JSON export service in `src/server/utils/export.ts`
- [x] T050 [P] Add Excel export with xlsx library
- [x] T051 [US6] Create export API endpoints `src/server/api/scenarios/[id]/export/`
- [x] T052 [US6] Add export buttons to scenario detail page
- [x] T053 [US6] Implement filename generation with scenario name and version
- [x] T054 [US6] Create export preview modal before download

**Checkpoint**: Users can export results in both formats

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation

- [x] T055 [P] Create loading states and skeleton screens
- [x] T056 [P] Add error boundaries and user-friendly error messages
- [x] T057 [P] Implement responsive design for mobile/tablet
- [x] T058 Add E2E tests for critical user journeys (Playwright)
- [x] T059 Create unit tests for AI parser and utilities (Vitest)
- [x] T060 Write API documentation comments
- [x] T061 Validate quickstart.md instructions work end-to-end
- [x] T062 Add helpful empty states and onboarding hints
- [x] T063 Performance optimization: query optimization, lazy loading

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Parallel User Stories (3,4,5,6)
                                              ↓
                                       Phase 9 (Polish)
```

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (Admin Config) | Phase 2 | Needs AIConfig entity |
| US2 (Accounts) | Phase 2 | Can run parallel with US1 |
| US3 (AI Analysis) | US1, US2 | Needs AI config and accounts |
| US4 (Flowchart) | US3 | Builds on analysis results |
| US5 (Sample) | US3 | Triggers after confirmation |
| US6 (Export) | US3, US5 | Exports analysis + sample data |

### Suggested Implementation Order

**MVP Path (Minimum to ship)**:
1. Phase 1 → Phase 2 (foundation)
2. US1 + US2 in parallel (admin setup + accounts)
3. US3 (core AI analysis - the main feature!)
4. **Ship MVP** ✓

**Enhancement Path**:
5. US4 (flowcharts) + US5 (samples) in parallel
6. US6 (export)
7. Phase 9 (polish)

---

## Task Count Summary

| Phase | Tasks | Cumulative |
|-------|-------|------------|
| Setup | 4 | 4 |
| Foundational | 7 | 11 |
| US1 (Admin) | 7 | 18 |
| US2 (Accounts) | 7 | 25 |
| US3 (Analysis) | 9 | 34 |
| US4 (Flowchart) | 7 | 41 |
| US5 (Sample) | 7 | 48 |
| US6 (Export) | 6 | 54 |
| Polish | 9 | **63** |

**Estimated MVP completion**: Tasks T001-T034 (34 tasks)  
**Full feature completion**: All 63 tasks

---

## Notes

- [P] = Parallel - can be worked on simultaneously with other [P] tasks
- All paths use `apps/accountflow/` as base per plan.md structure
- Tests are omitted per spec - can be added if requested
- Each user story should be independently testable when complete
- Commit after each task or logical group
