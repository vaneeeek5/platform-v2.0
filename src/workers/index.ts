import { Worker, Queue, Job } from 'bullmq'
import { db } from '@/db'
import { schema } from '@/db'
import { getCampaignStats } from '@/lib/yandex/direct'
import { getConversions, getGoals } from '@/lib/yandex/metrika'
import { eq } from 'drizzle-orm'

// Parse Redis URL into host/port for BullMQ
// (avoids ioredis version type conflict — BullMQ bundles its own ioredis)
const redisUrl = new URL(process.env.REDIS_URL || 'redis://redis:6379/0')
const bullConnection = { host: redisUrl.hostname, port: parseInt(redisUrl.port || '6379') }

// ---- Queues ----
export const syncMetrikaQueue = new Queue('sync-metrika', { connection: bullConnection })
export const syncDirectQueue = new Queue('sync-direct', { connection: bullConnection })
export const aiQueue = new Queue('ai-recommendations', { connection: bullConnection })

// ---- Metrika Sync Worker ----
const metrikaWorker = new Worker(
  'sync-metrika',
  async (job: Job) => {
    const { projectId, dateFrom, dateTo } = job.data
    console.log(`[Worker] Syncing Metrika for project ${projectId}`)

    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    })
    
    // Fallback to global token if project-specific one is missing
    const token = project?.metrikaToken || process.env.YANDEX_METRIKA_TOKEN
    const counterId = project?.metrikaCounterId

    if (!counterId || !token) {
      throw new Error(`Metrika not configured for project ${projectId}. Need Counter ID and Token.`)
    }

    // Get goals
    const goals = await getGoals(token, counterId)

    // ... sync goals logic ...
    for (const goal of goals) {
      await db
        .insert(schema.goals)
        .values({
          projectId,
          metrikaGoalId: String(goal.id),
          name: goal.name,
          type: goal.type,
        })
        .onConflictDoUpdate({
          target: [schema.goals.projectId, schema.goals.metrikaGoalId],
          set: { name: goal.name, type: goal.type },
        })
    }

    // Get conversions
    const goalIds = goals.map((g) => String(g.id))
    const conversions = await getConversions(token, counterId, dateFrom, dateTo, goalIds)
    // ... rest of conversions logic ...

    let processed = 0
    for (const conv of conversions) {
      const goal = await db.query.goals.findFirst({
        where: eq(schema.goals.metrikaGoalId, conv.goal_id),
      })
      if (goal) {
        await db.insert(schema.goalConversions).values({
          projectId,
          goalId: goal.id,
          date: new Date(conv.date),
          conversions: conv.conversions,
          revenue: String(conv.revenue),
        })
        processed++
      }
    }

    return { processed }
  },
  { connection: bullConnection, concurrency: 2 }
)

// ---- Direct Sync Worker ----
const directWorker = new Worker(
  'sync-direct',
  async (job: Job) => {
    const { projectId, dateFrom, dateTo } = job.data
    console.log(`[Worker] Syncing Direct for project ${projectId}`)

    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    })
    
    // Fallback to global token
    const token = project?.directToken || process.env.YANDEX_DIRECT_TOKEN
    
    if (!token) {
      throw new Error(`Direct Token not found for project ${projectId} (and no global fallback).`)
    }

    const stats = await getCampaignStats(token, dateFrom, dateTo)
    // ... rest of stats logic ...
    let processed = 0

    for (const stat of stats) {
      await db.insert(schema.expenses).values({
        projectId,
        date: new Date(stat.date),
        campaignId: stat.campaignId,
        campaignName: stat.campaignName,
        clicks: stat.clicks,
        impressions: stat.impressions,
        spend: String(stat.spend),
        cpc: String(stat.cpc),
        ctr: String(stat.ctr),
      })
      processed++
    }

    return { processed }
  },
  { connection: bullConnection, concurrency: 2 }
)

// ---- Error handlers ----
metrikaWorker.on('failed', (job, err) => {
  console.error(`[Worker] Metrika job ${job?.id} failed:`, err.message)
})
directWorker.on('failed', (job, err) => {
  console.error(`[Worker] Direct job ${job?.id} failed:`, err.message)
})

console.log('[Workers] Started: sync-metrika, sync-direct')
