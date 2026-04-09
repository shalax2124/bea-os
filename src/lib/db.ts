import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(DATABASE_URL)

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATE,
      priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
      status TEXT CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')) DEFAULT 'todo',
      blocked_on TEXT,
      source_text TEXT,
      source TEXT CHECK (source IN ('fathom', 'slack', 'whatsapp', 'email', 'manual')) DEFAULT 'manual',
      time_estimate INT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  // Migrate existing tables that predate these columns
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('fathom', 'slack', 'whatsapp', 'email', 'manual')) DEFAULT 'manual'`
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_estimate INT`
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE`
}
