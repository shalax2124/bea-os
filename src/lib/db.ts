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
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}
