import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('Warning: DATABASE_URL environment variable is not set!')
}

const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/barbershop',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
})

export const db = drizzle(pool, { schema })
export type DbClient = typeof db
