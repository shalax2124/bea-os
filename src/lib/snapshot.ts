import { sql } from '@/lib/db'

// Detects tasks that just became overdue and logs them to task_state_log.
// Safe to call on every page render — deduplicates by task+date.
export async function runOverdueSnapshot(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const overdueNewTasks = await sql`
      SELECT t.id, t.title
      FROM tasks t
      WHERE t.due_date < ${today}
        AND t.status NOT IN ('done')
        AND t.archived = FALSE
        AND t.due_date IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM task_state_log sl
          WHERE sl.task_id = t.id
            AND sl.event_type = 'became_overdue'
            AND sl.occurred_at::date = ${today}::date
        )
    `

    for (const task of overdueNewTasks) {
      const title = task.title as string
      await sql`
        INSERT INTO task_state_log (task_id, event_type, task_title, details)
        VALUES (${task.id as number}, 'became_overdue', ${title}, ${`Due: ${today}`})
      `
    }

    return overdueNewTasks.length
  } catch {
    return 0
  }
}
