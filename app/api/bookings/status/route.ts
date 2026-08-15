import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { bookings, services } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    // Retrieve the existing booking first
    const [bookingRecord] = await db.select().from(bookings).where(eq(bookings.id, id))
    if (!bookingRecord) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify payment with Paystack if transitioning from Pending to Confirmed for online bookings
    if (status === 'Confirmed' && bookingRecord.status === 'Pending') {
      const paymentReference = bookingRecord.paymentReference
      if (paymentReference && paymentReference !== 'walk-in') {
        // Query service price from DB
        const [serviceRecord] = await db.select().from(services).where(eq(services.id, bookingRecord.service))
        if (!serviceRecord) {
          return NextResponse.json({ error: 'Selected service not found' }, { status: 400 })
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY
        if (!secretKey) {
          console.error('PAYSTACK_SECRET_KEY is not configured!')
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
          return NextResponse.json({ error: 'Payment was not successful' }, { status: 400 })
        }

        // Verify currency
        const expectedCurrency = process.env.PAYSTACK_CURRENCY || 'GHS'
        if (paystackData.data.currency !== expectedCurrency) {
          return NextResponse.json({ error: 'Invalid payment currency' }, { status: 400 })
        }

        // Verify amount
        const expectedAmount = serviceRecord.price * 100
        if (paystackData.data.amount < expectedAmount) {
          return NextResponse.json({ error: 'Payment amount mismatch. Service price has changed' }, { status: 400 })
        }
      }
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning()

    return NextResponse.json(updatedBooking)
  } catch (error: any) {
    console.error('Error updating booking status:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
