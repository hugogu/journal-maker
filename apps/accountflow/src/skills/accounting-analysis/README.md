# Accounting Analysis Skill

An AI-powered, reusable skill for analyzing business scenarios and generating accounting artifacts (subjects, journal rules, flow diagrams).

## Features

- 🤖 **AI-Powered Analysis**: Leverages LLMs to understand business scenarios
- 📊 **Structured Output**: Generates accounting subjects, journal rules, and flow diagrams
- 🔌 **Pluggable Architecture**: Supports multiple AI providers (OpenAI, Ollama, custom)
- 💾 **Flexible Storage**: In-memory, database, or custom storage adapters
- ✅ **Validation**: Built-in validation for accounting rules and entries
- 🌍 **Multi-Standard**: Supports CN, US GAAP, IFRS accounting standards
- 🧪 **Testable**: Includes mock providers for testing
- 📦 **Framework-Agnostic**: Can be used in any TypeScript/Node.js project

## Installation

The skill is currently part of the `accountflow` application. To use it:

```typescript
import {
  AccountingAnalysisSkill,
  OpenAIProvider,
  MemoryStorageAdapter,
  AccountingStandard
} from '@/skills/accounting-analysis'
```

## Quick Start

### Basic Usage

```typescript
// 1. Configure AI provider
const aiProvider = new OpenAIProvider({
  apiEndpoint: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
})

// 2. Create skill instance
const skill = new AccountingAnalysisSkill({
  aiProvider,
  storage: new MemoryStorageAdapter(), // Optional
})

// 3. Analyze a business scenario
const result = await skill.analyze({
  businessScenario: "公司销售商品收到现金10000元",
  companyContext: {
    accountingStandard: AccountingStandard.CN,
  },
})

console.log('Subjects:', result.subjects)
console.log('Rules:', result.journalRules)
console.log('Diagram:', result.flowDiagram)
```

### With Existing Accounts

```typescript
const result = await skill.analyze({
  businessScenario: "购买办公用品,支付现金500元",
  existingAccounts: [
    { id: 1, code: '1001', name: '库存现金', type: 'asset', direction: 'debit' },
    { id: 2, code: '6601', name: '管理费用', type: 'expense', direction: 'debit' },
  ],
  companyContext: {
    accountingStandard: AccountingStandard.CN,
  },
})
```

### With Database Storage

```typescript
import { DatabaseStorageAdapter } from '@/skills/accounting-analysis'
import * as queries from '@/server/db/queries/analysis'

// Create database operations wrapper
const dbOps = {
  getSubjects: queries.getAnalysisSubjects,
  saveSubjects: queries.saveAnalysisSubjects,
  confirmSubjects: queries.confirmAnalysisSubjects,
  deleteSubjects: queries.deleteAnalysisSubjects,
  getEntries: queries.getAnalysisEntries,
  saveEntries: queries.saveAnalysisEntries,
  confirmEntries: queries.confirmAnalysisEntries,
  deleteEntries: queries.deleteAnalysisEntries,
  getDiagram: queries.getAnalysisDiagram,
  saveDiagram: queries.saveAnalysisDiagram,
  deleteDiagram: queries.deleteAnalysisDiagram,
}

const skill = new AccountingAnalysisSkill({
  aiProvider,
  storage: new DatabaseStorageAdapter(dbOps),
  defaultContext: { scenarioId: 1 },
})

// Analyze and save to database
const result = await skill.analyze(
  { businessScenario: "..." },
  { save: true, context: { scenarioId: 1 } }
)
```

## API Reference

### AccountingAnalysisSkill

Main skill class providing all analysis capabilities.

#### Methods

##### `analyze(input, options?)`

Analyze a business scenario and generate accounting artifacts.

```typescript
const result = await skill.analyze({
  businessScenario: "业务场景描述",
  companyContext: {
    accountingStandard: AccountingStandard.CN,
    industry: "Technology",
  },
  existingAccounts: [...],
}, {
  save: true,
  context: { scenarioId: 1 }
})
```

##### `refine(analysisId, feedback, options?)`

Refine an existing analysis based on feedback.

```typescript
const refined = await skill.refine(
  "analysis_123",
  "请增加增值税的处理"
)
```

##### `validateEntry(entry)`

Validate a journal entry for correctness.

```typescript
const validation = skill.validateEntry({
  description: "销售商品",
  debitSide: { entries: [{ accountCode: "1001", amount: 1000 }] },
  creditSide: { entries: [{ accountCode: "6001", amount: 1000 }] }
})

if (!validation.isValid) {
  console.error(validation.errors)
}
```

##### `generateSample(rule, variables)`

Generate a sample transaction from a rule template.

```typescript
const transaction = skill.generateSample(rule, {
  amount: 1000,
  vatRate: 0.13
})
```

### AI Providers

#### OpenAIProvider

```typescript
const provider = new OpenAIProvider({
  apiEndpoint: 'https://api.openai.com/v1',
  apiKey: 'sk-...',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 4000,
})
```

#### OllamaProvider

For local models:

```typescript
const provider = new OllamaProvider({
  apiEndpoint: 'http://localhost:11434',
  model: 'llama2',
  temperature: 0.7,
})
```

#### MockAIProvider

For testing:

```typescript
const provider = new MockAIProvider({
  subjects: [...],
  journalRules: [...],
})
```

### Storage Adapters

#### MemoryStorageAdapter

Simple in-memory storage (not persistent):

```typescript
const storage = new MemoryStorageAdapter()
```

#### DatabaseStorageAdapter

Persist to relational database:

```typescript
const storage = new DatabaseStorageAdapter(dbOperations)
```

#### Custom Adapter

Implement your own:

```typescript
class MyCustomAdapter extends BaseStorageAdapter {
  async save(result, context?) { /* ... */ }
  async load(id, context?) { /* ... */ }
  async delete(id, context?) { /* ... */ }
  async list(context?) { /* ... */ }
  async update(id, updates, context?) { /* ... */ }
}
```

## Core Types

### AnalysisInput

```typescript
interface AnalysisInput {
  businessScenario: string              // Required: scenario description
  companyContext?: CompanyContext       // Optional: company information
  existingAccounts?: ExistingAccount[]  // Optional: chart of accounts
  accountingStandard?: AccountingStandard // CN, US_GAAP, or IFRS
  constraints?: string[]                // Optional: additional constraints
  previousAnalysis?: AnalysisResult     // For refinement
}
```

### AnalysisResult

```typescript
interface AnalysisResult {
  id?: string
  scenario: string
  subjects: AccountingSubject[]
  journalRules: JournalRule[]
  flowDiagram?: string
  confidence?: number
  reasoning?: string
  warnings?: string[]
  analyzedAt?: Date
  sourceMessageId?: number | null
  metadata?: Record<string, unknown>
}
```

### AccountingSubject

```typescript
interface AccountingSubject {
  code: string
  name: string
  direction: 'debit' | 'credit' | 'both'
  type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  description?: string
  parentCode?: string
  accountId?: number | null
  metadata?: Record<string, unknown>
}
```

### JournalRule

```typescript
interface JournalRule {
  id?: number
  eventName: string
  eventDescription?: string
  debitSide: JournalEntrySide
  creditSide: JournalEntrySide
  variables?: string[]
  metadata?: Record<string, unknown>
}
```

## Validation

The skill includes comprehensive validation:

```typescript
// Validate journal entry
const entryValidation = skill.validateEntry(entry)
if (!entryValidation.isValid) {
  console.error('Errors:', entryValidation.errors)
  console.warn('Warnings:', entryValidation.warnings)
}

// Validate journal rule
const ruleValidation = skill.validateRule(rule)

// Validate accounting subjects
const subjectsValidation = skill.validateSubjects(subjects)

// Validate formula
const formulaValidation = skill.validateFormula("{{amount}} * 0.13")
```

## Examples

### Example 1: Sales Transaction

```typescript
const result = await skill.analyze({
  businessScenario: "公司销售商品,收到银行存款50000元,其中不含税价格44247.79元,增值税5752.21元",
  companyContext: {
    accountingStandard: AccountingStandard.CN,
    taxInfo: { vatRate: 0.13 }
  },
})

// Result:
// subjects: [
//   { code: '1002', name: '银行存款', direction: 'debit' },
//   { code: '6001', name: '主营业务收入', direction: 'credit' },
//   { code: '2221', name: '应交税费-应交增值税(销项税额)', direction: 'credit' }
// ]
// journalRules: [
//   {
//     eventName: '销售商品',
//     debitSide: { entries: [{ accountCode: '1002', amountFormula: '{{amount}}' }] },
//     creditSide: { entries: [
//       { accountCode: '6001', amountFormula: '{{amount}} / 1.13' },
//       { accountCode: '2221', amountFormula: '{{amount}} * 0.13 / 1.13' }
//     ]}
//   }
// ]
```

### Example 2: Purchase with VAT

```typescript
const result = await skill.analyze({
  businessScenario: "购入原材料一批,取得增值税专用发票,价款10000元,增值税1300元,款项已通过银行支付",
  companyContext: {
    accountingStandard: AccountingStandard.CN,
  },
})
```

### Example 3: Refinement

```typescript
// Initial analysis
const initial = await skill.analyze({
  businessScenario: "公司支付员工工资",
}, { save: true })

// User provides feedback
const refined = await skill.refine(
  initial.id!,
  "需要考虑个人所得税和社保的代扣代缴",
  { save: true }
)
```

## Architecture

```
skill.ts (Main API)
├── core/
│   ├── analyzer.ts    - Business logic
│   ├── validator.ts   - Validation rules
│   └── types.ts       - Type definitions
└── adapters/
    ├── ai-provider.ts - AI service integration
    └── storage/
        ├── base.ts    - Storage interface
        ├── memory.ts  - In-memory impl
        └── database.ts - DB impl
```

## Testing

```typescript
import { AccountingAnalysisSkill, MockAIProvider } from '@/skills/accounting-analysis'

describe('AccountingAnalysisSkill', () => {
  it('should analyze a simple scenario', async () => {
    const mockProvider = new MockAIProvider({
      subjects: [
        { code: '1001', name: '现金', direction: 'debit' }
      ],
      journalRules: [...]
    })

    const skill = new AccountingAnalysisSkill({ aiProvider: mockProvider })
    const result = await skill.analyze({
      businessScenario: "测试场景"
    })

    expect(result.subjects).toHaveLength(1)
    expect(result.subjects[0].code).toBe('1001')
  })
})
```

## Future Enhancements

- [ ] Support for more accounting standards (Japan, EU, etc.)
- [ ] Multi-currency support
- [ ] Batch analysis for multiple scenarios
- [ ] Export to accounting software formats (XML, CSV)
- [ ] Integration with tax calculation services
- [ ] Audit trail and change history
- [ ] Rule template library
- [ ] MCP (Model Context Protocol) server implementation

## License

Part of the journal-maker project.

## Contributing

This skill is designed to be framework-agnostic and reusable. Contributions are welcome!
