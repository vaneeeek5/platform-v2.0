import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Protect all platform routes and admin routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/expenses/:path*',
    '/reports/:path*',
    '/projects/:path*',
    '/settings/:path*',
    '/p/:path*',
    '/admin/:path*',
    '/api/leads/:path*',
    '/api/reports/:path*',
    '/api/sync/:path*',
  ],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get('platform_token')?.value
  const payload = token ? await verifyToken(token) : null

  // Not authenticated — redirect to login
  if (!payload) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Pass user info via headers to server components
  const res = NextResponse.next()
  res.headers.set('x-user-id', String(payload.userId))
  res.headers.set('x-user-role', payload.role)
  res.headers.set('x-project-id', String(payload.projectId ?? ''))
  return res
}
