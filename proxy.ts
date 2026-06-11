import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin') && path !== '/admin/login') {
    const session = request.cookies.get('admin_session')?.value

    if (!session || session !== 'authenticated_admin') {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
