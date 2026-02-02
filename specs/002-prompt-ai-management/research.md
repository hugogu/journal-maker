# Research: Prompt版本化管理与AI服务增强

**Feature**: Prompt版本化管理与AI服务增强  
**Date**: 2026-02-02  
**Status**: Phase 0 Complete

---

## Research Areas

### 1. Multi-AI Provider Architecture

**Question**: How to support multiple AI providers (OpenAI, Azure, Ollama) with a unified interface?

**Decision**: Use a provider-agnostic abstraction layer with per-provider adapters.

**Rationale**:
- All providers support OpenAI-compatible API format (most common denominator)
- Each provider has a `/models` endpoint (or equivalent) for model discovery
- Configuration-driven provider selection at runtime
- Allows easy addition of new providers without code changes

**Alternatives considered**:
- Hardcoded provider classes (rejected: requires code changes for new providers)
- External proxy service (rejected: adds infrastructure complexity, violates Constitution I)

**Implementation approach**:
```typescript
interface AIProvider {
  id: string
  name: string
  type: 'openai' | 'azure' | 'ollama' | 'custom'
  baseUrl: string
  apiKey: string
  fetchModels(): Promise<Model[]>
  chatCompletion(params: ChatParams): Promise<ChatResponse>
}
```

---

### 2. Prompt Versioning Strategy

**Question**: How to version Prompt templates efficiently?

**Decision**: Git-like versioning with immutable versions and mutable "active" pointer.

**Rationale**:
- Immutable versions ensure reproducibility (important for AI analysis)
- Active version pointer allows quick switching without migration
- Version history provides audit trail for compliance
- Matches Constitution II (Prompts are versioned and auditable)

**Implementation approach**:
- `prompt_templates` table: id, scenario_type, name, description, active_version_id
- `prompt_versions` table: id, template_id, version_number, content, variables, created_at
- Each edit creates new version record, active_version_id updated atomically

---

### 3. Conversation Persistence: LocalStorage vs Database

**Question**: How to migrate from localStorage to database while maintaining UX?

**Decision**: Database as source of truth with optimistic UI updates.

**Rationale**:
- localStorage has 5MB limit (exceeded with long conversations)
- No cross-device synchronization with localStorage
- Database persistence enables sharing feature (required by FR-016)
- Real-time persistence with <500ms latency is achievable

**Migration strategy**:
1. Phase 1: Implement DB persistence alongside localStorage (dual-write)
2. Phase 2: Add data migration from localStorage to DB (one-time)
3. Phase 3: Remove localStorage dependency

---

### 4. Share Link Security Model

**Question**: How to secure shared conversation links?

**Decision**: Cryptographically random tokens with optional expiration.

**Rationale**:
- UUIDs are guessable (predictable structure)
- Random tokens (32+ chars) provide sufficient entropy
- No authentication required (per clarification: public links)
- Revocation supported via `is_revoked` flag

**Implementation approach**:
- Token: `crypto.randomBytes(16).toString('hex')` (32 chars)
- URL format: `/share/{token}`
- Database lookup on access, 404 if revoked/not found

---

### 5. Request Logging & Token Counting

**Question**: How to capture request logs and token statistics?

**Decision**: Extend ConversationMessage with structured metadata.

**Rationale**:
- OpenAI-compatible APIs return usage stats in response
- Request logs (system prompt + context + user message) needed for debugging
- Storage overhead acceptable (text content, compressible)
- Real-time display requires immediate persistence

**Implementation approach**:
```typescript
interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  requestLog?: {
    systemPrompt: string
    contextMessages: Array<{role: string, content: string}>
    fullPrompt: string
  }
  responseStats?: {
    model: string
    providerId: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    durationMs: number
  }
}
```

---

### 6. Model List Caching Strategy

**Question**: How to cache and refresh provider model lists?

**Decision**: In-memory cache with 1-hour TTL, stale-while-revalidate pattern.

**Rationale**:
- Model lists change infrequently (months between updates)
- Frequent API calls waste resources and risk rate limiting
- Stale-while-revalidate provides good UX (fast display, background refresh)
- Manual refresh button for immediate updates

**Implementation approach**:
- Cache: Map<providerId, {models: Model[], fetchedAt: Date}>
- TTL: 1 hour
- Background refresh on cache hit if stale
- Expose manual refresh API for admin

---

## Technical Decisions Summary

| Area | Decision | Key Files |
|------|----------|-----------|
| Multi-Provider | Provider abstraction layer | `server/utils/ai-service.ts` |
| Prompt Versioning | Immutable versions + active pointer | `db/schema.ts` (prompt_templates, prompt_versions) |
| Persistence | Database with localStorage migration | `composables/useConversation.ts` |
| Share Links | Random tokens, public access | `server/api/shares/` |
| Request Logging | Extended message metadata | `db/schema.ts` (conversation_messages) |
| Model Caching | 1-hour TTL, stale-while-revalidate | `composables/useAIProviders.ts` |

---

## Open Questions (Deferred to Implementation)

1. **Rate limiting**: Should Provider APIs have client-side rate limiting? (Defer: monitoring first)
2. **Prompt validation**: Should AI-generated Prompts be validated before saving? (Defer: basic syntax check only)
3. **Conversation archiving**: Auto-archive conversations older than N days? (Defer: manual archive for now)

**Phase 0 Complete**: Research findings ready for Phase 1 design.
