import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { passcode } = await request.json()
    const cleanPasscode = (passcode || '').trim()
    const expectedPasscode = (process.env.ADMIN_PASSCODE || 'admin123').trim()

    if (cleanPasscode === expectedPasscode) {
      const response = NextResponse.json({ success: true })
      
      response.cookies.set('admin_session', 'authenticated_admin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
      })

      return response
    } else {
      return NextResponse.json({ success: false, error: 'Invalid passcode' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
