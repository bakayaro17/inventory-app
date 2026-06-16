// One-off: applies supabase/schema.sql to a Postgres database.
// Connection string is read from DATABASE_URL (never hard-coded / never written to disk).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8')

// Discrete fields avoid URL-encoding issues with special chars (@, !, etc.) in the password.
const client = new pg.Client({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'postgres',
  ssl: { rejectUnauthorized: false }
})

try {
  await client.connect()
  await client.query(sql)
  // Verify tables exist.
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_name in ('shipments','listings') order by table_name"
  )
  console.log('OK — schema applied. Tables present:', rows.map((r) => r.table_name).join(', '))
} catch (e) {
  console.error('FAILED:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
