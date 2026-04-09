import { sql } from '@/lib/db'
import { ArchivedTaskList } from '@/components/archived-task-list'

type Task = {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  created_at: string
}

async function getArchivedTasks(): Promise<Task[]> {
  try {
    const tasks = await sql`
      SELECT * FROM tasks
      WHERE archived = TRUE
      ORDER BY updated_at DESC
    `
    return tasks.map((t) => ({
      ...t,
      due_date: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : null,
    })) as Task[]
  } catch {
    return []
  }
}

export default async function ArchivePage() {
  const tasks = await getArchivedTasks()

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Archive</h2>
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
          No archived tasks yet.
        </div>
      ) : (
        <ArchivedTaskList tasks={tasks} />
      )}
    </div>
  )
}
