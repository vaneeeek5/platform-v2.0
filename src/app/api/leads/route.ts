import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { schema } from '@/db'
import { syncDirectQueue, syncMetrikaQueue } from '@/workers'
import { eq } from 'drizzle-orm'
import { getCached, setCached, cacheKey, invalidateByTag } from '@/lib/cache'

// GET /api/leads?projectId=1&page=1&limit=50&status=new&from=2024-01-01&to=2024-12-31
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const projectId = parseInt(searchParams.get('projectId') || '0')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const cKey = cacheKey('leads', projectId, page, limit, status || '', from || '', to || '')
  const cached = await getCached(cKey)
  if (cached) return NextResponse.json(cached)

  const conditions = [eq(schema.leads.projectId, projectId)]
  // Note: filtering by status, date etc. can be extended with drizzle `and()` 

  const offset = (page - 1) * limit
  const leads = await db.query.leads.findMany({
    where: eq(schema.leads.projectId, projectId),
    limit,
    offset,
    orderBy: (leads, { desc }) => [desc(leads.date)],
    with: { manager: true },
  })

  const result = { leads, page, limit }
  await setCached(cKey, result, 60)
  return NextResponse.json(result)
}

// PATCH /api/leads/:id — inline editing (manager notes, status)
export const PATCH = async (req: NextRequest) => {
  const id = parseInt(req.nextUrl.pathname.split('/').pop() || '0')
  const body = await req.json()

  const allowed: (keyof typeof schema.leads.$inferInsert)[] = ['status', 'managerNotes', 'managerId']
  const update: Partial<typeof schema.leads.$inferInsert> = {}
  for (const key of allowed) {
    if (key in body) (update as Record<string, unknown>)[key] = body[key]
  }

  await db.update(schema.leads).set(update).where(eq(schema.leads.id, id))
  await invalidateByTag('leads')

  return NextResponse.json({ success: true })
}
