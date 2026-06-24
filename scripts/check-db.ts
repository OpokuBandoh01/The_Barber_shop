import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is not set!')
  process.exit(1)
}

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  try {
    const client = await pool.connect()
    console.log('Connected to database successfully.')

    const res = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `)

    console.log('\n--- Table RLS Status ---')
    console.table(res.rows)

    client.release()
  } catch (err) {
    console.error('Database query failed:', err)
  } finally {
    await pool.end()
  }
}

main()
