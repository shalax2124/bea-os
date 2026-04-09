import { sql } from '@/lib/db'
import { StatCard } from '@/components/stat-card'
import { TaskList } from '@/components/task-list'
import { TodaysPlan } from '@/components/todays-plan'
import { ScopeCreepAlert } from '@/components/scope-creep-alert'
import { TriagePanel } from '@/components/triage-panel'

export const dynamic = 'force-dynamic'

type Task = {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  blocked_on: string | null
  source: 'fathom' | 'slack' | 'whatsapp' | 'email' | 'manual' | null
  time_estimate: number | null
  created_at: string
}

async function getTasks(): Promise<Task[]> {
  try {
    const tasks = await sql`
      SELECT * FROM tasks
      WHERE status != 'done' AND archived = FALSE
      ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        due_date ASC NULLS LAST,
        created_at DESC
    `
    return tasks.map((t) => ({
      ...t,
      due_date: t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : null,
    })) as Task[]
  } catch {
    return []
  }
}

async function getDoneThisWeek(): Promise<number> {
  try {
    const [row] = await sql`
      SELECT COUNT(*) as count FROM tasks
      WHERE status = 'done'
      AND updated_at >= NOW() - INTERVAL '7 days'
    `
    return Number(row?.count ?? 0)
  } catch {
    return 0
  }
}

export default async function DashboardPage() {
  const [tasks, doneThisWeek] = await Promise.all([getTasks(), getDoneThisWeek()])

  const today = new Date().toISOString().split('T')[0]
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today).length
  const blockedOnJeff = tasks.filter((t) => t.blocked_on?.toLowerCase().includes('jeff')).length

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Tasks" value={tasks.length} subtitle="All active tasks" />
        <StatCard title="Overdue" value={overdue} subtitle="Past deadline" />
        <StatCard title="Blocked on Jeff" value={blockedOnJeff} subtitle="Waiting for response" />
        <StatCard title="Done This Week" value={doneThisWeek} subtitle="Completed recently" />
      </div>

      <ScopeCreepAlert tasks={tasks} />
      <TodaysPlan tasks={tasks} />
      <TriagePanel tasks={tasks} />

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
          No active tasks. Go to <strong>Log Task</strong> to add your first one.
        </div>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  )
}
