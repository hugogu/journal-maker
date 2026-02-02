import { db } from '../index'
import { conversationMessages } from '../schema'
import { eq, asc } from 'drizzle-orm'
import type { ConversationMessage } from '../types'

// Get all messages for a scenario
export async function getConversationMessages(scenarioId: number) {
  return db.query.conversationMessages.findMany({
    where: eq(conversationMessages.scenarioId, scenarioId),
    orderBy: asc(conversationMessages.timestamp)
  })
}

// Create a new conversation message
export async function createConversationMessage(data: {
  scenarioId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  requestLog?: any
  responseStats?: any
}) {
  const [message] = await db.insert(conversationMessages)
    .values({
      ...data,
      timestamp: new Date(),
      requestLog: data.requestLog || null,
      responseStats: data.responseStats || null
    })
    .returning()
  return message
}

// Delete all messages for a scenario
export async function deleteConversationMessages(scenarioId: number) {
  await db.delete(conversationMessages)
    .where(eq(conversationMessages.scenarioId, scenarioId))
}
