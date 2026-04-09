'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
}

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
}

const SOURCE_COLORS: Record<string, string> = {
  fathom: 'bg-purple-100 text-purple-700',
  slack: 'bg-indigo-100 text-indigo-700',
  whatsapp: 'bg-green-100 text-green-700',
  email: 'bg-sky-100 text-sky-700',
  manual: 'bg-gray-100 text-gray-500',
}

const SOURCE_LABELS: Record<string, string> = {
  fathom: 'Fathom',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  email: 'Email',
  manual: 'Manual',
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return dueDate < new Date().toISOString().split('T')[0]
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const router = useRouter()
  const [updating, setUpdating] = useState<number | null>(null)

  async function markDone(id: number) {
    setUpdating(id)
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    })
    setUpdating(null)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const overdue = isOverdue(task.due_date)
        return (
          <div
            key={task.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              {/* Done checkbox */}
              <button
                onClick={() => markDone(task.id)}
                disabled={updating === task.id}
                className="mt-0.5 flex-shrink-0 h-5 w-5 rounded border border-gray-300 hover:border-gray-500 flex items-center justify-center disabled:opacity-50"
                aria-label="Mark as done"
              >
                {updating === task.id && (
                  <span className="h-3 w-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{task.description}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  {task.due_date && (
                    <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      {overdue ? 'Overdue · ' : 'Due '}
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {task.blocked_on && (
                    <span className="text-xs text-orange-600">
                      Blocked on {task.blocked_on}
                    </span>
                  )}
                  {task.source && task.source !== 'manual' && (
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_COLORS[task.source] ?? 'bg-gray-100 text-gray-500'}`}>
                      {SOURCE_LABELS[task.source]}
                    </span>
                  )}
                  {task.time_estimate && (
                    <span className="text-xs text-gray-400">
                      ~{task.time_estimate < 60
                        ? `${task.time_estimate}m`
                        : `${Math.round(task.time_estimate / 60 * 10) / 10}h`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
