'use client'

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

function TaskCard({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [fields, setFields] = useState({
    title: task.title,
    due_date: task.due_date ?? '',
    priority: task.priority,
    status: task.status,
    blocked_on: task.blocked_on ?? '',
  })

  const overdue = isOverdue(task.due_date)

  async function handleMarkDone() {
    setSaving(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    })
    window.location.reload()
  }

  async function handleArchive() {
    setSaving(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    })
    window.location.reload()
  }

  async function handleDelete() {
    setSaving(true)
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    window.location.reload()
  }

  async function handleSaveEdit() {
    setSaving(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: fields.title,
        due_date: fields.due_date || null,
        priority: fields.priority,
        status: fields.status,
        blocked_on: fields.blocked_on || null,
      }),
    })
    window.location.reload()
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={fields.title}
            onChange={(e) => setFields({ ...fields, title: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Due date</label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={fields.due_date}
              onChange={(e) => setFields({ ...fields, due_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={fields.priority}
              onChange={(e) => setFields({ ...fields, priority: e.target.value as Task['priority'] })}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={fields.status}
              onChange={(e) => setFields({ ...fields, status: e.target.value as Task['status'] })}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Blocked on</label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={fields.blocked_on}
              onChange={(e) => setFields({ ...fields, blocked_on: e.target.value })}
              placeholder="e.g. Jeff"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSaveEdit}
            disabled={saving || !fields.title.trim()}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Done checkbox */}
        <button
          onClick={handleMarkDone}
          disabled={saving}
          className="mt-0.5 flex-shrink-0 h-5 w-5 rounded border border-gray-300 hover:border-gray-500 flex items-center justify-center disabled:opacity-50"
          aria-label="Mark as done"
        >
          {saving && (
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

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1 text-xs">
          <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600">Edit</button>
          <button onClick={handleArchive} disabled={saving} className="text-gray-400 hover:text-yellow-600 disabled:opacity-50">Archive</button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button onClick={handleDelete} disabled={saving} className="text-red-600 font-medium hover:text-red-800 disabled:opacity-50">Confirm</button>
              <button onClick={() => setConfirmDelete(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-gray-400 hover:text-red-500">Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
