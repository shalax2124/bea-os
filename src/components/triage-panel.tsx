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

export function TriagePanel({ tasks }: { tasks: Task[] }) {
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.time_estimate ?? 0), 0)
  const overloaded = totalMinutes > CAPACITY_MINUTES * 2

  if (!overloaded) return null

  const deferrable = tasks.filter((t) => t.priority === 'low' && t.due_date === null)
  const blocked = tasks.filter((t) => t.status === 'blocked')

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h3 className="mb-2 text-sm font-semibold text-red-700">Triage Needed</h3>
      <p className="mb-3 text-sm text-red-600">
        You have {Math.round(totalMinutes / 60)}h of work queued. Here&apos;s what to consider:
      </p>
      <ul className="space-y-1.5 text-sm text-red-700">
        {deferrable.length > 0 && (
          <li>
            Consider deferring: {deferrable.length} low-priority task
            {deferrable.length > 1 ? 's' : ''} with no deadline
          </li>
        )}
        {blocked.length > 0 && (
          <li>
            {blocked.length} task{blocked.length > 1 ? 's are' : ' is'} blocked — chase them or
            park them
          </li>
        )}
      </ul>
    </div>
  )
}
