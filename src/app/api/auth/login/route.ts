import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { schema } from '@/db'
import { signToken } from '@/lib/auth'
import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'admin' | 'manager',
      projectId: user.projectId,
    })

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    })

    res.cookies.set('platform_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return res
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
