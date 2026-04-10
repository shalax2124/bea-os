import { sql } from '@/lib/db'
import { runOverdueSnapshot } from '@/lib/snapshot'
import { StatCard } from '@/components/stat-card'
import { TaskList } from '@/components/task-list'
import { TodaysPlan } from '@/components/todays-plan'
import { ScopeCreepAlert } from '@/components/scope-creep-alert'
import { TriagePanel } from '@/components/triage-panel'
import { EodSummary } from '@/components/eod-summary'
import { AdhocCounter } from '@/components/adhoc-counter'
import { RequiresJeffPanel } from '@/components/requires-jeff-panel'
import { WeeklyTrend } from '@/components/weekly-trend'
import { PriorityChanges } from '@/components/priority-changes'

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
  is_adhoc_jeff?: boolean | null
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

async function getDoneLastWeek(): Promise<number> {
  try {
    const [row] = await sql`
      SELECT COUNT(*) as count FROM tasks
      WHERE status = 'done'
      AND updated_at >= NOW() - INTERVAL '14 days'
      AND updated_at < NOW() - INTERVAL '7 days'
    `
    return Number(row?.count ?? 0)
  } catch {
    return 0
  }
}

function getOldestOverdueDays(tasks: Task[]): string | null {
  const today = new Date().toISOString().split('T')[0]
  const overdueTasks = tasks.filter((t) => t.due_date && t.due_date < today)
  if (overdueTasks.length === 0) return null
  const oldest = overdueTasks.sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0]
  const days = Math.floor((Date.now() - new Date(oldest.due_date! + 'T00:00:00').getTime()) / 86400000)
  return `Oldest: ${days} day${days !== 1 ? 's' : ''} ago`
}

function getAvgJeffWaitDays(tasks: Task[]): string | null {
  const jeffTasks = tasks.filter((t) => t.blocked_on?.toLowerCase().includes('jeff'))
  if (jeffTasks.length === 0) return null
  const totalDays = jeffTasks.reduce((sum, t) => {
    return sum + Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000)
  }, 0)
  return `Avg wait: ${(totalDays / jeffTasks.length).toFixed(1)} days`
}

export default async function DashboardPage() {
  const [tasks, doneThisWeek, doneLastWeek] = await Promise.all([
    getTasks(),
    getDoneThisWeek(),
    getDoneLastWeek(),
    runOverdueSnapshot(),
  ])

  const today = new Date().toISOString().split('T')[0]
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today).length
  const blockedOnJeff = tasks.filter((t) => t.blocked_on?.toLowerCase().includes('jeff')).length

  const oldestOverdueDetail = getOldestOverdueDays(tasks)
  const avgJeffWaitDetail = getAvgJeffWaitDays(tasks)
  const addedThisWeek = tasks.filter(
    (t) => new Date(t.created_at) >= new Date(Date.now() - 7 * 86400000)
  ).length

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={tasks.length}
          subtitle="All active tasks"
          detail={`↑${addedThisWeek} added this week`}
        />
        <StatCard
          title="Overdue"
          value={overdue}
          subtitle="Past deadline"
          detail={oldestOverdueDetail ?? undefined}
        />
        <StatCard
          title="Blocked on Jeff"
          value={blockedOnJeff}
          subtitle="Waiting for response"
          detail={avgJeffWaitDetail ?? undefined}
        />
        <StatCard
          title="Done This Week"
          value={doneThisWeek}
          subtitle="Completed recently"
          detail={doneLastWeek !== null ? `${doneLastWeek} last week` : undefined}
        />
      </div>

      {/* Alerts */}
      <AdhocCounter tasks={tasks} />
      <ScopeCreepAlert tasks={tasks} />

      {/* Triage */}
      <TriagePanel tasks={tasks} />

      {/* Two-column: Today's Plan + Requires Jeff */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TodaysPlan tasks={tasks} />
        </div>
        <div className="lg:col-span-2">
          <RequiresJeffPanel tasks={tasks} />
        </div>
      </div>

      {/* Two-column: Priority Changes + Weekly Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PriorityChanges />
        <WeeklyTrend />
      </div>

      {/* Full task list */}
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
          No active tasks. Go to <strong>Log Task</strong> to add your first one.
        </div>
      ) : (
        <TaskList tasks={tasks} />
      )}

      {/* EOD */}
      <EodSummary />
    </div>
  )
}
