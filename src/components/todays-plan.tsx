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
  if (minutes < 60) return `${minutes} min`
  const hrs = minutes / 60
  return `${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} hrs`
}

function SourcePill({ task }: { task: Task }) {
  if (task.is_adhoc_jeff) {
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 whitespace-nowrap">
        JEFF (AD HOC)
      </span>
    )
  }
  const map: Record<string, { label: string; cls: string }> = {
    fathom: { label: 'Fathom', cls: 'bg-purple-100 text-purple-700' },
    slack: { label: 'Slack', cls: 'bg-indigo-100 text-indigo-700' },
    whatsapp: { label: 'WhatsApp', cls: 'bg-green-100 text-green-700' },
    email: { label: 'Email', cls: 'bg-sky-100 text-sky-700' },
    manual: { label: 'Manual', cls: 'bg-gray-100 text-gray-600' },
  }
  const src = task.source ?? 'manual'
  const { label, cls } = map[src] ?? map['manual']
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

const priorityBorder: Record<Task['priority'], string> = {
  high: 'border-red-400',
  medium: 'border-amber-400',
  low: 'border-green-400',
}

export function TodaysPlan({ tasks }: { tasks: Task[] }) {
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter((t) => t.due_date === today)
  const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.time_estimate ?? 0), 0)
  const overloaded = totalMinutes > CAPACITY_MINUTES

  const barPercent = Math.min((totalMinutes / CAPACITY_MINUTES) * 100, 100)
  const barColor =
    barPercent <= 80
      ? 'bg-green-500'
      : barPercent <= 100
        ? 'bg-yellow-400'
        : 'bg-red-500'

  const hoursPlanned = (totalMinutes / 60).toFixed(1)
  const overBy = ((totalMinutes - CAPACITY_MINUTES) / 60).toFixed(1)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Today&apos;s Plan</h3>

      {todayTasks.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing due today</p>
      ) : (
        <ul className="mb-2 space-y-2">
          {todayTasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-start gap-2 border-l-4 pl-3 py-2 ${priorityBorder[t.priority]}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 leading-snug">{t.title}</span>
                  <SourcePill task={t} />
                </div>
                {t.description && (
                  <p className="mt-0.5 text-xs text-gray-500 italic truncate">{t.description}</p>
                )}
                {t.blocked_on && (
                  <p className="mt-0.5 text-xs text-orange-500">Blocked on {t.blocked_on}</p>
                )}
              </div>
              {t.time_estimate !== null && (
                <span className="shrink-0 text-xs text-gray-400 mt-0.5">
                  {formatTime(t.time_estimate)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {todayTasks.length > 0 && (
        <p className="text-xs text-gray-400 italic mt-2">
          Prioritized by impact, not by who asked loudest
        </p>
      )}

      <div className="mt-3 space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{hoursPlanned}h planned of 8h capacity</span>
          {overloaded && (
            <span className="font-medium text-amber-600">⚠ Over capacity by {overBy}h</span>
          )}
        </div>
      </div>
    </div>
  )
}
