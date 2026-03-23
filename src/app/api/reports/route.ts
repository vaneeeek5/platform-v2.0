import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { schema } from '@/db'
import { eq, sum, count, between, and } from 'drizzle-orm'
import { getCached, setCached, cacheKey } from '@/lib/cache'

// GET /api/reports?projectId=1&from=2024-01-01&to=2024-12-31
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const projectId = parseInt(searchParams.get('projectId') || '0')
  const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const to = searchParams.get('to') || new Date().toISOString().split('T')[0]

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const cKey = cacheKey('reports', projectId, from, to)
  const cached = await getCached(cKey)
  if (cached) return NextResponse.json(cached)

  const dateFrom = new Date(from)
  const dateTo = new Date(to)

  // Leads count
  const [{ totalLeads }] = await db
    .select({ totalLeads: count() })
    .from(schema.leads)
    .where(and(eq(schema.leads.projectId, projectId), between(schema.leads.date, dateFrom, dateTo)))

  // Total spend
  const [{ totalSpend }] = await db
    .select({ totalSpend: sum(schema.expenses.spend) })
    .from(schema.expenses)
    .where(and(eq(schema.expenses.projectId, projectId), between(schema.expenses.date, dateFrom, dateTo)))

  const spendNum = parseFloat(String(totalSpend || '0'))
  const leadsNum = parseInt(String(totalLeads || '0'))
  const cpl = leadsNum > 0 ? spendNum / leadsNum : 0

  // Leads by source
  const leadsBySource = await db
    .select({ source: schema.leads.source, cnt: count() })
    .from(schema.leads)
    .where(and(eq(schema.leads.projectId, projectId), between(schema.leads.date, dateFrom, dateTo)))
    .groupBy(schema.leads.source)

  // Leads by status
  const leadsByStatus = await db
    .select({ status: schema.leads.status, cnt: count() })
    .from(schema.leads)
    .where(eq(schema.leads.projectId, projectId))
    .groupBy(schema.leads.status)

  const result = {
    kpi: {
      totalLeads: leadsNum,
      totalSpend: spendNum,
      cpl: Math.round(cpl * 100) / 100,
    },
    leadsBySource,
    leadsByStatus,
    dateRange: { from, to },
  }

  await setCached(cKey, result, 300)
  return NextResponse.json(result)
}
