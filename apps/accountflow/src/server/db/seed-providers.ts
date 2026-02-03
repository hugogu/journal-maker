import { db } from './index'
import { aiProviders } from './schema'
import { encrypt } from '../utils/encryption'

export async function seedDefaultAIProvider() {
  console.log('Checking for default AI provider...')

  // Check if any provider exists
  const existing = await db.query.aiProviders.findFirst()

  if (existing) {
    console.log('AI provider already exists, skipping...')
    return
  }

  // Create default OpenAI provider (placeholder - user needs to configure)
  const [provider] = await db.insert(aiProviders)
    .values({
      name: 'OpenAI',
      type: 'openai',
      apiEndpoint: 'https://api.openai.com/v1',
      apiKey: encrypt('sk-placeholder-replace-with-real-key'),
      defaultModel: 'gpt-4',
      isDefault: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning()

  console.log(`Default AI provider created with ID: ${provider.id}`)
  console.log('NOTE: Please update the API key in Admin > AI Config')
}
