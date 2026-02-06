import { db } from './index'
import { companies, users, aiProviders, accounts } from './schema'

async function seed() {
  console.log('Seeding database...')

  // Create default company
  const [company] = await db.insert(companies).values({
    name: 'Default Company',
    industry: 'Technology'
  }).onConflictDoNothing().returning()

  console.log('Created company:', company?.id || 'already exists')

  // Create admin user
  await db.insert(users).values({
    companyId: company?.id || 1,
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin'
  }).onConflictDoNothing()

  // Create default AI provider
  await db.insert(aiProviders).values({
    name: 'OpenAI',
    type: 'openai',
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: '',
    defaultModel: 'gpt-4',
    isDefault: true,
    status: 'active'
  }).onConflictDoNothing()

  // Create default accounts
  const defaultAccounts = [
    { code: '1001', name: '现金', type: 'asset', direction: 'debit' },
    { code: '1002', name: '银行存款', type: 'asset', direction: 'debit' },
    { code: '2202', name: '应付账款', type: 'liability', direction: 'credit' },
    { code: '4001', name: '实收资本', type: 'equity', direction: 'credit' },
    { code: '6001', name: '主营业务收入', type: 'revenue', direction: 'credit' },
    { code: '6401', name: '主营业务成本', type: 'expense', direction: 'debit' },
  ]

  for (const acc of defaultAccounts) {
    await db.insert(accounts).values({
      companyId: company?.id || 1,
      code: acc.code,
      name: acc.name,
      type: acc.type as any,
      direction: acc.direction as any
    }).onConflictDoNothing()
  }

  console.log('Seed completed!')
  process.exit(0)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
