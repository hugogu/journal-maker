# Tasks: Prompt版本化管理与AI服务增强

**Input**: Design documents from `/specs/002-prompt-ai-management/`  
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

**Tests**: Not explicitly requested - test tasks omitted per specification.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Database Migrations)

**Purpose**: Database schema changes required before any user story implementation

- [X] T001 [P] Create migration for Prompt tables in `src/server/db/migrations/002_add_prompt_tables.sql`
- [X] T002 [P] Create migration for AIProvider tables in `src/server/db/migrations/002_add_ai_provider_tables.sql`
- [X] T003 [P] Create migration for CompanyProfile table in `src/server/db/migrations/002_add_company_profile.sql`
- [X] T004 Create migration for ConversationMessages table in `src/server/db/migrations/002_add_conversation_messages.sql`
- [X] T005 [P] Create migration for ConversationShares table in `src/server/db/migrations/002_add_conversation_shares.sql`
- [X] T006 [P] Create migration for UserPreferences table in `src/server/db/migrations/002_add_user_preferences.sql`

**Checkpoint**: Database migrations ready - can be applied to development database

---

## Phase 2: Foundational (Schema and Base Infrastructure)

**Purpose**: Core infrastructure that MUST be complete before user stories can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Update Drizzle schema in `src/server/db/schema.ts` with all new tables and enums
- [X] T008 Create database types file in `src/server/db/types.ts` for TypeScript type inference
- [X] T009 [P] Create encryption utility in `src/server/utils/encryption.ts` for API key storage
- [X] T010 Create base AI Provider adapter interface in `src/server/utils/ai-adapters/base.ts`
- [X] T011 [P] Create OpenAI adapter in `src/server/utils/ai-adapters/openai.ts`
- [X] T012 [P] Create Azure OpenAI adapter in `src/server/utils/ai-adapters/azure.ts`
- [X] T013 [P] Create Ollama adapter in `src/server/utils/ai-adapters/ollama.ts`
- [X] T014 Create AI Provider factory in `src/server/utils/ai-adapters/index.ts`
- [X] T015 Update AI service in `src/server/utils/ai-service.ts` to support multiple providers

**Checkpoint**: Foundation ready - database schema and AI adapter infrastructure complete

---

## Phase 3: User Story 1 - Prompt模板管理 (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to manage versioned Prompt templates with AI-assisted generation

**Independent Test**: Admin can create Prompt template, edit versions, use AI to generate Prompt content, and activate specific versions

### Implementation for User Story 1

- [X] T016 [P] Create PromptTemplate table queries in `src/server/db/queries/prompts.ts`
- [X] T017 Create Prompt API endpoints in `src/server/api/prompts/index.get.ts` (list)
- [X] T018 Create Prompt API endpoints in `src/server/api/prompts/[id].get.ts` (detail)
- [X] T019 Create Prompt API endpoints in `src/server/api/prompts/index.post.ts` (create)
- [X] T020 Create Prompt API endpoints in `src/server/api/prompts/[id]/versions.post.ts` (create version)
- [X] T021 Create Prompt API endpoints in `src/server/api/prompts/[id]/activate.put.ts` (activate version)
- [X] T022 Create AI generate Prompt endpoint in `src/server/api/prompts/generate.post.ts`
- [X] T023 Create Prompt composable in `src/composables/usePrompts.ts`
- [X] T024 Create Prompt list page in `src/pages/admin/prompts/index.vue`
- [X] T025 Create Prompt editor page in `src/pages/admin/prompts/[id].vue`
- [ ] T026 [P] Create Prompt version viewer component in `src/components/prompt/VersionViewer.vue`
- [ ] T027 [P] Create Prompt diff viewer component in `src/components/prompt/DiffViewer.vue`
- [X] T028 Create Prompt variable highlighter/editor in `src/components/prompt/PromptEditor.vue`

**Checkpoint**: User Story 1 complete - admins can fully manage versioned Prompts

---

## Phase 4: User Story 2 - 多AI Provider配置与选择 (Priority: P1) 🎯 MVP

**Goal**: Support multiple AI Providers with automatic model discovery and user preference selection

**Independent Test**: Admin can add multiple Providers, system fetches model lists automatically, users can select Provider/Model in analysis page

### Implementation for User Story 2

- [X] T029 [P] Create AIProvider table queries in `src/server/db/queries/ai-providers.ts`
- [X] T030 Create AI Model cache queries in `src/server/db/queries/ai-models.ts`
- [X] T031 Create AI Provider API endpoints in `src/server/api/ai-providers/index.get.ts` (list)
- [X] T032 Create AI Provider API endpoints in `src/server/api/ai-providers/[id].get.ts` (detail)
- [X] T033 Create AI Provider API endpoints in `src/server/api/ai-providers/index.post.ts` (create)
- [X] T034 Create AI Provider API endpoints in `src/server/api/ai-providers/[id].put.ts` (update)
- [X] T035 Create AI Provider API endpoints in `src/server/api/ai-providers/[id].delete.ts` (delete)
- [X] T036 Create AI Provider refresh models endpoint in `src/server/api/ai-providers/[id]/refresh-models.post.ts`
- [X] T037 Create user preferences API in `src/server/api/user/preferences/ai.get.ts` and `ai.put.ts`
- [X] T038 Create AI Provider composable in `src/composables/useAIProviders.ts`
- [X] T039 Create AI Provider management page in `src/pages/admin/ai-config.vue` (refactor existing)
- [ ] T040 Create Provider/Model selector component in `src/components/ai-config/ProviderModelSelector.vue`
- [ ] T041 Add Provider/Model selector to analysis page in `src/pages/scenarios/[id]/analyze.vue`

**Checkpoint**: User Story 2 complete - multi-Provider support fully functional

---

## Phase 5: User Story 6 - 会话数据库持久化 (Priority: P1) 🎯 MVP

**Goal**: Migrate conversation persistence from localStorage to database with request logs and stats

**Independent Test**: Conversations persist across page refreshes, request logs and stats are saved, localStorage migration works

**Note**: This is P1 but implemented after US1/US2 because it depends on foundational schema work. It enables US4 and US5.

### Implementation for User Story 6

- [X] T042 Create ConversationMessages table queries in `src/server/db/queries/conversation-messages.ts`
- [ ] T043 Create conversation migration API in `src/server/api/conversations/migrate-from-localstorage.post.ts`
- [X] T044 Create conversation messages API in `src/server/api/scenarios/[id]/conversations/index.get.ts`
- [X] T045 Create conversation messages API in `src/server/api/scenarios/[id]/conversations/messages.post.ts`
- [X] T046 Update chat streaming API in `src/server/api/scenarios/[id]/chat.stream.ts` to persist to DB
- [X] T047 Update chat post API in `src/server/api/scenarios/[id]/chat.post.ts` to persist to DB
- [X] T048 Update conversation composable in `src/composables/useConversation.ts` to use database
- [ ] T049 Create localStorage migration composable in `src/composables/useLocalStorageMigration.ts`
- [ ] T050 Add migration prompt UI in `src/components/conversation/LocalStorageMigration.vue`
- [ ] T051 Update analyze page in `src/pages/scenarios/[id]/analyze.vue` to load from database

**Checkpoint**: User Story 6 complete - conversation persistence migrated to database

---

## Phase 6: User Story 3 - 公司级信息维护 (Priority: P2)

**Goal**: Provide company profile management that injects into AI prompts as context

**Independent Test**: Admin can edit company info, information appears in AI request logs as context

### Implementation for User Story 3

- [X] T052 Create CompanyProfile table queries in `src/server/db/queries/company-profile.ts`
- [X] T053 Create Company API endpoints in `src/server/api/company/index.get.ts` (get)
- [X] T054 Create Company API endpoints in `src/server/api/company/index.put.ts` (update)
- [X] T055 Create Company composable in `src/composables/useCompanyProfile.ts`
- [X] T056 Create Company settings page in `src/pages/admin/company-profile.vue`
- [X] T057 Update AI service in `src/server/utils/ai-service.ts` to inject company context into prompts
- [X] T058 Add company info display in `src/pages/admin/index.vue` dashboard

**Checkpoint**: User Story 3 complete - company info maintained and injected into AI context

---

## Phase 7: User Story 4 - 会话请求日志与响应统计 (Priority: P2)

**Goal**: Enable users to view complete request logs and AI response statistics

**Independent Test**: Users can click "View Log" on any message to see full request, click "Stats" to see token usage and timing

**Depends on**: User Story 6 (database persistence)

### Implementation for User Story 4

- [ ] T059 Create request log API endpoint in `src/server/api/conversations/messages/[id]/log.get.ts`
- [ ] T060 Create response stats API endpoint in `src/server/api/conversations/messages/[id]/stats.get.ts`
- [ ] T061 Create request log viewer component in `src/components/conversation/RequestLogViewer.vue`
- [ ] T062 Create response stats viewer component in `src/components/conversation/ResponseStatsViewer.vue`
- [ ] T063 Add log/stats buttons to message items in `src/components/conversation/MessageItem.vue`
- [ ] T064 Update analyze page in `src/pages/scenarios/[id]/analyze.vue` with log/stats UI integration

**Checkpoint**: User Story 4 complete - full request transparency and usage statistics available

---

## Phase 8: User Story 5 - 会话导出与分享 (Priority: P3)

**Goal**: Allow users to export conversations and share via unique public links

**Independent Test**: User can export conversation as Markdown, create share link, access via public URL, revoke access

**Depends on**: User Story 6 (database persistence)

### Implementation for User Story 5

- [ ] T065 Create ConversationShares table queries in `src/server/db/queries/conversation-shares.ts`
- [ ] T066 Create share API endpoints in `src/server/api/scenarios/[id]/shares/index.get.ts` (list)
- [ ] T067 Create share API endpoints in `src/server/api/scenarios/[id]/shares/index.post.ts` (create)
- [ ] T068 Create share API endpoints in `src/server/api/shares/[id]/revoke.post.ts` (revoke)
- [ ] T069 Create share API endpoints in `src/server/api/shares/[token]/index.get.ts` (public access)
- [ ] T070 Create share export API in `src/server/api/shares/[token]/export.get.ts`
- [ ] T071 Create share composable in `src/composables/useConversationShare.ts`
- [ ] T072 Create share management component in `src/components/conversation/ShareManager.vue`
- [ ] T073 Create export button component in `src/components/conversation/ExportButton.vue`
- [ ] T074 Create public share page in `src/pages/share/[token].vue`
- [ ] T075 Add share/export buttons to analyze page in `src/pages/scenarios/[id]/analyze.vue`

**Checkpoint**: User Story 5 complete - export and sharing functionality fully working

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, validation, and cleanup

- [ ] T076 [P] Add loading states for all async operations in UI components
- [ ] T077 [P] Add error handling and user-friendly error messages
- [ ] T078 Create database seed script for default Prompt templates in `src/server/db/seed-prompts.ts`
- [ ] T079 Create database seed script for default AI Provider in `src/server/db/seed-providers.ts`
- [ ] T080 Migrate existing AIConfig to AIProvider in migration script
- [ ] T081 Update quickstart.md with final instructions
- [ ] T082 Validate all API contracts against implementations
- [ ] T083 Run end-to-end validation per quickstart.md
- [ ] T084 Performance optimization: add indexes for frequent queries

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup/Migrations)
    ↓
Phase 2 (Foundational/Schema)
    ↓
┌───┬───┬───┬───┬───┬───┐
↓   ↓   ↓   ↓   ↓   ↓
US1 US2 US6 US3 US4 US5
(P1)(P1)(P1)(P2)(P2)(P3)
└───┴───┘   └───┴───┘   ↓
    │           │      (depends on US6)
    └───────────┘
           ↓
    Phase 9 (Polish)
```

### User Story Dependencies

| Story | Priority | Depends On | Notes |
|-------|----------|------------|-------|
| US1 Prompt管理 | P1 | Phase 2 | Independent - can start after foundation |
| US2 多Provider | P1 | Phase 2 | Independent - can start after foundation |
| US6 DB持久化 | P1 | Phase 2 | Independent - enables US4/US5 |
| US3 公司信息 | P2 | Phase 2 | Independent - can start after foundation |
| US4 日志/统计 | P2 | US6 | Needs database persistence |
| US5 导出/分享 | P3 | US6 | Needs database persistence |

### Recommended Implementation Order

**MVP Path (Minimum to ship)**:
1. Phase 1 → Phase 2 (foundation)
2. US1 (Prompt管理) + US2 (多Provider) in parallel
3. US6 (DB持久化)
4. **Ship MVP** ✓

**Enhancement Path**:
5. US3 (公司信息) in parallel with US4 (日志/统计)
6. US5 (导出/分享)
7. Phase 9 (Polish)

### Parallel Opportunities

- **Phase 1**: All migration files can be created in parallel
- **Phase 2**: AI adapters (OpenAI, Azure, Ollama) can be developed in parallel
- **US1 + US2**: Can be implemented in parallel by different developers
- **US3 + US6**: Can be implemented in parallel (no dependencies)
- **US4 + US5**: Can be implemented in parallel once US6 is complete

---

## Task Count Summary

| Phase | Tasks | Cumulative |
|-------|-------|------------|
| Phase 1: Setup | 6 | 6 |
| Phase 2: Foundational | 9 | 15 |
| Phase 3: US1 Prompt管理 | 13 | 28 |
| Phase 4: US2 多Provider | 13 | 41 |
| Phase 5: US6 DB持久化 | 10 | 51 |
| Phase 6: US3 公司信息 | 7 | 58 |
| Phase 7: US4 日志/统计 | 6 | 64 |
| Phase 8: US5 导出/分享 | 11 | 75 |
| Phase 9: Polish | 9 | **84** |

**Estimated MVP completion**: Tasks T001-T051 (51 tasks covering Phase 1-2 + US1/US2/US6)  
**Full feature completion**: All 84 tasks

---

## Notes

- [P] = Parallel - can be worked on simultaneously with other [P] tasks
- All paths use `apps/accountflow/src/` as base per plan.md structure
- Tests are omitted per spec - can be added if requested
- Each user story should be independently testable when complete
- Commit after each task or logical group
