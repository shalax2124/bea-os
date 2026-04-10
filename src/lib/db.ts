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
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_adhoc_jeff BOOLEAN NOT NULL DEFAULT FALSE`
  await sql`
    CREATE TABLE IF NOT EXISTS task_priority_log (
      id SERIAL PRIMARY KEY,
      task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
      changed_at TIMESTAMPTZ DEFAULT NOW(),
      old_priority TEXT,
      new_priority TEXT,
      old_status TEXT,
      new_status TEXT
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS task_state_log (
      id SERIAL PRIMARY KEY,
      task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      occurred_at TIMESTAMPTZ DEFAULT NOW(),
      task_title TEXT NOT NULL,
      details TEXT
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_task_state_log_task_id ON task_state_log(task_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_task_state_log_event_type ON task_state_log(event_type)`

  // Phase 5: draft tasks (Slack/Fathom staging area)
  await sql`
    CREATE TABLE IF NOT EXISTS draft_tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATE,
      priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
      source TEXT CHECK (source IN ('fathom', 'slack')) NOT NULL,
      raw_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Phase 5: track last Slack sync timestamp
  await sql`
    CREATE TABLE IF NOT EXISTS slack_sync_state (
      id INT PRIMARY KEY DEFAULT 1,
      last_synced_ts TEXT
    )
  `
  await sql`INSERT INTO slack_sync_state (id) VALUES (1) ON CONFLICT DO NOTHING`
}
