import { defineEventHandler } from 'h3'
import { getConversationShareByToken } from '../../db/queries/conversation-shares'
import { getConversationMessages } from '../../db/queries/conversations'
import { db } from '../../db'
import { scenarios } from '../../db/schema'
import { eq } from 'drizzle-orm'

async function getScenario(id: number) {
  return db.query.scenarios.findFirst({
    where: eq(scenarios.id, id),
  })
}

export default defineEventHandler(async (event) => {
  try {
    // Extract token from URL path /api/shares/[token] or /api/shares/[token]/export
    const path = event.node.req.url || ''
    const match = path.match(/\/api\/shares\/([^\/]+)/)
    const token = match ? match[1] : ''
    const isExport = path.includes('/export')

    if (!token) {
      return {
        success: false,
        error: 'Share token required',
      }
    }

    const share = await getConversationShareByToken(token)

    if (!share) {
      return {
        success: false,
        error: 'Share not found or revoked',
      }
    }

    // Get scenario info
    const scenario = await getScenario(share.scenarioId)

    if (!scenario) {
      return {
        success: false,
        error: 'Scenario not found',
      }
    }

    // Get messages
    const messages = await getConversationMessages(share.scenarioId)

    // If export, generate Markdown
    if (isExport) {
      const markdown = generateMarkdownExport(scenario, messages)
      event.node.res.setHeader('Content-Type', 'text/markdown')
      event.node.res.setHeader(
        'Content-Disposition',
        `attachment; filename="${scenario.name}-conversation.md"`
      )
      return markdown
    }

    // Otherwise return JSON
    return {
      success: true,
      data: {
        scenario: {
          id: scenario.id,
          name: scenario.name,
          description: scenario.description,
        },
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
        })),
        sharedAt: share.createdAt,
      },
    }
  } catch (error: any) {
    console.error('Failed to get shared conversation:', error)
    return {
      success: false,
      error: error.message || 'Failed to get shared conversation',
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
    const time = new Date(message.createdAt).toLocaleString('zh-CN')

    lines.push(`${role} (${time})`)
    lines.push('')
    lines.push(message.content)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}
