import { db } from '../index'
import { aiProviders, aiModels, userPreferences } from '../schema'
import { eq, desc } from 'drizzle-orm'
import type { AIProvider, AIModel, UserPreference } from '../types'

// Get all AI providers with their models
export async function getAIProviders() {
  const providers = await db.query.aiProviders.findMany({
    orderBy: desc(aiProviders.isDefault),
  })

  return Promise.all(
    providers.map(async (provider) => {
      const models = await db.query.aiModels.findMany({
        where: eq(aiModels.providerId, provider.id),
      })
      return { ...provider, models }
    })
  )
}

// Get a single provider with models
export async function getAIProvider(id: number) {
  const provider = await db.query.aiProviders.findFirst({
    where: eq(aiProviders.id, id),
  })

  if (!provider) return null

  const models = await db.query.aiModels.findMany({
    where: eq(aiModels.providerId, id),
  })

  return { ...provider, models }
}

// Create a new AI provider
export async function createAIProvider(data: {
  name: string
  type: 'openai' | 'azure' | 'ollama' | 'custom'
  apiEndpoint: string
  apiKey: string
  isDefault?: boolean
}) {
  const [provider] = await db.insert(aiProviders)
    .values({ 
      name: data.name,
      type: data.type,
      apiEndpoint: data.apiEndpoint,
      apiKey: data.apiKey,
      isDefault: data.isDefault ?? false,
      status: 'active' as const
    })
    .returning()
  return provider
}

// Update an AI provider
export async function updateAIProvider(
  id: number,
  data: Partial<{
    name: string
    apiEndpoint: string
    apiKey: string
    isDefault: boolean
    status: 'active' | 'inactive'
  }>
) {
  const [updated] = await db.update(aiProviders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(aiProviders.id, id))
    .returning()
  return updated
}

// Delete an AI provider
export async function deleteAIProvider(id: number) {
  await db.delete(aiProviders).where(eq(aiProviders.id, id))
}

// Create a model for a provider
export async function createAIModel(data: {
  providerId: number
  modelId: string
  name: string
  description?: string | null
  contextLength?: number | null
}) {
  const [model] = await db.insert(aiModels)
    .values({ ...data })
    .returning()
  return model
}

// Update a model
export async function updateAIModel(
  id: number,
  data: Partial<{
    name: string
    description: string | null
    contextLength: number | null
  }>
) {
  const [updated] = await db.update(aiModels)
    .set(data)
    .where(eq(aiModels.id, id))
    .returning()
  return updated
}

// Delete a model
export async function deleteAIModel(id: number) {
  await db.delete(aiModels).where(eq(aiModels.id, id))
}

// Get user preferences
export async function getUserPreferences(userId: number) {
  return db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
    with: {
      preferredProvider: true,
    },
  })
}

// Set user preferences
export async function setUserPreferences(
  userId: number,
  data: {
    preferredProviderId?: number | null
    preferredModel?: string | null
  }
) {
  const existing = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  })

  if (existing) {
    const [updated] = await db.update(userPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning()
    return updated
  } else {
    const [created] = await db.insert(userPreferences)
      .values({ userId, ...data })
      .returning()
    return created
  }
}
