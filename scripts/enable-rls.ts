import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is not set!')
  process.exit(1)
}

const tables = [
  'slots_config',
  'time_slots',
  'services',
  'bookings',
  'admins',
]

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  try {
    const client = await pool.connect()
    console.log('Connected to database successfully.')

    console.log('\n--- Enabling Row-Level Security (RLS) ---')
    for (const table of tables) {
      console.log(`Enabling RLS on public.${table}...`)
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`)
    }

    console.log('\n--- Verifying RLS Status ---')
    const res = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `)
    console.table(res.rows)

    client.release()
    console.log('\nAll tables secured successfully!')
  } catch (err) {
    console.error('Failed to enable RLS:', err)
  } finally {
    await pool.end()
  }
}

main()
