'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'

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

function daysWaiting(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
}

export default function JeffTrackerPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tasks')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then((data: { tasks: (Task & { archived?: boolean })[] }) => {
        const filtered = (data.tasks ?? [])
          .filter(
            (t) =>
              t.blocked_on?.toLowerCase().includes('jeff') &&
              t.status !== 'done' &&
              !t.archived
          )
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setTasks(filtered)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const avgWait =
    tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + daysWaiting(t.created_at), 0) / tasks.length)
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Jeff Tracker</h1>
        <p className="mt-1 text-sm text-gray-500">Tasks waiting on Jeff — sorted by longest wait</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          Loading…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load tasks: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stat bar */}
          {tasks.length > 0 && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm">
              <span className="font-medium">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''} waiting
              </span>
              <span className="text-gray-300">·</span>
              <span>
                {avgWait} day{avgWait !== 1 ? 's' : ''} average wait
              </span>
            </div>
          )}

          {/* Empty state */}
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50 p-10 text-center">
              <span className="text-3xl">✓</span>
              <p className="mt-2 text-sm font-medium text-green-700">No tasks waiting on Jeff</p>
              <p className="mt-1 text-xs text-green-600">All clear — nothing blocked right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const normalizedDueDate = task.due_date
                  ? new Date(task.due_date).toISOString().split('T')[0]
                  : null
                return (
                  <JeffTaskCard
                    key={task.id}
                    task={{ ...task, due_date: normalizedDueDate }}
                    waitDays={daysWaiting(task.created_at)}
                  />
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── JeffTaskCard ─────────────────────────────────────────────────────────────

type CardTask = {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
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

export function JeffTaskCard({ task, waitDays }: { task: CardTask; waitDays: number }) {
  const [resolving, setResolving] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = task.due_date ? task.due_date < today : false

  const waitColor =
    waitDays > 3
      ? 'text-red-600 font-medium'
      : waitDays >= 2
        ? 'text-yellow-600'
        : 'text-gray-400'

  async function handleMarkResolved() {
    setResolving(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked_on: null, status: 'in_progress' }),
    })
    window.location.reload()
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Title */}
          <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}
            >
              {task.priority}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}
            >
              {STATUS_LABELS[task.status]}
            </span>
            <span className={`text-xs ${waitColor}`}>
              Waiting {waitDays} day{waitDays !== 1 ? 's' : ''}
            </span>
            {task.due_date && (
              <span
                className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}
              >
                {isOverdue ? 'Overdue · ' : 'Due '}
                {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Resolve button */}
        <button
          onClick={handleMarkResolved}
          disabled={resolving}
          className="flex-shrink-0 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors"
        >
          {resolving ? 'Saving…' : 'Mark Resolved'}
        </button>
      </div>
    </div>
  )
}
