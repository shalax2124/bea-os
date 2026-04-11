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
    <div className="border-2 border-ink bg-white px-4 py-3 flex items-start gap-3 animate-fade-up-2">
      <span className="text-base mt-0.5">⚠</span>
      <div>
        <p className="text-xs font-black text-ink uppercase tracking-wide">
          Scope check — {recentCount} new task{recentCount > 1 ? 's' : ''} in 24h
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {displayTitles.join(' · ')}
          {overflow > 0 && ` +${overflow} more`}
        </p>
      </div>
    </div>
  )
}
