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
  let client
  try {
    // Single robust attempt to connect
    console.log('[DB] Connecting for schema sync...')
    client = await pool.connect()
    
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

    // 2. Users table (if missing)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'manager',
        project_id INTEGER REFERENCES projects(id),
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `)

    // 3. Multi-tenant columns (add to all related tables)
    const tables = ['leads', 'expenses', 'goals', 'goal_conversions', 'sync_logs', 'ai_recommendations']
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

    // 4. Seed default admin if no users exist
    const { rows } = await client.query('SELECT count(*) FROM users')
    if (parseInt(rows[0].count) === 0) {
      console.log('[DB] Seeding default admin user...')
      const defaultHash = '$2a$10$pL3zI.KjR8zF8l2w5L5Q/.pE/tXq8vR7K7D8k7v7K7D8k7v7K7D8k' // for "admin"
      await client.query(`
        INSERT INTO users (email, password_hash, role, name)
        VALUES ('admin@platform.ru', '${defaultHash}', 'admin', 'Administrator')
      `)
      console.log('[DB] Default admin created: admin@platform.ru / admin')
    }

    console.log('[DB] Schema integrity check completed.')
  } catch (err) {
    console.error('[DB] Schema initialization error:', err)
  } finally {
    if (client) client.release()
  }
}
