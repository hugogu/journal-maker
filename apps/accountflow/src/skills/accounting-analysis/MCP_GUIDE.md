# Accounting Analysis Skill - MCP Server Guide

This guide explains how to use the Accounting Analysis Skill as an Anthropic Skill via the Model Context Protocol (MCP).

## What is MCP?

Model Context Protocol (MCP) is a standard protocol that allows AI assistants (like Claude) to discover and use external tools and capabilities. By running this skill as an MCP server, Claude can automatically invoke accounting analysis functions.

## Installation

### Prerequisites

1. Node.js 18+ installed
2. An AI provider API key (OpenAI, Azure, or local Ollama)

### Install Dependencies

```bash
cd apps/accountflow
npm install
```

This will install the MCP SDK and other dependencies.

## Configuration

### Environment Variables

The MCP server is configured via environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AI_PROVIDER_TYPE` | AI provider type (`openai`, `ollama`, `azure`) | `openai` | No |
| `AI_API_ENDPOINT` | API endpoint URL | `https://api.openai.com/v1` | No |
| `AI_API_KEY` | API key for the provider | - | Yes (except for Ollama) |
| `OPENAI_API_KEY` | Alternative to `AI_API_KEY` | - | Yes (for OpenAI) |
| `AI_MODEL` | Model name to use | `gpt-4` | No |

### Configuration Files

Example configurations are provided in the `config/` directory:

- `claude-desktop.json` - For Claude Desktop app
- `ollama.json` - For local Ollama models

## Usage

### Option 1: Claude Desktop

1. **Build the TypeScript code**:
   ```bash
   npm run build
   # Or compile the MCP server specifically
   npx tsc src/skills/accounting-analysis/mcp-server.ts --module nodenext --moduleResolution nodenext
   ```

2. **Update Claude Desktop configuration**:

   On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

   On Windows: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "accounting-analysis": {
         "command": "node",
         "args": [
           "/absolute/path/to/journal-maker/apps/accountflow/src/skills/accounting-analysis/mcp-server.js"
         ],
         "env": {
           "AI_PROVIDER_TYPE": "openai",
           "AI_API_KEY": "your-openai-api-key",
           "AI_MODEL": "gpt-4"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

4. **Use the skill in Claude**:
   ```
   Please analyze this business scenario using the accounting analysis skill:
   "公司销售商品收到现金10000元"
   ```

   Claude will automatically detect and use the accounting analysis tools.

### Option 2: Run Standalone MCP Server

```bash
# Set environment variables
export AI_PROVIDER_TYPE=openai
export OPENAI_API_KEY=your-api-key
export AI_MODEL=gpt-4

# Run the server
npm run mcp:server
```

The server will run on stdio, following the MCP protocol.

### Option 3: Claude Agent SDK

If you're building a custom agent with the Claude Agent SDK:

```typescript
import { Agent } from '@anthropic-ai/sdk/agent'

const agent = new Agent({
  mcpServers: [
    {
      name: 'accounting-analysis',
      command: 'node',
      args: ['/path/to/mcp-server.js'],
      env: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      }
    }
  ]
})

await agent.start()
```

### Option 4: Using with Local Ollama

For privacy-focused deployments with local models:

```bash
# Start Ollama
ollama serve

# Pull a model
ollama pull llama2

# Configure and run MCP server
export AI_PROVIDER_TYPE=ollama
export AI_API_ENDPOINT=http://localhost:11434
export AI_MODEL=llama2

npm run mcp:server
```

## Available Tools

The MCP server exposes three tools:

### 1. `analyze_accounting_scenario`

Analyzes a business scenario and generates accounting artifacts.

**Input:**
```json
{
  "businessScenario": "公司销售商品收到现金10000元",
  "accountingStandard": "CN",
  "companyContext": {
    "name": "Example Corp",
    "industry": "Retail",
    "vatRate": 0.13
  },
  "existingAccounts": [
    {
      "id": 1,
      "code": "1001",
      "name": "库存现金",
      "type": "asset",
      "direction": "debit"
    }
  ],
  "includeFlowDiagram": true
}
```

**Output:**
```json
{
  "subjects": [...],
  "journalRules": [...],
  "flowDiagram": "graph TD...",
  "reasoning": "...",
  "confidence": 0.95
}
```

### 2. `validate_journal_entry`

Validates a journal entry for correctness.

**Input:**
```json
{
  "entry": {
    "description": "销售商品",
    "debitSide": {
      "entries": [
        {
          "accountCode": "1001",
          "amount": 1000
        }
      ]
    },
    "creditSide": {
      "entries": [
        {
          "accountCode": "6001",
          "amount": 1000
        }
      ]
    }
  }
}
```

**Output:**
```json
{
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

### 3. `generate_sample_transaction`

Generates a sample transaction from a rule template.

**Input:**
```json
{
  "rule": {
    "eventName": "销售商品",
    "debitSide": {
      "entries": [
        {
          "accountCode": "1001",
          "amountFormula": "{{amount}}"
        }
      ]
    },
    "creditSide": {
      "entries": [
        {
          "accountCode": "6001",
          "amountFormula": "{{amount}}"
        }
      ]
    }
  },
  "variables": {
    "amount": 1000
  }
}
```

## Example Conversations with Claude

### Example 1: Simple Analysis

**User:**
```
Please use the accounting analysis skill to analyze:
"公司销售商品收到现金10000元"
```

**Claude:**
```
I'll analyze this business scenario using the accounting analysis skill.

[Calls analyze_accounting_scenario tool]

Based on the analysis, this is a simple cash sales transaction:

**Accounting Subjects:**
- 1001 库存现金 (Cash on Hand) - Debit
- 6001 主营业务收入 (Main Business Revenue) - Credit

**Journal Entry Rule:**
Debit: 库存现金 (1001) - 10,000
Credit: 主营业务收入 (6001) - 10,000

This follows the basic accounting principle: cash increases (debit) and revenue increases (credit).
```

### Example 2: Complex Transaction with VAT

**User:**
```
Analyze this scenario:
"公司销售商品,开具增值税专用发票,含税价格11300元,其中不含税价格10000元,增值税1300元,款项通过银行收到"
```

**Claude:**
```
[Uses accounting analysis skill]

This is a sales transaction with VAT:

**Accounting Subjects:**
- 1002 银行存款 (Bank Deposits) - Debit
- 6001 主营业务收入 (Revenue) - Credit
- 2221 应交税费-应交增值税(销项税额) (Output VAT) - Credit

**Journal Entry:**
Debit: 银行存款 (1002) - ¥11,300
Credit: 主营业务收入 (6001) - ¥10,000
Credit: 应交增值税 (2221) - ¥1,300

The entry is balanced and follows Chinese accounting standards for VAT handling.
```

### Example 3: Validation

**User:**
```
Please validate this journal entry:
Debit: 现金 1000
Credit: 收入 900

Is this correct?
```

**Claude:**
```
[Uses validate_journal_entry tool]

This entry is INVALID. The validation found the following error:

**Error:** Entry is unbalanced
- Debit total: 1,000
- Credit total: 900
- Difference: 100

Journal entries must always balance (debits = credits). Please adjust either the debit or credit to match.
```

## Troubleshooting

### Server won't start

**Check:**
1. Node.js version (must be 18+): `node --version`
2. Dependencies installed: `npm install`
3. Environment variables set correctly
4. API key is valid

**Logs:**
The server logs to stderr. Check Claude Desktop logs:
- macOS: `~/Library/Logs/Claude/mcp*.log`
- Windows: `%APPDATA%\Claude\Logs\mcp*.log`

### Claude doesn't see the skill

**Verify:**
1. Path to mcp-server.js is absolute and correct
2. Server appears in Claude Desktop's MCP servers list
3. Restart Claude Desktop after config changes

### AI provider errors

**OpenAI:**
- Check API key is valid
- Ensure you have credits/quota
- Try a different model (gpt-3.5-turbo is cheaper)

**Ollama:**
- Ensure Ollama is running: `ollama serve`
- Model is pulled: `ollama list`
- Endpoint is correct: `http://localhost:11434`

### Skill returns errors

**Common issues:**
1. Invalid business scenario format
2. Missing required fields
3. AI provider timeout (increase timeout in provider config)

**Debug mode:**
```bash
# Enable verbose logging
export DEBUG=mcp:*
npm run mcp:server
```

## Performance Tips

1. **Use lighter models for simple tasks**: gpt-3.5-turbo is faster and cheaper for basic analysis
2. **Cache results**: The skill supports storage adapters for caching
3. **Provide existing accounts**: Helps AI make better decisions and reduces API calls
4. **Be specific in scenarios**: More details = better analysis

## Security Considerations

1. **API Keys**: Never commit API keys to git. Use environment variables.
2. **Input Validation**: The skill validates all inputs before processing
3. **Local Models**: Use Ollama for sensitive financial data
4. **Audit Logging**: Consider adding logging for compliance

## Advanced Usage

### Custom AI Provider

Create a custom provider by implementing the `AIProvider` interface:

```typescript
import type { AIProvider } from './adapters/ai-provider'

class CustomProvider implements AIProvider {
  async analyzeScenario(input) {
    // Your custom implementation
  }
}
```

### Database Storage

Use the database adapter for persistent storage:

```typescript
import { DatabaseStorageAdapter } from './adapters/storage/database'

const skill = new AccountingAnalysisSkill({
  aiProvider,
  storage: new DatabaseStorageAdapter(dbOps),
})
```

### Multi-tenancy

Use storage context for multi-tenant scenarios:

```typescript
await skill.analyze(input, {
  save: true,
  context: {
    companyId: 123,
    userId: 456
  }
})
```

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/hugogu/journal-maker/issues
- Documentation: See README.md in the skill directory

## License

MIT - See LICENSE file
