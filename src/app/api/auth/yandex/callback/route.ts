import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') // This is the projectId we passed
  
  const storedProjectId = req.cookies.get('yandex_oauth_project_id')?.value
  const projectId = state || storedProjectId

  if (!code || !projectId) {
    return NextResponse.redirect(`${req.nextUrl.origin}/settings?error=oauth_failed`)
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.YANDEX_CLIENT_ID!,
        client_secret: process.env.YANDEX_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      console.error('[Yandex OAuth] Failed to get token:', tokenData)
      return NextResponse.redirect(`${req.nextUrl.origin}/settings?error=token_error`)
    }

    // Update project in database
    await db.update(schema.projects)
      .set({
        metrikaToken: tokenData.access_token,
        directToken: tokenData.access_token,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, parseInt(projectId)))

    const response = NextResponse.redirect(`${req.nextUrl.origin}/settings?success=yandex_connected`)
    response.cookies.delete('yandex_oauth_project_id')
    return response

  } catch (error) {
    console.error('[Yandex OAuth] Callback error:', error)
    return NextResponse.redirect(`${req.nextUrl.origin}/settings?error=internal_error`)
  }
}
