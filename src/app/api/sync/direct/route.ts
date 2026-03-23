import { NextRequest, NextResponse } from 'next/server'
import { syncDirectQueue } from '@/workers'

// POST /api/sync/direct
export async function POST(req: NextRequest) {
  const { projectId, dateFrom, dateTo } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const job = await syncDirectQueue.add('sync', {
    projectId,
    dateFrom: dateFrom || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    dateTo: dateTo || new Date().toISOString().split('T')[0],
  })

  return NextResponse.json({ jobId: job.id, status: 'queued' })
}
