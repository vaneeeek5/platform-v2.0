import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Slug routing: /p/[slug]/...
// Admin routes: /admin/...
export const config = {
  matcher: ['/p/:path*', '/admin/:path*', '/api/p/:path*', '/api/admin/:path*'],
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get('platform_token')?.value
  const payload = token ? await verifyToken(token) : null

  // Not authenticated
  if (!payload) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // Pass user info via headers to server components
  const res = NextResponse.next()
  res.headers.set('x-user-id', String(payload.userId))
  res.headers.set('x-user-role', payload.role)
  res.headers.set('x-project-id', String(payload.projectId ?? ''))
  return res
}
