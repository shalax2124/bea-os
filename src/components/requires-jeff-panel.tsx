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

function daysWaiting(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
}

export function RequiresJeffPanel({ tasks }: { tasks: Task[] }) {
  const jeffTasks = tasks
    .filter((t) => t.blocked_on?.toLowerCase().includes('jeff') && t.status !== 'done')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, 6)

  return (
    <div className="border-2 border-ink bg-white h-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-ink px-5 py-3">
        <h3 className="text-[10px] font-black tracking-[0.18em] uppercase text-white">
          Requires Jeff
        </h3>
        <span className={`text-[10px] font-black px-2 py-0.5 ${
          jeffTasks.length > 0 ? 'bg-pink text-white animate-pulse-pink' : 'bg-white/10 text-white/60'
        }`}>
          {jeffTasks.length}
        </span>
      </div>

      <div className="px-5 py-4">
        {jeffTasks.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs font-bold text-lime">All clear</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Nothing waiting on Jeff</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {jeffTasks.map((task) => {
              const days = daysWaiting(task.created_at)
              const urgent = days >= 3
              return (
                <li key={task.id} className="py-3">
                  <p className="text-sm font-bold text-ink leading-snug">{task.title}</p>
                  {task.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{task.description}</p>
                  )}
                  <p className={`mt-1 text-[10px] font-black uppercase tracking-wider ${
                    urgent ? 'text-pink' : 'text-gray-400'
                  }`}>
                    {days} day{days !== 1 ? 's' : ''} waiting{urgent ? ' — follow up' : ''}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
