#!/usr/bin/env node
/**
 * MCP Server for Accounting Analysis Skill
 * Exposes accounting analysis capabilities via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'

import { AccountingAnalysisSkill } from './skill.js'
import { createAIProvider } from './adapters/ai-provider.js'
import { MemoryStorageAdapter } from './adapters/storage/memory.js'
import type { AnalysisInput, JournalEntry, JournalRule } from './core/types.js'
import skillManifest from './skill.json' assert { type: 'json' }

/**
 * Configuration from environment variables
 */
const config = {
  aiProvider: {
    type: (process.env.AI_PROVIDER_TYPE as 'openai' | 'ollama') || 'openai',
    apiEndpoint: process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1',
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-4',
  },
}

/**
 * Initialize the accounting analysis skill
 */
const aiProvider = createAIProvider(
  {
    apiEndpoint: config.aiProvider.apiEndpoint,
    apiKey: config.aiProvider.apiKey,
    model: config.aiProvider.model,
  },
  config.aiProvider.type
)

const skill = new AccountingAnalysisSkill({
  aiProvider,
  storage: new MemoryStorageAdapter(),
})

/**
 * Define tools based on skill manifest
 */
const tools: Tool[] = skillManifest.tools.map(tool => ({
  name: tool.name,
  description: tool.description,
  inputSchema: tool.inputSchema as any,
}))

/**
 * Create MCP server
 */
const server = new Server(
  {
    name: skillManifest.name,
    version: skillManifest.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

/**
 * Handle tool list requests
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  }
})

/**
 * Handle tool call requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params

  try {
    let result: any

    switch (name) {
      case 'analyze_accounting_scenario': {
        const input: AnalysisInput = {
          businessScenario: args.businessScenario as string,
          accountingStandard: args.accountingStandard as any,
          companyContext: args.companyContext as any,
          existingAccounts: args.existingAccounts as any,
        }

        result = await skill.analyze(input)

        // Filter out flow diagram if not requested
        if (args.includeFlowDiagram === false) {
          delete result.flowDiagram
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'validate_journal_entry': {
        const entry = args.entry as JournalEntry
        result = skill.validateEntry(entry)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      case 'generate_sample_transaction': {
        const rule = args.rule as JournalRule
        const variables = args.variables as Record<string, number>
        result = skill.generateSample(rule, variables)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: errorMessage,
              tool: name,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    }
  }
})

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)

  // Log server info to stderr (stdout is used for MCP protocol)
  console.error('Accounting Analysis MCP Server started')
  console.error(`Version: ${skillManifest.version}`)
  console.error(`AI Provider: ${config.aiProvider.type}`)
  console.error(`Model: ${config.aiProvider.model}`)
  console.error(`Tools: ${tools.map(t => t.name).join(', ')}`)
}

main().catch((error) => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
