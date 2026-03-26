# Quick Start: Multi-Accounting System Support

**Feature**: Multi-Accounting System Support  
**Date**: 2026-03-26  
**Phase**: Phase 1 - Design & Contracts

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional, for local database)

## Development Setup

### 1. Install Dependencies

```bash
cd apps/accountflow
npm install
```

### 2. Environment Configuration

Ensure your `.env` file has:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/accountflow
OPENAI_API_KEY=your_key_here
OPENAI_API_ENDPOINT=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
AI_KEY_ENCRYPTION_SECRET=your_32_char_secret_key
MOCK_AI=true  # Set to false for production
```

### 3. Database Setup

```bash
# Generate migrations from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Seed built-in systems
npm run db:seed
```

**Note**: The seed will create:
- "Financial Reporting" (财报) - Built-in system
- "Management Reporting" (管报) - Built-in system

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## Feature Overview

### What Gets Created

1. **Database Tables** (via migrations):
   - `accounting_systems` - Core system definitions
   - `system_accounts` - Junction table (systems ↔ accounts)
   - `system_rules` - Junction table (systems ↔ rules)
   - `system_preferences` - System-specific settings

2. **API Endpoints**:
   - `/api/systems` - CRUD for accounting systems
   - `/api/systems/:id/accounts` - Manage system accounts
   - `/api/systems/:id/rules` - Manage system rules
   - `/api/systems/:id/preferences` - System preferences
   - `/api/scenarios/:id/analyze` - System-aware analysis
   - `/api/scenarios/:id/compare` - Cross-system comparison

3. **UI Components**:
   - `SystemSelector` - Reusable system dropdown
   - `SystemManager` - Admin page for system CRUD
   - `SystemIndicator` - Shows current system in analysis view
   - `SystemComparison` - Side-by-side comparison view

### Key Workflows

#### Creating a Custom System

1. Navigate to Admin → Systems
2. Click "New System"
3. Enter name and description
4. Select accounts to include
5. Configure preferences
6. Save

#### Analyzing with a System

1. Open a business scenario
2. Select accounting system from dropdown
3. Click "Analyze"
4. AI generates system-specific journal entries
5. Review and confirm results

#### Comparing Systems

1. Complete analysis with System A
2. Click "Compare with Another System"
3. Select System B
4. View side-by-side comparison
5. Review highlighted differences

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Create custom accounting system
- [ ] Assign accounts to system
- [ ] Create system-specific rule
- [ ] Analyze scenario with Financial Reporting
- [ ] Analyze same scenario with Management Reporting
- [ ] Compare results between systems
- [ ] Switch systems during analysis
- [ ] Archive and reactivate system
- [ ] Attempt to delete built-in system (should fail)
- [ ] Delete custom system with no analyses

## Common Issues

### Migration Errors

If migrations fail:

```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Or manually roll back
npm run db:migrate:down
```

### AI Context Not Loading

Ensure `system_id` is included in conversation metadata when calling AI endpoints.

### Accounts Not Appearing

Verify accounts are linked to the selected system via `system_accounts` junction table.

## Next Steps

1. Review API contracts in `/specs/001-accounting-systems/contracts/`
2. Check data model in `/specs/001-accounting-systems/data-model.md`
3. Run `/speckit.tasks` to generate implementation tasks

## Architecture Notes

### System Context Flow

```
User selects system
       ↓
System ID stored in global state (Pinia)
       ↓
API calls include system_id parameter
       ↓
Backend filters accounts/rules by system
       ↓
AI prompt includes system context
       ↓
Analysis results tagged with system_id
```

### Key Design Decisions

1. **Many-to-Many Relationships**: Accounts/rules can belong to multiple systems
2. **Built-in Protection**: Financial and Management systems cannot be deleted
3. **Shared Scenarios**: Business scenarios are system-agnostic
4. **Analysis Isolation**: Each analysis is tied to exactly one system
5. **Visual Comparison**: Side-by-side diff view with highlighting

## Support

- Technical questions: Check API contracts in `/contracts/`
- Data questions: Review `/data-model.md`
- Feature questions: See `/spec.md`
