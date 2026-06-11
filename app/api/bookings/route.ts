import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { bookings, services } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    let results
    if (dateParam) {
      results = await db.select().from(bookings).where(eq(bookings.date, dateParam))
    } else {
      results = await db.select().from(bookings).orderBy(desc(bookings.createdAt))
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { name, phone, email, date, time, service, notes, paymentReference } = data

    if (!name || !phone || !email || !date || !time || !service) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Paystack payment verification
    if (paymentReference !== 'walk-in') {
      if (!paymentReference) {
        return NextResponse.json({ error: 'Payment reference is required for online booking' }, { status: 400 })
      }

      // Query service price from DB
      const [serviceRecord] = await db.select().from(services).where(eq(services.id, service))
      if (!serviceRecord) {
        return NextResponse.json({ error: 'Selected service not found' }, { status: 400 })
      }

      const secretKey = process.env.PAYSTACK_SECRET_KEY
      if (!secretKey) {
        console.error('PAYSTACK_SECRET_KEY is not configured in environmental variables!')
        return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 })
      }

      // Verify transaction reference with Paystack
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      })

      if (!paystackRes.ok) {
        const errorText = await paystackRes.text()
        console.error('Paystack verification request failed:', errorText)
        return NextResponse.json({ error: 'Failed to verify payment with Paystack' }, { status: 400 })
      }

      const paystackData = await paystackRes.json()
      if (!paystackData.status || paystackData.data.status !== 'success') {
        return NextResponse.json({ error: 'Payment transaction was not successful' }, { status: 400 })
      }

      // Verify currency
      const expectedCurrency = process.env.PAYSTACK_CURRENCY || 'GHS'
      if (paystackData.data.currency !== expectedCurrency) {
        return NextResponse.json({ error: 'Invalid payment currency' }, { status: 400 })
      }

      // Verify amount (Paystack reports in pesewas/cents, so we multiply DB price by 100)
      const expectedAmount = serviceRecord.price * 100
      if (paystackData.data.amount < expectedAmount) {
        return NextResponse.json({ error: 'Payment amount mismatch. Service price has changed' }, { status: 400 })
      }
    }

    // Insert booking into database
    const [newBooking] = await db.insert(bookings).values({
      name,
      phone,
      email,
      date,
      time,
      service,
      notes: notes || '',
      status: 'Confirmed',
      paymentReference: paymentReference || null,
    }).returning()

    return NextResponse.json(newBooking)
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

