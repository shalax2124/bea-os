'use client'

import { useState } from 'react'

type Task = {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  created_at: string
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

function ArchivedTaskCard({ task }: { task: Task }) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleUnarchive() {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: false }),
    })
    window.location.reload()
  }

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm opacity-75">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-700 leading-snug">{task.title}</p>
          {task.description && (
            <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{task.description}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            {task.due_date && (
              <span className="text-xs text-gray-400">
                Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 text-xs">
          <button
            onClick={handleUnarchive}
            disabled={loading}
            className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
          >
            Restore
          </button>
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 font-medium hover:text-red-800 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-gray-400 hover:text-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ArchivedTaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <ArchivedTaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
