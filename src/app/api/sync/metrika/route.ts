import { NextRequest, NextResponse } from 'next/server'
import { syncMetrikaQueue, syncDirectQueue } from '@/workers'

// POST /api/sync/metrika
export async function POST(req: NextRequest) {
  const { projectId, dateFrom, dateTo } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const job = await syncMetrikaQueue.add('sync', {
    projectId,
    dateFrom: dateFrom || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    dateTo: dateTo || new Date().toISOString().split('T')[0],
  })

  return NextResponse.json({ jobId: job.id, status: 'queued' })
}
