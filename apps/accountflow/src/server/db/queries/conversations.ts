import { db } from '../index'
import { conversationMessages } from '../schema'
import { eq, asc, and, isNotNull } from 'drizzle-orm'
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
  structuredData?: any
  requestLog?: any
  responseStats?: any
}) {
  const [message] = await db.insert(conversationMessages)
    .values({
      ...data,
      timestamp: new Date(),
      structuredData: data.structuredData || null,
      requestLog: data.requestLog || null,
      responseStats: data.responseStats || null
    })
    .returning()
  return message
}

// Get a single message by ID
export async function getConversationMessageById(id: number) {
  return db.query.conversationMessages.findFirst({
    where: eq(conversationMessages.id, id)
  })
}

// Delete all messages for a scenario
export async function deleteConversationMessages(scenarioId: number) {
  await db.delete(conversationMessages)
    .where(eq(conversationMessages.scenarioId, scenarioId))
}

// Confirm a message
export async function confirmMessage(messageId: number, scenarioId: number) {
  // First, unconfirm all other messages in this scenario
  await db.update(conversationMessages)
    .set({ confirmedAt: null })
    .where(and(
      eq(conversationMessages.scenarioId, scenarioId),
      eq(conversationMessages.role, 'assistant'), // Only unconfirm assistant messages
      isNotNull(conversationMessages.confirmedAt) // Only those that are currently confirmed
    ))
  
  // Then confirm the new message
  const [message] = await db.update(conversationMessages)
    .set({ confirmedAt: new Date() })
    .where(
      eq(conversationMessages.id, messageId)
    )
    .returning()
  
  // Save and confirm analysis data from this message
  if (message.structuredData) {
    const structuredData = message.structuredData as any
    const { subjects, rules, diagrams } = structuredData
    if (subjects || rules || diagrams) {
      // Import the analysis functions
      const { saveAndConfirmAnalysis } = await import('./analysis')
      
      await saveAndConfirmAnalysis(
        scenarioId,
        subjects || [],
        rules || [],
        diagrams?.mermaid || null,
        messageId
      )
    }
  }
  
  return message
}

// Get the currently confirmed message for a scenario
export async function getConfirmedMessage(scenarioId: number) {
  return db.query.conversationMessages.findFirst({
    where: and(
      eq(conversationMessages.scenarioId, scenarioId),
      eq(conversationMessages.role, 'assistant'),
      isNotNull(conversationMessages.confirmedAt)
    ),
    orderBy: asc(conversationMessages.confirmedAt) // Get the most recently confirmed
  })
}
