# Schema Integration Flow Diagram

## Complete Data Flow: From Schema Definition to Usage

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Zod Schema Definitions                                │
│              (apps/accountflow/src/server/utils/schemas.ts)             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │  AccountSchema   │  │ JournalRuleSchema│  │ ScenarioContext     │  │
│  │                  │  │                   │  │ Schema              │  │
│  │  - code          │  │  - eventName      │  │  - scenarioId       │  │
│  │  - name          │  │  - debitSide      │  │  - availableAccounts│  │
│  │  - type          │  │  - creditSide     │  │  - existingRules    │  │
│  │  - direction     │  │  - amountFormula  │  │  - fiscalPeriod     │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────────┘  │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │ RuleProposal     │  │   EntrySide      │                            │
│  │ Schema           │  │   (enum)         │                            │
│  │                  │  │                  │                            │
│  │  - eventName     │  │  - debit         │                            │
│  │  - reasoning     │  │  - credit        │                            │
│  │  - confidence    │  │                  │                            │
│  │  - alternatives  │  │                  │                            │
│  └──────────────────┘  └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐
        │  API Routes   │  │ AI Functions   │  │  Type Exports    │
        │  Validation   │  │   Calling      │  │                  │
        └───────────────┘  └────────────────┘  └──────────────────┘
                │                   │                     │
                │                   │                     │
    ┌───────────┴──────┐   ┌────────┴──────────┐   ┌────┴─────┐
    ▼                  ▼   ▼                   ▼   ▼          ▼
┌─────────┐      ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────┐
│Accounts │      │ Journal │  │zodToJson │  │Function  │  │Type │
│  API    │      │ Rules   │  │ Schema() │  │Calling   │  │Safe │
│         │      │  API    │  │          │  │Utility   │  │Code │
└─────────┘      └─────────┘  └──────────┘  └──────────┘  └─────┘
    │                  │            │              │            │
    │ parse()          │ parse()    │              │            │
    ▼                  ▼            ▼              ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Validated Data                            │
│                                                                  │
│  • Type-safe TypeScript objects                                 │
│  • Guaranteed to match schema constraints                       │
│  • Ready for database operations                                │
│  • Ready for AI processing                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Flow 1: API Request Validation

```
Client Request
    │
    │ POST /api/accounts
    │ { code: "1001", name: "Cash", ... }
    │
    ▼
┌──────────────────────────────────────┐
│  Account API Handler                 │
│  (accounts/index.ts)                 │
├──────────────────────────────────────┤
│  const data = createAccountSchema    │
│    .parse(body)  ◄─────────────────┐ │
│                                     │ │
│  If invalid: throws ZodError        │ │
│  If valid: continue                 │ │
└──────────────────────────────────────┘ │
    │                                    │
    │ Validated data                     │
    ▼                                    │
┌──────────────────────────────────────┐ │
│  Database Insert                     │ │
│  db.insert(accounts).values(data)    │ │
└──────────────────────────────────────┘ │
    │                                    │
    │ Success                            │
    ▼                                    │
┌──────────────────────────────────────┐ │
│  Response to Client                  │ │
│  { data: account }                   │ │
└──────────────────────────────────────┘ │
                                         │
                    Schema Used Here ────┘
```

## Flow 2: AI Function Calling with Schema Validation

```
User Input: "Create a rule for sales transactions"
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Service                                                  │
│  (ai-service.ts)                                            │
├─────────────────────────────────────────────────────────────┤
│  1. Get function definitions from schemas                   │
│     const tools = getAvailableTools() ◄──────────────────┐  │
│                                                           │  │
│  2. Make AI request with tools                           │  │
│     const result = await adapter.chatCompletion({        │  │
│       messages: [...],                                   │  │
│       tools: tools  // Schema-based functions            │  │
│     })                                                    │  │
└─────────────────────────────────────────────────────────────┘  │
    │                                                            │
    │ AI Response with function call                             │
    ▼                                                            │
┌─────────────────────────────────────────────────────────────┐  │
│  Function Call Validation                                    │  │
│  (function-calling.ts)                                       │  │
├─────────────────────────────────────────────────────────────┤  │
│  const validation = validateFunctionCall(                   │  │
│    'propose_journal_rule',                                  │  │
│    aiArgs  ◄────────────────────────────────────────────┐  │  │
│  )                                                        │  │  │
│                                                           │  │  │
│  if (validation.success) {                                │  │  │
│    // Use validated data (type-safe!)                     │  │  │
│    const rule: RuleProposalSchemaType = validation.data  │  │  │
│  }                                                         │  │  │
└─────────────────────────────────────────────────────────────┘  │  │
    │                                                              │  │
    │ Validated, type-safe data                                   │  │
    ▼                                                              │  │
┌─────────────────────────────────────────────────────────────┐  │  │
│  Business Logic Processing                                   │  │  │
│  - Create journal rule in database                          │  │  │
│  - Return structured response                               │  │  │
└─────────────────────────────────────────────────────────────┘  │  │
                                                                  │  │
                    Schemas Used Here ────────────────────────────┴──┘
                    1. Convert schema to function definition
                    2. Validate AI response against schema
```

## Flow 3: Complete E2E Example

```
User: "Analyze this sales scenario and create accounting rules"
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Schema → Function Definition                                    │
│     (function-calling.ts)                                           │
├─────────────────────────────────────────────────────────────────────┤
│  const tools = [                                                    │
│    createToolDefinition(                                            │
│      'propose_journal_rule',                                        │
│      'Propose journal entry rule...',                               │
│      RuleProposalSchema  ◄─── Schema input                         │
│    )                                                                │
│  ]                                                                  │
│                                                                     │
│  // Internally calls zodToJsonSchema()                             │
│  const jsonSchema = zodToJsonSchema(RuleProposalSchema)            │
│  // Returns OpenAI-compatible JSON Schema                          │
└─────────────────────────────────────────────────────────────────────┘
    │
    │ Tool definitions
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. AI Request with Tools                                           │
│     (ai-service.ts + openai.ts)                                    │
├─────────────────────────────────────────────────────────────────────┤
│  OpenAI API Call:                                                   │
│  {                                                                  │
│    model: "gpt-4",                                                  │
│    messages: [...],                                                 │
│    tools: [                                                         │
│      {                                                              │
│        type: "function",                                            │
│        function: {                                                  │
│          name: "propose_journal_rule",                             │
│          parameters: { /* JSON Schema from RuleProposalSchema */ } │
│        }                                                            │
│      }                                                              │
│    ]                                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
    │
    │ AI responds with function call
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. AI Response                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    tool_calls: [{                                                   │
│      function: {                                                    │
│        name: "propose_journal_rule",                               │
│        arguments: JSON.stringify({                                  │
│          eventName: "Sales Transaction",                           │
│          debitSide: { accountCode: "1001", accountName: "Cash" },  │
│          creditSide: { accountCode: "4001", accountName: "Revenue" },│
│          reasoning: "Standard sales entry...",                      │
│          confidence: 0.95                                           │
│        })                                                           │
│      }                                                              │
│    }]                                                               │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
    │
    │ Parse arguments
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. Validation Against Schema                                       │
│     (function-calling.ts)                                           │
├─────────────────────────────────────────────────────────────────────┤
│  const args = JSON.parse(toolCall.function.arguments)              │
│                                                                     │
│  const validation = validateFunctionCall(                          │
│    'propose_journal_rule',                                          │
│    args                                                             │
│  )                                                                  │
│                                                                     │
│  // Internally uses RuleProposalSchema.safeParse(args)             │
│  // Returns { success: true, data: validatedData }                 │
│  // or      { success: false, error: errorMessage }                │
└─────────────────────────────────────────────────────────────────────┘
    │
    │ validation.success === true
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. Type-Safe Business Logic                                        │
│     (API handler)                                                   │
├─────────────────────────────────────────────────────────────────────┤
│  if (validation.success) {                                          │
│    // TypeScript knows the exact type!                             │
│    const rule: RuleProposalSchemaType = validation.data            │
│                                                                     │
│    // All fields are typed and validated:                          │
│    console.log(rule.eventName)        // string                    │
│    console.log(rule.confidence)       // number (0-1)              │
│    console.log(rule.debitSide.accountCode)  // string              │
│                                                                     │
│    // Save to database                                             │
│    await db.insert(journalRules).values({                          │
│      eventName: rule.eventName,                                    │
│      debitSide: rule.debitSide,                                    │
│      creditSide: rule.creditSide,                                  │
│      // ... all fields are type-safe                               │
│    })                                                               │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
    │
    │ Success
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. Response to User                                                │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    message: "I've analyzed the scenario...",                       │
│    functionCalls: [{                                                │
│      functionName: "propose_journal_rule",                         │
│      validation: "success",                                         │
│      data: { /* validated rule proposal */ }                       │
│    }]                                                               │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Benefits of This Architecture

### 1. Type Safety at Every Step
```typescript
// Schema definition provides TypeScript type
export type RuleProposalSchemaType = z.infer<typeof RuleProposalSchema>

// Used everywhere
const handleRule = (rule: RuleProposalSchemaType) => {
  // TypeScript autocomplete and type checking!
  console.log(rule.eventName)
  console.log(rule.confidence)
}
```

### 2. Single Source of Truth
```
Schema Definition
      │
      ├─→ TypeScript Types
      ├─→ Runtime Validation
      ├─→ JSON Schema for AI
      ├─→ API Documentation
      └─→ Test Cases
```

### 3. Fail Fast with Clear Errors
```typescript
// Invalid data rejected immediately
const result = AccountSchema.safeParse({
  code: "",  // ❌ Too short
  name: "Cash",
  type: "invalid"  // ❌ Not in enum
})

// result.success === false
// result.error.errors contains detailed error info
```

### 4. AI Integration Without Manual JSON
```typescript
// Instead of manually writing JSON Schema:
const tools = [{
  type: "function",
  function: {
    name: "propose_account",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", minLength: 1, maxLength: 20 },
        name: { type: "string", minLength: 1, maxLength: 100 },
        // ... hundreds of lines of JSON
      }
    }
  }
}]

// Just use the schema:
const tools = getAvailableTools()
// All schemas automatically converted!
```

## Summary

**Schema Usage Flow:**
1. ✅ Define once in Zod
2. ✅ Convert to JSON Schema for AI
3. ✅ Validate API requests
4. ✅ Validate AI responses
5. ✅ Export TypeScript types
6. ✅ Test all validations
7. ✅ Use type-safe data everywhere

**Result:** Type-safe, validated, maintainable code from a single schema definition!
