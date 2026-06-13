import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { admins } from '@/lib/db/schema'
import { count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [result] = await db.select({ value: count() }).from(admins)
    const setupRequired = result.value === 0

    return NextResponse.json({ setupRequired })
  } catch (error) {
    console.error('Failed to check setup requirement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
