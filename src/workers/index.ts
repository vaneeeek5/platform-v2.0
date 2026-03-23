import { Worker, Queue, Job } from 'bullmq'
import { redis } from '@/lib/cache'
import { db } from '@/db'
import { schema } from '@/db'
import { getCampaignStats } from '@/lib/yandex/direct'
import { getConversions, getGoals } from '@/lib/yandex/metrika'
import { eq } from 'drizzle-orm'

// ---- Queues ----
export const syncMetrikaQueue = new Queue('sync-metrika', { connection: redis })
export const syncDirectQueue = new Queue('sync-direct', { connection: redis })
export const aiQueue = new Queue('ai-recommendations', { connection: redis })

// ---- Metrika Sync Worker ----
const metrikaWorker = new Worker(
  'sync-metrika',
  async (job: Job) => {
    const { projectId, dateFrom, dateTo } = job.data
    console.log(`[Worker] Syncing Metrika for project ${projectId}`)

    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    })
    if (!project?.metrikaCounterId || !project.metrikaToken) {
      throw new Error('Metrika not configured for this project')
    }

    // Get goals
    const goals = await getGoals(project.metrikaCounterId)

    // Upsert goals
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
    const conversions = await getConversions(project.metrikaCounterId, dateFrom, dateTo, goalIds)

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
  { connection: redis, concurrency: 2 }
)

// ---- Direct Sync Worker ----
const directWorker = new Worker(
  'sync-direct',
  async (job: Job) => {
    const { projectId, dateFrom, dateTo } = job.data
    console.log(`[Worker] Syncing Direct for project ${projectId}`)

    const stats = await getCampaignStats(dateFrom, dateTo)
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
  { connection: redis, concurrency: 2 }
)

// ---- Error handlers ----
metrikaWorker.on('failed', (job, err) => {
  console.error(`[Worker] Metrika job ${job?.id} failed:`, err.message)
})
directWorker.on('failed', (job, err) => {
  console.error(`[Worker] Direct job ${job?.id} failed:`, err.message)
})

console.log('[Workers] Started: sync-metrika, sync-direct')
