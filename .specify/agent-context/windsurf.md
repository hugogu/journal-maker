# Windsurf Agent Context

**Project**: AccountFlow - AI辅助会计规则分析工具  
**Feature**: 002-prompt-ai-management (Prompt版本化管理与AI服务增强)  
**Updated**: 2026-02-02

---

## Active Technologies (from Constitution)

- **Framework**: Nuxt 3 (Vue 3 + SSR)
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL 15+ with drizzle-orm
- **AI Integration**: OpenAI-compatible API (multi-provider support)
- **Visualization**: Mermaid.js, TanStack Table
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: Docker + Docker Compose

---

## Current Feature Focus

### Prompt Management
- Versioned Prompt templates per scenario type
- AI-assisted Prompt generation
- Variable extraction and validation

### Multi-Provider AI
- Support for OpenAI, Azure, Ollama, custom providers
- Automatic model list fetching and caching
- User preference for Provider/Model selection

### Conversation Enhancements
- Database persistence (replacing localStorage)
- Request logging for debugging
- Response statistics (tokens, timing)
- Export to Markdown/JSON
- Shareable links with unique tokens

### Company Profile
- Centralized company information
- Automatic injection into AI prompts as context

---

## Database Schema (Current Feature)

### New Tables
- `prompt_templates` - Template registry with active version pointer
- `prompt_versions` - Immutable version history
- `ai_providers` - Multi-provider configuration
- `ai_models` - Cached model lists per provider
- `company_profile` - Company information (single row)
- `conversation_messages` - Individual messages with logs/stats
- `conversation_shares` - Share link management
- `user_preferences` - User's AI preferences

### Modified Tables
- `ai_configs` → migrating to `ai_providers` (backward compatible)
- `conversations` → migrating to `conversation_messages` (structural change)

---

## Key Composables to Implement

```typescript
// usePrompts.ts - Prompt CRUD and versioning
// useAIProviders.ts - Provider and model management
// useCompany.ts - Company profile
// useConversation.ts - Enhanced with export/share/stats
```

---

## API Routes to Implement

### New Routes
- `/api/prompts/**` - Prompt management
- `/api/ai-providers/**` - Provider configuration
- `/api/company` - Company profile
- `/api/shares/**` - Share link management

### Extended Routes
- `/api/scenarios/:id/conversations/**` - Database persistence
- `/api/scenarios/:id/chat` - Provider selection support

---

## Migration Notes

1. **Data Migration**: localStorage → Database (one-time)
2. **Schema Migration**: Add new tables, preserve existing data
3. **Config Migration**: Single AIConfig → Multi AIProvider (default flag)

---

## Prohibited Patterns (Constitution)

- No microservices (single Nuxt app)
- No ORM overhead (use drizzle-orm directly)
- No external auth (simple role-based)
- No real-time WebSockets (polling sufficient)

---

## Manual Additions

<!-- Add any project-specific context below this line -->

