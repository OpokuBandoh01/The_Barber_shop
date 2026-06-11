import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { timeSlots } from '@/lib/db/schema'

export async function GET() {
  try {
    let results = await db.select().from(timeSlots)
    if (results.length === 0) {
      const defaultSlots = [
        '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
      ].map(slot => ({ slot }))
      await db.insert(timeSlots).values(defaultSlots)
      results = await db.select().from(timeSlots)
    }
    const timeToMinutes = (t: string) => {
      const [timePart, modifier] = t.split(' ')
      let [hours, minutes] = timePart.split(':').map(Number)
      if (modifier === 'PM' && hours < 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }
    const sorted = results.map(row => row.slot)
    try {
      sorted.sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
    } catch (e) {
      sorted.sort()
    }
    return NextResponse.json(sorted)
  } catch (error: any) {
    console.error('Error fetching time slots:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { slot } = await request.json()

    if (!slot) {
      return NextResponse.json({ error: 'Missing slot name' }, { status: 400 })
    }

    const [created] = await db
      .insert(timeSlots)
      .values({ slot })
      .onConflictDoNothing()
      .returning()

    return NextResponse.json(created || { slot })
  } catch (error: any) {
    console.error('Error creating time slot:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
