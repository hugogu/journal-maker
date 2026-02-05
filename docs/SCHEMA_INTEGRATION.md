# Schema Integration Guide

This document explains how the Zod schemas are integrated and used throughout the application.

## Overview

The schemas defined in `apps/accountflow/src/server/utils/schemas.ts` are actively used in:

1. **API Validation** - Request body validation in endpoints
2. **AI Function Calling** - Structured data exchange with LLMs
3. **Type Safety** - TypeScript type inference throughout the application

## Key Integration Points

### 1. Account Management
- **Used in:** `apps/accountflow/src/server/api/accounts/index.ts`
- **Schemas:** `createAccountSchema`, `updateAccountSchema`, `AccountSchema`
- **Purpose:** Validate account creation/updates and AI account proposals

### 2. Journal Rules
- **Used in:** `apps/accountflow/src/server/api/journal-rules/[ruleId]/index.patch.ts`
- **Schemas:** `JournalRuleSchema`, `RuleProposalSchema`, `structuredJournalRuleSchema`
- **Purpose:** Validate rule updates and AI-generated rules

### 3. AI Function Calling
- **Used in:** `apps/accountflow/src/server/utils/function-calling.ts`
- **All schemas** converted to OpenAI function definitions via `zodToJsonSchema()`
- **Purpose:** Enable structured AI responses with validated data

### 4. Scenario Management
- **Used in:** `apps/accountflow/src/server/api/scenarios/`
- **Schemas:** `createScenarioSchema`, `updateScenarioSchema`, `ScenarioContextSchema`
- **Purpose:** Validate scenarios and provide context to AI

## Pre-defined AI Functions

1. **propose_account** - AI proposes new accounts using `AccountSchema`
2. **propose_journal_rule** - AI proposes rules using `RuleProposalSchema`
3. **create_journal_rule** - AI creates rules using `JournalRuleSchema`
4. **analyze_scenario** - AI analyzes context using `ScenarioContextSchema`

## Testing

- **39 tests passing**
  - 22 schema validation tests
  - 17 function calling tests

Run tests: `cd apps/accountflow && npm test`

## Resources

- Schemas: `apps/accountflow/src/server/utils/schemas.ts`
- Function Calling: `apps/accountflow/src/server/utils/function-calling.ts`
- Demo Endpoint: `apps/accountflow/src/server/api/scenarios/[id]/ai-function-call.post.ts`
- Tests: `tests/schemas.test.ts` and `tests/function-calling.test.ts`
