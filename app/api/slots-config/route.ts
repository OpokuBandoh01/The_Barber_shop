import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { slotsConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const results = await db.select().from(slotsConfig)
    const config: Record<string, number> = {}
    for (const row of results) {
      config[row.date] = row.capacity
    }
    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Error fetching slots config:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { date, capacity } = await request.json()

    if (!date || capacity === undefined || capacity < 0) {
      return NextResponse.json({ error: 'Invalid date or capacity' }, { status: 400 })
    }

    const [saved] = await db
      .insert(slotsConfig)
      .values({ date, capacity })
      .onConflictDoUpdate({
        target: slotsConfig.date,
        set: { capacity },
      })
      .returning()

    return NextResponse.json(saved)
  } catch (error: any) {
    console.error('Error saving slots config:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
