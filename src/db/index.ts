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
export async function initDb(retries = 5) {
  let client
  while (retries > 0) {
    try {
      client = await pool.connect()
      break
    } catch (err) {
      console.log(`[DB] Connection failed, retrying... (${retries} left)`)
      retries -= 1
      if (retries === 0) throw err
      await new Promise(res => setTimeout(res, 2000))
    }
  }

  if (!client) return

  try {
    console.log('[DB] Ensuring Schema Integrity...')
    
    // 1. Projects table
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

    // 2. Multi-tenant columns (add to all related tables)
    const tables = ['users', 'leads', 'expenses', 'goals', 'goal_conversions', 'sync_logs', 'ai_recommendations']
    for (const table of tables) {
      await client.query(`
        DO $$ 
        BEGIN 
          IF EXISTS (SELECT FROM pg_tables WHERE tablename = '${table}') THEN
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='${table}' AND column_name='project_id') THEN
               ALTER TABLE ${table} ADD COLUMN project_id INTEGER REFERENCES projects(id);
            END IF;
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
