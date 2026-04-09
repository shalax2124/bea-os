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

export function ScopeCreepAlert({ tasks }: { tasks: Task[] }) {
  const cutoff = new Date(Date.now() - 86400000)
  const recentTasks = tasks.filter((t) => new Date(t.created_at) > cutoff)
  const recentCount = recentTasks.length

  if (recentCount === 0) return null

  const displayTitles = recentTasks.slice(0, 3).map((t) => t.title)
  const overflow = recentCount - displayTitles.length

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-800">
        ⚠ Scope creep check: {recentCount} new task{recentCount > 1 ? 's' : ''} added in the last
        24 hours
      </p>
      <p className="mt-1 text-xs text-amber-700">
        {displayTitles.join(', ')}
        {overflow > 0 && ` +${overflow} more`}
      </p>
    </div>
  )
}
