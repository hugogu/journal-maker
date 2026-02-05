import { db } from '../index'
import { conversationShares } from '../schema'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'

// Generate unique share token
function generateToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

// Get all shares for a scenario
export async function getConversationShares(scenarioId: number) {
  return db.query.conversationShares.findMany({
    where: eq(conversationShares.scenarioId, scenarioId),
    orderBy: (shares, { desc }) => [desc(shares.createdAt)],
  })
}

// Create a new share
export async function createConversationShare(scenarioId: number, name?: string) {
  const shareToken = generateToken()
  const [share] = await db
    .insert(conversationShares)
    .values({
      scenarioId,
      shareToken,
      createdAt: new Date(),
    })
    .returning()
  return share
}

// Get share by token
export async function getConversationShareByToken(shareToken: string) {
  return db.query.conversationShares.findFirst({
    where: and(
      eq(conversationShares.shareToken, shareToken),
      eq(conversationShares.isRevoked, false)
    ),
  })
}

// Revoke a share
export async function revokeConversationShare(shareId: number) {
  const [share] = await db
    .update(conversationShares)
    .set({ isRevoked: true, revokedAt: new Date() })
    .where(eq(conversationShares.id, shareId))
    .returning()
  return share
}
