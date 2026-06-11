import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { timeSlots } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { slot } = await request.json()

    if (!slot) {
      return NextResponse.json({ error: 'Missing slot name' }, { status: 400 })
    }

    const [deleted] = await db
      .delete(timeSlots)
      .where(eq(timeSlots.slot, slot))
      .returning()

    return NextResponse.json(deleted)
  } catch (error: any) {
    console.error('Error deleting time slot:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
