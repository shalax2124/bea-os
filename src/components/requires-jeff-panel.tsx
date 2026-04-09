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
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Requires Jeff</h3>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
          {jeffTasks.length} open item{jeffTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {jeffTasks.length === 0 ? (
        <p className="text-sm text-green-600">No items waiting on Jeff</p>
      ) : (
        <ul className="space-y-3">
          {jeffTasks.map((task) => {
            const days = daysWaiting(task.created_at)
            return (
              <li key={task.id} className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                {task.description && (
                  <p className="line-clamp-2 text-xs text-gray-500">{task.description}</p>
                )}
                <p className="text-xs text-blue-600">
                  Waiting {days} day{days !== 1 ? 's' : ''}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
