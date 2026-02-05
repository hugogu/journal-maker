# Feature Specification: 消息与结构化产出分离存储

**Feature Branch**: `005-message-structured-storage`  
**Created**: 2026-02-04  
**Status**: Draft  
**Input**: User description: "存储改造（Messages + Structured Payload）把会话文本与结构化产出分离保存，便于回放、导出、审计。schema.ts 已有 conversationMessages, conversations, conversation_messages（存在多处，需统一使用 conversation_messages 表）后端在保存消息时，保存 content 与 structuredData/requestLog/responseStats。同时需要把AI分析过程中产生的科目、分录和图表，单独提取出来。为 Journal Rules 增加可执行结构（而非纯文本公式）便于前端仿真与后端校验。包括但是不限于journalRules 增加字段 debitSide jsonb、creditSide jsonb、triggerType、status('proposal'|'confirmed') 将 amountFormula 作为 human-readable 字段留存，但以 debitSide/creditSide 为准（结构化）"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 分离保存会话消息与结构化产出 (Priority: P1)

作为审计员或运营人员，我需要在回放或导出会话时，能够同时看到原始消息文本与结构化产出，以便准确复现分析过程并支持审计。

**Why this priority**: 没有稳定的分离存储，回放/导出/审计都无法可靠成立，是本次改造的核心价值。

**Independent Test**: 通过保存一段包含结构化产出的会话并执行回放或导出，可验证是否完整呈现文本与结构化字段。

**Acceptance Scenarios**:

1. **Given** 一次包含结构化产出的AI会话消息，**When** 系统保存该消息，**Then** 会分别保留消息文本与结构化字段（结构化产出、请求日志、响应统计）。
2. **Given** 已保存的消息，**When** 用户回放或导出会话，**Then** 能同时看到文本与结构化产出且字段不缺失。

---

### User Story 2 - 提取并单独保存分析产物 (Priority: P2)

作为分析人员，我希望AI分析产生的科目、分录和图表能被单独存储并可追溯到来源消息，以便复用、审计和报表整理。

**Why this priority**: 结构化产物是业务核心输出，独立存储能提升可用性和可审计性。

**Independent Test**: 运行一次会产生科目/分录/图表的分析，验证这些产物被单独保存并可按会话或消息检索。

**Acceptance Scenarios**:

1. **Given** 一次产生科目、分录和图表的分析，**When** 系统保存分析结果，**Then** 这些产物会被单独提取并与来源消息建立关联。
2. **Given** 已保存的分析产物，**When** 用户按会话或消息查询，**Then** 能看到对应的科目、分录和图表清单。

---

### User Story 3 - 规则可执行结构与人类可读说明并存 (Priority: P3)

作为业务配置人员，我需要在Journal Rules中使用结构化的借贷规则进行仿真与校验，同时保留人类可读的公式说明以便审阅。

**Why this priority**: 结构化规则是可执行与可校验的基础，但仍需要可读说明支持审核与沟通。

**Independent Test**: 创建或更新一条规则，验证结构化借贷侧与人类可读公式同时被保存且以结构化为准。

**Acceptance Scenarios**:

1. **Given** 一条新建或更新的规则，**When** 保存规则，**Then** 借贷结构、触发类型与状态被保存，且人类可读公式作为说明保留。
2. **Given** 一条规则同时包含结构化借贷与人类可读公式，**When** 系统执行仿真或校验，**Then** 以结构化借贷为准而非仅依赖文本公式。

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- 当消息没有结构化产出时，系统应仍保存文本并记录结构化字段为空。
- 当结构化产出缺少关键字段（如请求日志或响应统计）时，系统应保留已提供部分并标记缺失。
- 当分析产物与来源消息不匹配或缺少关联信息时，系统应阻止保存或记录可审计的异常。
- 当规则缺少借方或贷方结构时，系统应拒绝发布为“confirmed”状态。

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: 系统必须将会话消息文本与结构化产出分离保存，并保持二者可关联追溯。
- **FR-002**: 系统必须在保存消息时保留以下结构化信息：结构化产出、请求日志、响应统计（若存在）。
- **FR-003**: 用户必须能够在会话回放或导出时同时获得消息文本与结构化产出。
- **FR-004**: 系统必须从AI分析结果中提取科目、分录和图表并单独保存。
- **FR-005**: 系统必须为每个被提取的分析产物记录来源会话与来源消息的关联信息。
- **FR-006**: Journal Rules 必须支持结构化的借方与贷方规则，并包含触发类型与状态字段。
- **FR-007**: 系统必须保留人类可读的金额公式作为说明，但执行与校验必须以结构化借贷为准。

### Acceptance Coverage

- **FR-001 ~ FR-003**: 覆盖于“用户故事 1”的验收场景。
- **FR-004 ~ FR-005**: 覆盖于“用户故事 2”的验收场景。
- **FR-006 ~ FR-007**: 覆盖于“用户故事 3”的验收场景。

### Out of Scope

- 不调整现有权限模型或用户角色定义。
- 不改变现有导出格式的展示样式，仅确保数据完整性。

### Dependencies

- 依赖现有会话回放与导出流程可读取分离后的消息与结构化产出。

### Key Entities *(include if feature involves data)*

- **Conversation**: 一次会话容器，包含多条消息与其派生的分析产物。
- **Conversation Message**: 单条消息文本及其结构化产出，需与会话关联。
- **Structured Payload**: 与消息关联的结构化产出集合，包含结构化结果、请求日志、响应统计等。
- **Analysis Artifact**: 由分析产生的科目、分录和图表，需与来源消息可追溯。
- **Journal Rule**: 具有触发条件、结构化借贷规则与状态的人为配置规则。

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 99% 以上的会话回放/导出包含完整的消息文本与结构化产出字段。
- **SC-002**: 95% 以上的AI分析结果可成功提取并单独检索到科目、分录和图表。
- **SC-003**: 审计人员在抽样核查中能在 2 分钟内定位任意分析产物的来源消息。
- **SC-004**: 规则仿真或校验中，100% 使用结构化借贷规则而非仅依赖文本公式。

## Assumptions

- 当前的权限与可见性规则保持不变，分离存储不会改变用户可访问范围。
- 结构化产出字段缺省时允许为空，但仍需要可审计的缺失记录。
- 规则状态仅包含“proposal”和“confirmed”，不引入其他状态。
