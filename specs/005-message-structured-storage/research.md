# Phase 0 Research: 消息与结构化产出分离存储

## Decisions

### 1) Continue with existing Nuxt + Postgres + Drizzle stack
- **Decision**: Use the current Nuxt 3 app, PostgreSQL 15+, and drizzle-orm for all storage changes.
- **Rationale**: Aligns with constitution (lightweight, single app) and existing project tooling.
- **Alternatives considered**: New service or separate storage layer (rejected for extra complexity).

### 2) Standardize on `conversation_messages` as the single message store
- **Decision**: Treat `conversation_messages` as the canonical table for all conversation messages and structured payloads.
- **Rationale**: Avoids split storage across `conversations` and `conversationMessages` and supports auditability.
- **Alternatives considered**: Keep multiple tables and sync them (rejected due to drift risk).

### 3) Store structured payload alongside message content using JSONB
- **Decision**: Persist `structuredData`, `requestLog`, and `responseStats` as JSONB on message records.
- **Rationale**: JSONB enables flexible AI response schemas and aligns with constitution’s structured-output requirement.
- **Alternatives considered**: Separate tables per payload type (rejected as over-normalization for evolving schemas).

### 4) Extract AI analysis artifacts into dedicated tables
- **Decision**: Persist subjects, journal entries, and diagrams as standalone artifacts linked to scenario and message.
- **Rationale**: Enables reuse, auditability, and targeted queries for visualization and export.
- **Alternatives considered**: Embed artifacts inside message payload only (rejected due to query difficulty).

### 5) Add executable structure to Journal Rules while keeping human-readable formula
- **Decision**: Add `debitSide`, `creditSide`, `triggerType`, and `status` fields; keep `amountFormula` for readability.
- **Rationale**: Structured rules support validation/simulation while retaining audit-friendly descriptions.
- **Alternatives considered**: Only store text formula (rejected for lack of machine execution).
