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

const CAPACITY_MINUTES = 480

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
        <ul className="mb-4 space-y-1">
          {todayTasks.map((t) => (
            <li key={t.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{t.title}</span>
              {t.time_estimate !== null && (
                <span className="ml-4 shrink-0 text-xs text-gray-400">
                  ~{t.time_estimate}m
                </span>
              )}
            </li>
          ))}
        </ul>
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
