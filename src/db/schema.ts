import { pgTable, serial, text, integer, numeric, timestamp, boolean, varchar, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================
// PROJECTS (multi-project support)
// ============================================================
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  metrikaCounterId: text('metrika_counter_id'),
  metrikaToken: text('metrika_token'),
  directToken: text('direct_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================
// USERS (admin + manager per project)
// ============================================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('manager'), // 'admin' | 'manager'
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// LEADS
// ============================================================
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  name: text('name'),
  phone: text('phone'),
  email: text('email'),
  source: text('source'), // yandex_direct | organic | referral | other
  goalId: text('goal_id'), // metrika goal id
  goalName: text('goal_name'),
  status: varchar('status', { length: 50 }).default('new'), // new | in_progress | qualified | lost
  managerId: integer('manager_id').references(() => users.id),
  notes: text('notes'),
  managerNotes: text('manager_notes'), // protected from sync overwrite
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmContent: text('utm_content'),
  utmTerm: text('utm_term'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('leads_project_idx').on(t.projectId),
  index('leads_date_idx').on(t.date),
  index('leads_status_idx').on(t.status),
])

// ============================================================
// EXPENSES (Yandex Direct)
// ============================================================
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  campaignId: text('campaign_id'),
  campaignName: text('campaign_name'),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  spend: numeric('spend', { precision: 12, scale: 2 }).default('0'),
  cpc: numeric('cpc', { precision: 12, scale: 2 }),
  ctr: numeric('ctr', { precision: 8, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('expenses_project_date_idx').on(t.projectId, t.date),
])

// ============================================================
// GOALS (Yandex Metrika goals)
// ============================================================
export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  metrikaGoalId: text('metrika_goal_id').notNull(),
  name: text('name').notNull(),
  type: text('type'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('goals_project_metrika_idx').on(t.projectId, t.metrikaGoalId),
])

// ============================================================
// GOAL CONVERSIONS (from Metrika)
// ============================================================
export const goalConversions = pgTable('goal_conversions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  goalId: integer('goal_id').notNull().references(() => goals.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  conversions: integer('conversions').default(0),
  revenue: numeric('revenue', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// SYNC LOGS
// ============================================================
export const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'metrika' | 'direct'
  status: varchar('status', { length: 20 }).notNull(), // 'pending' | 'running' | 'done' | 'error'
  dateFrom: timestamp('date_from'),
  dateTo: timestamp('date_to'),
  recordsProcessed: integer('records_processed').default(0),
  error: text('error'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  finishedAt: timestamp('finished_at'),
})

// ============================================================
// AI RECOMMENDATIONS
// ============================================================
export const aiRecommendations = pgTable('ai_recommendations', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  dataHash: text('data_hash').notNull(), // For smart caching
  model: text('model'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
})

// ============================================================
// Relations
// ============================================================
export const projectsRelations = relations(projects, ({ many }) => ({
  users: many(users),
  leads: many(leads),
  expenses: many(expenses),
  goals: many(goals),
  syncLogs: many(syncLogs),
  aiRecommendations: many(aiRecommendations),
}))

export const usersRelations = relations(users, ({ one }) => ({
  project: one(projects, { fields: [users.projectId], references: [projects.id] }),
}))

export const leadsRelations = relations(leads, ({ one }) => ({
  project: one(projects, { fields: [leads.projectId], references: [projects.id] }),
  manager: one(users, { fields: [leads.managerId], references: [users.id] }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  project: one(projects, { fields: [expenses.projectId], references: [projects.id] }),
}))

export const goalsRelations = relations(goals, ({ one, many }) => ({
  project: one(projects, { fields: [goals.projectId], references: [projects.id] }),
  conversions: many(goalConversions),
}))
