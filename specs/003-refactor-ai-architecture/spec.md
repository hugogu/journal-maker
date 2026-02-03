# Feature Specification: Refactor AI Architecture & Structured Workflows

**Feature Branch**: `003-refactor-ai-architecture`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "Refactor backend architecture: Abstract AI Service, unify Zod schemas, make Chat API tool-aware (proposal flow), restructure conversation storage, and add structured journal rules in DB."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review AI Proposals (Priority: P1)

As a User, I want to review what the AI proposes (Proposals) before they are saved to the database, so I can ensure accuracy in my accounting rules.

**Why this priority**: Defines the core "Human-in-the-loop" workflow, shifting from implicit writes to explicit confirmations.

**Independent Test**: Can be tested by sending a chat request and verifying the UI/Response shows a "Proposal" object instead of immediately creating a Rule.

**Acceptance Scenarios**:

1. **Given** a user request to "create a rule for Office Supplies", **When** the AI processes the request, **Then** the system returns a structured `Proposal` object containing the intended rule details (debit/credit), but *does not* save it to the system yet.
2. **Given** a generated Proposal, **When** the user approves it, **Then** the system saves it and confirms success.

---

### User Story 2 - Transparent Conversation History (Priority: P2)

As a User, I want my conversation history to accurately reflect both what I said and the structured data (Proposals/Rules) the AI generated, so that I can audit past interactions.

**Why this priority**: Essential for auditability and reliability of the accounting log.

**Independent Test**: Verify conversation storage contains separate fields for text content and structured payloads.

**Acceptance Scenarios**:

1. **Given** a completed interaction, **When** I view the history, **Then** I can see the original text and the structured data associated with that turn.
2. **Given** an exported conversation, **When** I inspect the file, **Then** it includes the full structured payload of AI responses.

---

### User Story 3 - Structured Rule Execution (Priority: P3)

As a Developer/System, I need Journal Rules to be stored in a strictly structured format (JSON sides) rather than text formulas, so that the simulation engine can execute them reliably.

**Why this priority**: Enables the next generation of the simulation engine and reduces parsing errors.

**Independent Test**: Create a rule via the new interface and verify the storage contains valid structured data in `debitSide` and `creditSide`.

**Acceptance Scenarios**:

1. **Given** a confirmed Proposal, **When** it is saved as a Rule, **Then** the rule storage persists the account logic in `debitSide`/`creditSide` structured fields.
2. **Given** existing rules (after migration), **When** the system loads them, **Then** they are valid structured objects (or marked for manual fix).

---

### Edge Cases

- **AI Service Failure**: If the AI provider is down, the abstract service should throw a standardized error, which the UI displays gracefully (retries handled by service).
- **Schema Mismatch**: If the AI returns JSON that violates the Zod schema, the service should catch it and either retry (internal repair) or return a specific error to the user, not a cryptic 500 code.
- **Migration Data Loss**: Old rules with complex formulas that cannot be auto-converted to JSON sides should be preserved in `amountFormula` and flagged as "Draft/Requires Review", ensuring no logic is lost.

## Requirements *(mandatory)*

### Functional Requirements

#### AI Service Abstraction
- **FR-001**: System MUST provide a centralized AI Service that encapsulates all interactions with LLM providers.
- **FR-002**: The AI Service MUST handle prompt assembly, including injecting context (active interactions, company profile) automatically.
- **FR-003**: The AI Service MUST support conversational, tool-use, and streaming interfaces.
- **FR-004**: The AI Service MUST validate AI outputs against defined strict data schemas before returning to the caller.

#### Tool-Aware Interface & Proposals
- **FR-005**: The Chat Interface MUST NOT write functional changes (Rules/Scenarios) directly to the permanent storage.
- **FR-006**: Instead of writing, the Chat Interface MUST return a `Proposal` object (extracted from tool usage) to the client.
- **FR-007**: System MUST provide a Confirmation Interface to accept a Proposal and persist it.

#### Data Models & Schemas
- **FR-008**: System MUST define strict data schemas for all core entities: `JournalRule`, `Account`, `Proposal`.
- **FR-009**: The Journal Rules storage MUST support structured definitions: `debitSide`, `creditSide` (structured data), `triggerType`, and `status`.
- **FR-010**: `amountFormula` MUST be retained as a human-readable/legacy field, but execution logic MUST derive from structured sides.

#### Conversation Storage
- **FR-011**: System MUST store conversation history, separating human text content from AI structured data (Proposals/Debug info).
- **FR-012**: System MUST migrate existing legacy conversation data to the new structure.

### Key Entities

- **Proposal**: A temporary, non-persisted object representing an intent to create/modify a resource (e.g., a candidate Journal Rule).
- **JournalRule (Structured)**: A persisted rule with explicit structured definitions for debit/credit logic, minimizing runtime parsing.
- **AI Service**: A centralized module responsible for the "Brain" logic, decoupled from external interfaces.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100% of Chat "write" operations** return a Proposal structure instead of modifying the data directly (verified via tests).
- **SC-002**: **Automated Tests** successfully validte the AI Service logic in isolation (mocking external providers).
- **SC-003**: **Migration Process** successfully converts standard Journal Rules to structured format (target > 80% auto-conversion) and flags the rest for review.
- **SC-004**: **Data Schemas** are used for both API input validation and AI output validation (single source of truth).

### Checklist for Validation
- [ ] AI Service implements retries.
- [ ] Client receives Proposal JSON.
- [ ] DB schema includes new JSON columns.
- [ ] History retains structured data.
