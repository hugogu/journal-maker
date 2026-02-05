---
description: "Task list for message + structured payload storage refactor"
---

# Tasks: 消息与结构化产出分离存储

**Input**: Design documents from `/specs/005-message-structured-storage/`
**Prerequisites**: plan.md (required), spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested for this feature.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create migration scaffold in apps/accountflow/src/server/db/migrations/ for message/artifact/journal rule schema changes
- [x] T002 [P] Create API route directories for new endpoints under apps/accountflow/src/server/api/scenarios/[id]/conversation-messages/ and apps/accountflow/src/server/api/scenarios/[id]/analysis-artifacts/

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 Update schema definitions in apps/accountflow/src/server/db/schema.ts for conversation_messages structuredData, analysis artifact tables, and journal_rules structured fields
- [x] T004 [P] Update inferred types in apps/accountflow/src/server/db/types.ts for new tables/fields and deprecations
- [x] T005 [P] Extend conversation query helpers to include structuredData in apps/accountflow/src/server/db/queries/conversations.ts
- [x] T006 [P] Add analysis artifact query helpers in apps/accountflow/src/server/db/queries/analysis-artifacts.ts
- [x] T007 [P] Add/extend validation schemas for conversation messages, artifacts, and journal rule updates in apps/accountflow/src/server/utils/schemas.ts
- [x] T008 Apply migration changes in apps/accountflow/src/server/db/migrations/<new_migration>.sql to add columns/tables/enums

**Checkpoint**: Foundation ready (schema + queries + validation in place)

---

## Phase 3: User Story 1 - 分离保存会话消息与结构化产出 (Priority: P1) 🎯 MVP

**Goal**: Save message content and structured payload separately in `conversation_messages` and expose them for replay/export.

**Independent Test**: Create a message with structured payload and confirm replay/export shows both text and structured fields.

### Implementation for User Story 1

- [x] T009 [US1] Add includeStructured support for list API in apps/accountflow/src/server/api/scenarios/[id]/conversations/index.get.ts
- [x] T010 [US1] Accept structured payload on create in apps/accountflow/src/server/api/scenarios/[id]/conversations/index.post.ts
- [x] T011 [P] [US1] Implement new conversation-message endpoints in apps/accountflow/src/server/api/scenarios/[id]/conversation-messages/index.get.ts, apps/accountflow/src/server/api/scenarios/[id]/conversation-messages/index.post.ts, and apps/accountflow/src/server/api/conversation-messages/[messageId]/index.get.ts
- [x] T012 [US1] Persist structuredData/requestLog/responseStats for assistant messages in apps/accountflow/src/server/api/scenarios/[id]/chat.stream.ts
- [x] T013 [US1] Switch non-stream chat storage to conversation_messages in apps/accountflow/src/server/api/scenarios/[id]/chat.post.ts
- [x] T014 [US1] Update export to use conversation_messages and include structured payload in apps/accountflow/src/server/api/scenarios/[id]/export.get.ts
- [x] T015 [US1] Update scenario delete to remove conversation_messages (and artifacts once added) in apps/accountflow/src/server/api/scenarios/[id]/index.ts
- [x] T016 [US1] Update conversation loader to handle structured fields in apps/accountflow/src/composables/useConversation.ts

**Checkpoint**: User Story 1 independently functional

---

## Phase 4: User Story 2 - 提取并单独保存分析产物 (Priority: P2)

**Goal**: Extract subjects, journal entries, and diagrams from AI analysis and store them as independent artifacts.

**Independent Test**: Run an analysis, then query artifacts by scenario/message and verify subjects/entries/diagrams exist.

### Implementation for User Story 2

- [x] T017 [US2] Implement artifact persistence helpers in apps/accountflow/src/server/db/queries/analysis-artifacts.ts
- [x] T018 [US2] Implement artifact endpoints in apps/accountflow/src/server/api/scenarios/[id]/analysis-artifacts/index.get.ts and apps/accountflow/src/server/api/scenarios/[id]/analysis-artifacts/index.post.ts
- [x] T019 [US2] Extend AI parsing for subjects/entries/diagrams in apps/accountflow/src/server/utils/ai-response-parser.ts
- [x] T020 [US2] Save extracted artifacts when AI responses complete in apps/accountflow/src/server/api/scenarios/[id]/chat.stream.ts and apps/accountflow/src/server/api/scenarios/[id]/chat.post.ts
- [x] T021 [US2] Ensure confirmed analysis links to sourceMessageId in apps/accountflow/src/server/api/scenarios/[id]/confirmed-analysis.post.ts

**Checkpoint**: User Story 2 independently functional

---

## Phase 5: User Story 3 - 规则可执行结构与人类可读说明并存 (Priority: P3)

**Goal**: Store executable debit/credit structures on journal rules while preserving human-readable formulas.

**Independent Test**: Update a rule with structured sides and verify status rules and export use structured definitions.

### Implementation for User Story 3

- [x] T022 [US3] Add structured journal rule validation in apps/accountflow/src/server/utils/schemas.ts
- [x] T023 [US3] Implement PATCH endpoint for structured journal rules in apps/accountflow/src/server/api/journal-rules/[ruleId]/index.patch.ts
- [x] T024 [US3] Update sample transaction generation to use structured sides in apps/accountflow/src/server/api/scenarios/[id]/transactions/index.ts
- [x] T025 [US3] Update account deletion checks to inspect structured sides in apps/accountflow/src/server/api/accounts/index.ts
- [x] T026 [US3] Include structured journal rule fields in exports in apps/accountflow/src/server/api/scenarios/[id]/export.get.ts

**Checkpoint**: User Story 3 independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T027 [P] Update quickstart steps for new endpoints in specs/005-message-structured-storage/quickstart.md
- [ ] T028 Run quickstart validation and record results in specs/005-message-structured-storage/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3-5)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on desired user stories

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational, no dependency on other stories
- **US2 (P2)**: Starts after Foundational, can run in parallel with US1
- **US3 (P3)**: Starts after Foundational, can run in parallel with US1/US2

### Parallel Opportunities

- Phase 1: T002 can run in parallel with T001
- Phase 2: T004–T007 can run in parallel after T003 starts
- US1: T011 can run in parallel with T009/T010
- US2: T017–T019 can run in parallel
- US3: T023–T025 can run in parallel

---

## Parallel Example: User Story 1

- T009 Add includeStructured support in apps/accountflow/src/server/api/scenarios/[id]/conversations/index.get.ts
- T011 Implement new endpoints in apps/accountflow/src/server/api/scenarios/[id]/conversation-messages/index.get.ts
- T010 Accept structured payload in apps/accountflow/src/server/api/scenarios/[id]/conversations/index.post.ts

---

## Parallel Example: User Story 2

- T017 Implement artifact queries in apps/accountflow/src/server/db/queries/analysis-artifacts.ts
- T018 Implement artifact endpoints in apps/accountflow/src/server/api/scenarios/[id]/analysis-artifacts/index.get.ts
- T019 Extend AI parsing in apps/accountflow/src/server/utils/ai-response-parser.ts

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate replay/export works with structured payload

### Incremental Delivery

1. Setup + Foundational → schema and API base ready
2. US1 → message + structured payload separation available
3. US2 → analysis artifacts extracted and queryable
4. US3 → structured journal rules + validation
5. Polish → documentation + quickstart validation

---

## Notes

- [P] tasks are parallelizable when they touch different files
- Each task includes exact file paths for implementation
- No tests included because none were requested in the specification
