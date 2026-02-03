import { defineEventHandler, getRouterParam } from 'h3'
import { getConversationShareByToken } from '../../../db/queries/conversation-shares'
import { getConversationMessages } from '../../../db/queries/conversations'
import { db } from '../../../db'
import { scenarios } from '../../../db/schema'
import { eq } from 'drizzle-orm'

async function getScenario(id: number) {
  return db.query.scenarios.findFirst({
    where: eq(scenarios.id, id)
  })
}

export default defineEventHandler(async (event) => {
  try {
    const token = getRouterParam(event, 'token')

    if (!token) {
      return {
        success: false,
        error: 'Share token required'
      }
    }

    const share = await getConversationShareByToken(token)

    if (!share) {
      return {
        success: false,
        error: 'Share not found or revoked'
      }
    }

    // Get scenario info
    const scenario = await getScenario(share.scenarioId)

    if (!scenario) {
      return {
        success: false,
        error: 'Scenario not found'
      }
    }

    // Get messages
    const messages = await getConversationMessages(share.scenarioId)

    // Generate Markdown content
    const markdown = generateMarkdownExport(scenario, messages)

    // Set headers for file download
    event.node.res.setHeader('Content-Type', 'text/markdown')
    event.node.res.setHeader('Content-Disposition', `attachment; filename="${scenario.name}-conversation.md"`)

    return markdown
  } catch (error: any) {
    console.error('Failed to export conversation:', error)
    return {
      success: false,
      error: error.message || 'Failed to export conversation'
    }
  }
})

function generateMarkdownExport(scenario: any, messages: any[]): string {
  const lines: string[] = []
  
  lines.push(`# ${scenario.name}`)
  lines.push('')
  
  if (scenario.description) {
    lines.push(`> ${scenario.description}`)
    lines.push('')
  }
  
  lines.push('---')
  lines.push('')
  
  for (const message of messages) {
    const role = message.role === 'user' ? '**用户**' : '**AI助手**'
    const time = new Date(message.timestamp).toLocaleString('zh-CN')
    
    lines.push(`${role} (${time})`)
    lines.push('')
    lines.push(message.content)
    lines.push('')
    lines.push('---')
    lines.push('')
  }
  
  return lines.join('\n')
}
