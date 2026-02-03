# Tasks: 结构化分析与交互引擎实现

**Input**: Design documents from `/specs/003-phase-3-structured-engine/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Nuxt app**: `apps/accountflow/src/`
- **Server API**: `apps/accountflow/src/server/api/`
- **Components**: `apps/accountflow/src/components/`
- **Database**: `apps/accountflow/drizzle/schema.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create component directories `apps/accountflow/src/components/proposals/` and `apps/accountflow/src/components/visualizer/`
- [ ] T002 Create composables directory structure for `useChatTools.ts` and `useProposalState.ts`
- [ ] T003 [P] Install dependencies: zod, zod-to-json-schema (if not present)
- [ ] T004 [P] Verify mermaid.js is installed, add if missing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [US5] Define JournalRuleSchema in `apps/accountflow/src/server/utils/schemas.ts` with Zod
- [ ] T006 [US5] Define AccountSchema in `apps/accountflow/src/server/utils/schemas.ts` with Zod
- [ ] T007 [US5] Define ScenarioContextSchema in `apps/accountflow/src/server/utils/schemas.ts` with Zod
- [ ] T008 [US5] Add journal_rules table schema to `apps/accountflow/drizzle/schema.ts`
- [ ] T009 [US5] Add flowchart_data table schema to `apps/accountflow/drizzle/schema.ts`
- [ ] T010 [US5] Add account_proposals table schema to `apps/accountflow/drizzle/schema.ts`
- [ ] T011 [US5] Run database migration to create new tables

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 5 - Zod Schema与Tool Provider实现 (Priority: P1) 🎯 MVP Backend

**Goal**: 建立结构化提取的后端能力，使AI能够通过Function Calling输出结构化数据

**Independent Test**: 调用Chat API后，OpenAI返回tool_calls而不是纯文本

### Implementation for User Story 5

- [ ] T012 [US5] Refactor `apps/accountflow/src/server/api/chat.post.ts` - add OpenAI tools configuration
- [ ] T013 [US5] Implement dynamic System Prompt assembler in `apps/accountflow/src/server/utils/promptBuilder.ts` to inject active accounts
- [ ] T014 [US5] Implement query_accounts tool handler in `apps/accountflow/src/server/api/chat.post.ts`
- [ ] T015 [US5] Implement propose_journal_rule tool handler in `apps/accountflow/src/server/api/chat.post.ts` (returns tool_call to frontend, does NOT write to DB)
- [ ] T016 [US5] Implement simulate_transaction tool handler in `apps/accountflow/src/server/api/chat.post.ts`
- [ ] T017 [US5] Add Zod Schema to JSON Schema conversion logic using zod-to-json-schema
- [ ] T018 [US5] Update chat.post.ts to return tool_calls in response body (transparent passthrough to frontend)

**Checkpoint**: Backend can receive user input and return structured tool_calls from AI

---

## Phase 4: User Story 1 - 双栏工作台UI重构 (Priority: P1) 🎯 MVP Frontend Layout

**Goal**: 实现双栏布局UI，左侧对话，右侧状态仪表板

**Independent Test**: 打开分析页面，看到左右分栏布局和三个标签页

### Implementation for User Story 1

- [ ] T019 [US1] Refactor `apps/accountflow/src/pages/scenarios/[id]/analyze.vue` - convert to two-pane layout using CSS Grid
- [ ] T020 [US1] Add left pane container for chat component in analyze.vue
- [ ] T021 [US1] Add right pane container with tabs (Flow/Rules/Accounts) in analyze.vue
- [ ] T022 [US1] Implement tab switching logic in right pane
- [ ] T023 [US1] Add responsive CSS for mobile view (stacked layout)
- [ ] T024 [US1] Style the two-pane layout with proper spacing and borders

**Checkpoint**: Two-pane layout is functional with three tabs in right panel

---

## Phase 5: User Story 2 - AI结构化提取与提案展示 (Priority: P1) 🎯 MVP Proposal Display

**Goal**: 接收AI的tool_calls并在右侧展示为提案，允许用户编辑

**Independent Test**: 用户输入业务描述，右侧Rules标签页显示提案卡片

### Implementation for User Story 2

- [ ] T025 [P] [US2] Create `apps/accountflow/src/composables/useChatTools.ts` - handle tool_calls parsing
- [ ] T026 [P] [US2] Create `apps/accountflow/src/composables/useProposalState.ts` - manage proposal state (draft, editing, confirmed)
- [ ] T027 [US2] Create `apps/accountflow/src/components/proposals/RuleProposalCard.vue` - display structured journal entries
- [ ] T028 [US2] Implement proposal card edit mode - allow user to modify accounts and amounts
- [ ] T029 [US2] Add "unknown account" highlighting logic in RuleProposalCard.vue
- [ ] T030 [US2] Integrate useChatTools in analyze.vue to listen for tool_calls from chat component
- [ ] T031 [US2] Connect tool_calls data to RuleProposalCard via useProposalState
- [ ] T032 [US2] Auto-activate Rules tab when tool_calls received
- [ ] T033 [US2] Add "Quick Create Account" button for unknown accounts in proposal card

**Checkpoint**: User can see and edit AI-generated rule proposals in right panel

---

## Phase 6: User Story 4 - 提案确认与持久化 (Priority: P1) 🎯 MVP Save Function

**Goal**: 用户确认提案后，调用API保存到数据库

**Independent Test**: 用户点击确认按钮，数据库journal_rules表新增记录

### Implementation for User Story 4

- [ ] T034 [US4] Create `apps/accountflow/src/server/api/rules/confirm.post.ts` - API to save confirmed rules
- [ ] T035 [US4] Implement validation logic in confirm.post.ts - verify all accounts exist
- [ ] T036 [US4] Implement database write in confirm.post.ts - insert into journal_rules table
- [ ] T037 [US4] Add error handling in confirm.post.ts for constraint violations
- [ ] T038 [US4] Add "Confirm and Save" button to RuleProposalCard.vue
- [ ] T039 [US4] Implement API call logic in RuleProposalCard.vue to call confirm.post.ts
- [ ] T040 [US4] Update proposal state to "saved" on successful API response
- [ ] T041 [US4] Display success/error toast messages in analyze.vue
- [ ] T042 [US4] Implement loading existing rules on page load in analyze.vue

**Checkpoint**: Complete Chat-to-State loop - user can confirm and persist rules

---

## Phase 7: User Story 3 - 实时流程图可视化 (Priority: P2)

**Goal**: 在Flow标签页渲染Mermaid流程图，基于Rules数据自动更新

**Independent Test**: 切换到Flow标签，看到基于当前规则生成的Mermaid流程图

### Implementation for User Story 3

- [ ] T043 [US3] Create `apps/accountflow/src/components/visualizer/LiveFlowchart.vue` - Mermaid renderer component
- [ ] T044 [US3] Implement Mermaid.js initialization and rendering logic in LiveFlowchart.vue
- [ ] T045 [US3] Add error handling for Mermaid syntax errors - display raw code on error
- [ ] T046 [US3] Implement rule-to-Mermaid conversion logic in useChatTools.ts or new utility
- [ ] T047 [US3] Add watch in LiveFlowchart.vue to listen for proposal state changes
- [ ] T048 [US3] Auto-regenerate Mermaid code when Rules data changes
- [ ] T049 [US3] Integrate LiveFlowchart.vue in Flow tab of analyze.vue
- [ ] T050 [US3] Add "Show Raw Code" toggle button in Flow tab
- [ ] T051 [US3] Save generated Mermaid code to flowchart_data table when rule is confirmed

**Checkpoint**: Flow visualization is functional and updates in real-time

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T052 [P] Add loading states for all async operations (chat, API calls, Mermaid rendering)
- [ ] T053 [P] Implement consistent error handling across all components
- [ ] T054 [P] Add user-friendly error messages for common scenarios (network error, validation error, etc.)
- [ ] T055 [P] Improve accessibility - keyboard navigation for tabs and buttons
- [ ] T056 [P] Add tooltips for unclear UI elements (especially in proposal card)
- [ ] T057 Test edge case: AI proposes unknown account - verify highlighting and quick create works
- [ ] T058 Test edge case: Mermaid rendering fails - verify error message and raw code display
- [ ] T059 Test edge case: API call fails during confirm - verify error handling and retry option
- [ ] T060 Update constitution.md with version bump if needed (already done in previous commit)
- [ ] T061 Create quickstart.md with setup instructions for new developers
- [ ] T062 Run end-to-end test: user input → AI response → proposal display → edit → confirm → verify in database

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 5 (Phase 3)**: Depends on Foundational - Backend infrastructure
- **User Story 1 (Phase 4)**: Depends on Foundational - Can run parallel with US5
- **User Story 2 (Phase 5)**: Depends on US1 (layout) and US5 (backend) completion
- **User Story 4 (Phase 6)**: Depends on US2 completion
- **User Story 3 (Phase 7)**: Depends on US2 completion - Can run parallel with US4
- **Polish (Phase 8)**: Depends on all core user stories being complete

### User Story Dependencies

- **User Story 5 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 (needs layout) and US5 (needs backend tool_calls)
- **User Story 4 (P1)**: Depends on US2 (needs proposal component)
- **User Story 3 (P2)**: Depends on US2 (needs Rules data structure)

### Critical Path

```
Setup → Foundational → [US5 + US1 in parallel] → US2 → US4 + US3 → Polish
```

### Parallel Opportunities

- **Phase 2**: T005-T010 can run in parallel (different schema definitions)
- **Phase 3**: T012-T018 are sequential in same file
- **Phase 4**: T019-T024 are sequential in same file
- **Phase 5**: T025-T026 can run in parallel, then T027-T033 sequential
- **US1 and US5** can be developed in parallel by different developers
- **US4 and US3** can be developed in parallel once US2 is complete

---

## Implementation Strategy

### MVP First (Core Loop)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 5 (Backend)
4. Complete Phase 4: User Story 1 (Layout)
5. Complete Phase 5: User Story 2 (Proposals)
6. Complete Phase 6: User Story 4 (Save)
7. **STOP and VALIDATE**: Test complete Chat-to-State loop
8. Deploy/demo if ready

### Incremental Delivery

After MVP (US5+US1+US2+US4), can add:
- User Story 3 (Flowchart visualization)
- Polish features (Phase 8)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Backend tasks (US5) can start in parallel with Frontend layout tasks (US1)
- Proposal component (US2) is the integration point, depends on both US1 and US5
- Flowchart (US3) is enhancement, not MVP blocker
- Verify Zod schemas are strict and well-documented for AI consumption
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
