# Tasks: 分析页面双栏布局重构

**Input**: Design documents from `/specs/004-analyze-dual-pane-layout/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Base path**: `apps/accountflow/src/`
- **Components**: `apps/accountflow/src/components/analysis/`
- **Server**: `apps/accountflow/src/server/`
- **Composables**: `apps/accountflow/src/composables/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema extension and shared utilities

- [x] T001 Add confirmedAnalysis table schema in `apps/accountflow/src/server/db/schema.ts`
- [ ] T002 Generate and apply database migration with `pnpm db:generate && pnpm db:migrate`
- [x] T003 [P] Create TypeScript types for analysis entities in `apps/accountflow/src/types/index.ts`
- [x] T004 [P] Add Zod validation schemas in `apps/accountflow/src/server/utils/schemas.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and API layer that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create AI response parser utility in `apps/accountflow/src/utils/ai-response-parser.ts`
- [x] T006 [P] Create database queries in `apps/accountflow/src/server/db/queries/confirmed-analysis.ts`
- [x] T007 [P] Implement GET endpoint in `apps/accountflow/src/server/api/scenarios/[id]/confirmed-analysis.get.ts`
- [x] T008 [P] Implement POST endpoint in `apps/accountflow/src/server/api/scenarios/[id]/confirmed-analysis.post.ts`
- [x] T009 [P] Implement DELETE endpoint in `apps/accountflow/src/server/api/scenarios/[id]/confirmed-analysis.delete.ts`
- [x] T010 Create useConfirmedAnalysis composable in `apps/accountflow/src/composables/useConfirmedAnalysis.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 实时AI对话分析 (Priority: P1) 🎯 MVP

**Goal**: 将现有 analyze.vue 重构为双栏布局，左侧 ChatPane 保留全部现有 AI 对话功能

**Independent Test**: 打开场景分析页面，发送消息给 AI，验证流式响应和 mermaid 渲染正常工作

### Implementation for User Story 1

- [x] T011 [US1] Create ChatPane component shell in `apps/accountflow/src/components/analysis/ChatPane.vue`
- [x] T012 [US1] Extract message list rendering logic from analyze.vue to ChatPane.vue
- [x] T013 [US1] Extract message input form and send logic from analyze.vue to ChatPane.vue
- [x] T014 [US1] Extract streaming response handling from analyze.vue to ChatPane.vue
- [x] T015 [US1] Extract mermaid rendering logic from analyze.vue to ChatPane.vue
- [x] T016 [US1] Move modal components (LogModal, StatsModal, ShareModal) handling to ChatPane.vue
- [x] T017 [US1] Refactor `apps/accountflow/src/pages/scenarios/[id]/analyze.vue` to dual-pane grid layout
- [x] T018 [US1] Add responsive breakpoints for mobile/tablet in analyze.vue
- [ ] T019 [US1] Verify all existing functionality works in new ChatPane structure

**Checkpoint**: User Story 1 complete - ChatPane fully functional with all existing features

---

## Phase 4: User Story 2 - 确认分析结果到状态面板 (Priority: P1)

**Goal**: 实现确认按钮，用户可将 AI 分析结果确认到 StatePane

**Independent Test**: AI 响应完成后点击确认按钮，观察 StatePane 显示确认的内容

### Implementation for User Story 2

- [x] T020 [P] [US2] Create ConfirmAnalysisButton component in `apps/accountflow/src/components/analysis/ConfirmAnalysisButton.vue`
- [x] T021 [P] [US2] Create StatePane component shell in `apps/accountflow/src/components/analysis/StatePane.vue`
- [x] T022 [US2] Implement confirm button state logic (disabled during streaming, enabled when parseable content)
- [x] T023 [US2] Integrate ConfirmAnalysisButton into ChatPane after AI responses
- [x] T024 [US2] Connect confirm action to POST API endpoint via useConfirmedAnalysis
- [x] T025 [US2] Display basic confirmed content in StatePane (subjects, rules, diagram as raw text)
- [x] T026 [US2] Integrate StatePane into analyze.vue dual-pane layout
- [x] T027 [US2] Load existing confirmed analysis on page mount via GET endpoint
- [ ] T028 [US2] Verify confirmed content persists across page refresh

**Checkpoint**: User Story 2 complete - Confirm button and basic StatePane working

---

## Phase 5: User Story 3 - 查看确认的会计科目和规则 (Priority: P2)

**Goal**: StatePane 以结构化方式展示会计科目列表和规则卡片

**Independent Test**: 确认包含科目和规则的分析后，检查 StatePane 显示格式化的科目列表和规则卡片

### Implementation for User Story 3

- [x] T029 [P] [US3] Create AccountingSubjectList component in `apps/accountflow/src/components/analysis/AccountingSubjectList.vue`
- [x] T030 [P] [US3] Create AccountingRuleCard component in `apps/accountflow/src/components/analysis/AccountingRuleCard.vue`
- [x] T031 [US3] Style AccountingSubjectList with code, name, direction columns
- [x] T032 [US3] Style AccountingRuleCard with description, condition, account info
- [x] T033 [US3] Integrate AccountingSubjectList into StatePane
- [x] T034 [US3] Integrate AccountingRuleCard list into StatePane
- [x] T035 [US3] Add empty state messaging when no subjects/rules confirmed
- [x] T036 [US3] Add independent scrolling for StatePane content area

**Checkpoint**: User Story 3 complete - Structured display of subjects and rules

---

## Phase 6: User Story 4 - 查看资金信息流图 (Priority: P2)

**Goal**: StatePane 中正确渲染确认的 Mermaid 流程图

**Independent Test**: 确认包含流程图的分析后，检查 StatePane 显示渲染好的流程图

### Implementation for User Story 4

- [x] T037 [US4] Create FlowDiagramViewer component in `apps/accountflow/src/components/analysis/FlowDiagramViewer.vue`
- [x] T038 [US4] Extract and refactor mermaid initialization logic from ChatPane to FlowDiagramViewer
- [x] T039 [US4] Implement mermaid rendering with proper container sizing
- [x] T040 [US4] Add overflow scroll for large diagrams in FlowDiagramViewer
- [x] T041 [US4] Integrate FlowDiagramViewer into StatePane
- [x] T042 [US4] Handle mermaid render errors with fallback display

**Checkpoint**: User Story 4 complete - Flow diagrams render in StatePane

---

## Phase 7: User Story 5 - 清空或重置StatePane (Priority: P3)

**Goal**: 用户可清空 StatePane 内容，重新开始分析

**Independent Test**: 点击清空按钮后，StatePane 恢复空白状态

### Implementation for User Story 5

- [ ] T043 [US5] Add clear/reset button to StatePane header
- [ ] T044 [US5] Implement confirmation dialog for clear action
- [ ] T045 [US5] Connect clear action to DELETE API endpoint via useConfirmedAnalysis
- [ ] T046 [US5] Reset StatePane to empty state after successful clear
- [ ] T047 [US5] Update confirm button state after clear (re-enable if last AI response has content)

**Checkpoint**: User Story 5 complete - Clear functionality working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T048 [P] Add loading spinners for confirm and clear operations
- [ ] T049 [P] Add error toasts for API failures
- [ ] T050 Verify responsive layout on tablet (768px-1024px) and mobile (<768px)
- [ ] T051 Code cleanup: remove unused code from original analyze.vue
- [ ] T052 Add aria labels and keyboard accessibility to new components
- [ ] T053 Run TypeScript type check with `pnpm typecheck`
- [ ] T054 Run linter with `pnpm lint:fix`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ────────────────────────────────────────┐
                                                         │
Phase 2 (Foundational) ◄────────────────────────────────┘
         │
         ▼
     ┌───┴───────────────────────────────────────────┐
     │  All User Stories depend on Phase 2 completion │
     └───┬───────────────────────────────────────────┘
         │
         ├──► Phase 3 (US1: ChatPane) ──┐
         │                               │
         └──► Phase 4 (US2: Confirm) ◄──┘ (US2 depends on US1 for ChatPane)
                      │
              ┌───────┴───────┐
              │               │
              ▼               ▼
     Phase 5 (US3)      Phase 6 (US4)   ← Can run in parallel
              │               │
              └───────┬───────┘
                      │
                      ▼
              Phase 7 (US5: Clear) ← Depends on StatePane existing
                      │
                      ▼
              Phase 8 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (ChatPane) | Phase 2 | Phase 2 complete |
| US2 (Confirm) | US1 | T019 (ChatPane complete) |
| US3 (Subjects/Rules) | US2 | T028 (StatePane exists) |
| US4 (FlowDiagram) | US2 | T028 (StatePane exists) |
| US5 (Clear) | US3/US4 | T041 (StatePane content exists) |

### Within Each User Story

- Component shells can be created in parallel [P]
- Integration tasks are sequential
- Verify checkpoint before moving to next phase

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T003 (types) ──┬── parallel
T004 (schemas) ┘
```

**Phase 2 (Foundational)**:
```
T006 (queries) ───┬── parallel
T007 (GET API) ───┤
T008 (POST API) ──┤
T009 (DELETE API) ┘
```

**Phase 5+6 (US3+US4)** - After US2 complete:
```
US3 tasks ──┬── parallel (different components)
US4 tasks ──┘
```

---

## Parallel Example: User Story 3 & 4

After US2 is complete, US3 and US4 can proceed in parallel:

```bash
# Developer A: User Story 3 (Subjects/Rules)
Task: "Create AccountingSubjectList component"
Task: "Create AccountingRuleCard component"

# Developer B: User Story 4 (FlowDiagram)
Task: "Create FlowDiagramViewer component"
Task: "Extract mermaid rendering logic"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup (database schema)
2. Complete Phase 2: Foundational (API + parser + composable)
3. Complete Phase 3: User Story 1 (ChatPane with all existing features)
4. Complete Phase 4: User Story 2 (Confirm button + basic StatePane)
5. **STOP and VALIDATE**: Test dual-pane layout, confirm flow works
6. Deploy/demo MVP with confirm functionality

### Incremental Delivery

1. **MVP**: Setup + Foundation + US1 + US2 → Dual-pane with confirm
2. **+US3**: Add structured subjects/rules display
3. **+US4**: Add flow diagram rendering in StatePane
4. **+US5**: Add clear/reset capability
5. Each increment adds value without breaking previous features

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify existing analyze.vue features work throughout US1 refactor
- Use existing mermaid logic from analyze.vue in FlowDiagramViewer
- All API endpoints follow existing Nuxt 3 patterns in the codebase
- Commit after each task or logical group
