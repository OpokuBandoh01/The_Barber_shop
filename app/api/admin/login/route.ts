import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db'
import { admins } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Find the admin user
    const [admin] = await db.select().from(admins).where(eq(admins.email, normalizedEmail)).limit(1)

    if (!admin) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }

    // Verify the password (plaintext check)
    if (admin.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set('admin_session', 'authenticated_admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    response.cookies.set('admin_name', admin.name, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
