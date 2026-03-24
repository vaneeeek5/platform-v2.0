import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 10,
})

export const db = drizzle(pool, { schema })
export { schema }

// Initialize database schema manually to ensure independence from drizzle-kit in production
export async function initDb() {
  const client = await pool.connect()
  try {
    console.log('[DB] Ensuring Schema Integrity...')
    
    // 1. Projects
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        metrika_counter_id TEXT,
        metrika_token TEXT,
        direct_token TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `)

    // 2. Add project_id to all tables
    const tables = ['users', 'leads', 'expenses', 'goals', 'goal_conversions', 'sync_logs', 'ai_recommendations']
    for (const table of tables) {
      await client.query(`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT FROM pg_tables WHERE tablename = '${table}') THEN
            ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);
          END IF;
        END $$;
      `)
    }

    console.log('[DB] Schema integrity check completed.')
  } catch (err) {
    console.error('[DB] Schema initialization error:', err)
  } finally {
    client.release()
  }
}
