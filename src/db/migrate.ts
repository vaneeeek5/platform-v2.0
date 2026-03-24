import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from './index'
import path from 'path'

async function main() {
  console.log('[Migration] Starting database migration...')
  try {
    // Migration files location during build/run
    await migrate(db, { 
      migrationsFolder: path.join(__dirname, 'migrations') 
    })
    console.log('[Migration] Database migration completed successfully.')
  } catch (error) {
    console.error('[Migration] Database migration failed:', error)
    process.exit(1)
  }
}

main()
