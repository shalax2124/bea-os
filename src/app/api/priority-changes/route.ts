import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const changes = await sql`
    SELECT
      pl.id,
      pl.task_id,
      pl.changed_at,
      pl.old_priority,
      pl.new_priority,
      pl.old_status,
      pl.new_status,
      t.title,
      t.source,
      t.is_adhoc_jeff
    FROM task_priority_log pl
    JOIN tasks t ON t.id = pl.task_id
    WHERE pl.changed_at >= NOW() - INTERVAL '7 days'
    ORDER BY pl.changed_at DESC
    LIMIT 20
  `

  const newTasks = await sql`
    SELECT id, title, source, is_adhoc_jeff, created_at, priority
    FROM tasks
    WHERE created_at >= NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 10
  `

  return NextResponse.json({ changes, newTasks })
}
