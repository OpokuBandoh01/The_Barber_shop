import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/db'
import { admins } from '@/lib/db/schema'
import { count } from 'drizzle-orm'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      const errorMsg = result.error.errors.map(err => err.message).join(', ')
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const { email, name, password } = result.data
    const normalizedEmail = email.trim().toLowerCase()

    // 1. Check if any admin exists
    const [adminCount] = await db.select({ value: count() }).from(admins)
    const databaseIsEmpty = adminCount.value === 0

    // 2. If admins exist, verify session cookie
    if (!databaseIsEmpty) {
      const cookieStore = await cookies()
      const session = cookieStore.get('admin_session')?.value
      if (session !== 'authenticated_admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin setup is already locked down' },
          { status: 403 }
        )
      }
    }

    return await executeRegistration(normalizedEmail, name, password, databaseIsEmpty)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

async function executeRegistration(email: string, name: string, password: string, isFirstAdmin: boolean) {
  const { eq } = await import('drizzle-orm')

  const existing = await db.select().from(admins).where(eq(admins.email, email)).limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ success: false, error: 'Email address already registered' }, { status: 400 })
  }

  // Insert admin
  const [newAdmin] = await db.insert(admins).values({
    email,
    name,
    password,
  }).returning({
    id: admins.id,
    email: admins.email,
    name: admins.name,
  })

  const response = NextResponse.json({ success: true, admin: newAdmin })

  // If this is the first admin being created, automatically log them in by setting the session cookie
  if (isFirstAdmin) {
    response.cookies.set('admin_session', 'authenticated_admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    response.cookies.set('admin_name', newAdmin.name, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  return response
}
