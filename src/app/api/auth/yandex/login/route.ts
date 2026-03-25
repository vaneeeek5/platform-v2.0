import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
  }

  const clientId = process.env.YANDEX_CLIENT_ID
  const redirectUri = `${req.nextUrl.origin}/api/auth/yandex/callback`
  
  // Scopes for Metrika and Direct
  const scope = 'metrika:read metrika:write direct:read'
  
  const yandexAuthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${projectId}`

  const response = NextResponse.redirect(yandexAuthUrl)
  
  // Store projectId in a secure cookie to verify it on callback
  response.cookies.set('yandex_oauth_project_id', projectId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
