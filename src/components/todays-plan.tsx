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

const CAPACITY_MINUTES = 480

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hrs = minutes / 60
  return `${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)}h`
}

function SourcePill({ task }: { task: Task }) {
  if (task.is_adhoc_jeff) {
    return (
      <span className="px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase bg-pink text-white">
        JEFF
      </span>
    )
  }
  const map: Record<string, { label: string; cls: string }> = {
    fathom:   { label: 'Fathom',    cls: 'bg-ink text-white' },
    slack:    { label: 'Slack',     cls: 'bg-ink text-white' },
    whatsapp: { label: 'WA',        cls: 'bg-ink text-white' },
    email:    { label: 'Email',     cls: 'bg-ink text-white' },
    manual:   { label: 'Manual',    cls: 'bg-gray-100 text-gray-500' },
  }
  const src = task.source ?? 'manual'
  const { label, cls } = map[src] ?? map['manual']
  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${cls}`}>
      {label}
    </span>
  )
}

const priorityLeft: Record<Task['priority'], string> = {
  high:   'border-l-pink bg-pink/5',
  medium: 'border-l-ink bg-transparent',
  low:    'border-l-gray-300 bg-transparent',
}

export function TodaysPlan({ tasks }: { tasks: Task[] }) {
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter((t) => t.due_date === today)
  const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.time_estimate ?? 0), 0)
  const overloaded = totalMinutes > CAPACITY_MINUTES
  const barPercent = Math.min((totalMinutes / CAPACITY_MINUTES) * 100, 100)
  const hoursPlanned = (totalMinutes / 60).toFixed(1)
  const overBy = ((totalMinutes - CAPACITY_MINUTES) / 60).toFixed(1)

  return (
    <div className="border-2 border-ink bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-ink px-5 py-3">
        <h3 className="text-[10px] font-black tracking-[0.18em] uppercase text-white">
          Today&apos;s Plan
        </h3>
        <span className="text-[10px] text-white/50 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="px-5 py-4">
        {todayTasks.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nothing due today</p>
        ) : (
          <ul className="space-y-0 divide-y divide-gray-100">
            {todayTasks.map((t) => (
              <li
                key={t.id}
                className={`flex items-start gap-3 border-l-4 pl-3 py-3 transition-all ${priorityLeft[t.priority]}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-ink leading-snug">{t.title}</span>
                    <SourcePill task={t} />
                  </div>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-gray-400 truncate">{t.description}</p>
                  )}
                  {t.blocked_on && (
                    <p className="mt-0.5 text-[10px] font-bold text-pink uppercase tracking-wide">
                      Blocked — {t.blocked_on}
                    </p>
                  )}
                </div>
                {t.time_estimate !== null && (
                  <span className="shrink-0 text-[10px] font-black text-gray-400 mt-0.5">
                    {formatTime(t.time_estimate)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Capacity bar */}
        {todayTasks.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
              <div
                className={`h-1.5 bar-animate ${overloaded ? 'bg-pink' : 'bg-lime'}`}
                style={{ width: `${barPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">{hoursPlanned}h of 8h capacity</span>
              {overloaded && (
                <span className="text-[10px] font-black text-pink uppercase tracking-wide">
                  Over by {overBy}h
                </span>
              )}
            </div>
          </div>
        )}

        {todayTasks.length > 0 && (
          <p className="mt-3 text-[10px] text-gray-300 italic">
            Prioritized by impact, not by who asked loudest
          </p>
        )}
      </div>
    </div>
  )
}
