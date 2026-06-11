import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { services } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    let results = await db.select().from(services)
    if (results.length === 0) {
      const defaultServicesDb = [
        { id: 'haircut', name: 'Classic Haircut', price: 25, description: 'Classic clipper or scissors cut with hot lather neck shave' },
        { id: 'fade', name: 'Premium Fade', price: 30, description: 'Skin fade, taper fade, or bald fade with precision line-up' },
        { id: 'beard-trim', name: 'Beard Trim', price: 15, description: 'Beard shaping, line-up, and conditioning oil treatment' },
        { id: 'hot-shave', name: 'Hot Towel Shave', price: 20, description: 'Traditional straight razor shave with essential oils and hot towels' },
        { id: 'lineup', name: 'Lineup', price: 10, description: 'Sharpening of the hairline, temples, and neck' },
        { id: 'combo', name: 'Full Combo', price: 50, description: 'Haircut, beard styling, lineup, and hot towel treatment' },
      ]
      await db.insert(services).values(defaultServicesDb)
      results = await db.select().from(services)
    }
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { id, name, price, description, isEditing } = data

    if (!name || price === undefined || price < 0) {
      return NextResponse.json({ error: 'Invalid name or price' }, { status: 400 })
    }

    let result
    if (isEditing && id) {
      const [updated] = await db
        .update(services)
        .set({
          name,
          price,
          description: description || '',
        })
        .where(eq(services.id, id))
        .returning()
      result = updated
    } else {
      const generatedId = id || name.toLowerCase().replace(/\s+/g, '-')
      const [created] = await db
        .insert(services)
        .values({
          id: generatedId,
          name,
          price,
          description: description || '',
        })
        .returning()
      result = created
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error saving service:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
