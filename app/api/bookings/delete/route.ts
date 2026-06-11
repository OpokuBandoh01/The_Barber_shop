import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { bookings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing booking id' }, { status: 400 })
    }

    const [deletedBooking] = await db
      .delete(bookings)
      .where(eq(bookings.id, id))
      .returning()

    return NextResponse.json(deletedBooking)
  } catch (error: any) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
