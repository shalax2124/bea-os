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

export function AdhocCounter({ tasks }: { tasks: Task[] }) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const jeffAdHocTasks = tasks.filter((t) => {
    const isSlackOrWhatsApp = t.source === 'slack' || t.source === 'whatsapp'
    const isRecent = new Date(t.created_at) >= sevenDaysAgo
    return isSlackOrWhatsApp && isRecent
  })

  const count = jeffAdHocTasks.length

  if (count === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
      ⚡ Jeff added {count} unplanned task{count > 1 ? 's' : ''} this week via Slack/WhatsApp
    </div>
  )
}
