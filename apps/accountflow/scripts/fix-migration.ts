import postgres from 'postgres'

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/accountflow'
const sql = postgres(connectionString)

async function migrate() {
  console.log('Adding missing columns to conversation_messages...')

  await sql`
    ALTER TABLE conversation_messages
    ADD COLUMN IF NOT EXISTS structured_data JSONB,
    ADD COLUMN IF NOT EXISTS request_log JSONB,
    ADD COLUMN IF NOT EXISTS response_stats JSONB
  `

  console.log('Columns added successfully!')
  await sql.end()
}

migrate().catch(console.error)
