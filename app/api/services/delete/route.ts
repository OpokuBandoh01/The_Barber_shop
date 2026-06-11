import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { services } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing service id' }, { status: 400 })
    }

    const [deletedService] = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning()

    return NextResponse.json(deletedService)
  } catch (error: any) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
