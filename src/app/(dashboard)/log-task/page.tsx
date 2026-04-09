'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ExtractedTask = {
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  blocked_on: string | null
  source: 'fathom' | 'slack' | 'whatsapp' | 'email' | 'manual'
  time_estimate: number | null
}

const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', done: 'Done' }
const SOURCE_LABELS = { fathom: 'Fathom', slack: 'Slack', whatsapp: 'WhatsApp', email: 'Email', manual: 'Manual' }

export default function LogTaskPage() {
  const router = useRouter()
  const [rawText, setRawText] = useState('')
  const [task, setTask] = useState<ExtractedTask | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleExtract() {
    if (!rawText.trim()) return
    setExtracting(true)
    setError(null)
    setTask(null)
    try {
      const res = await fetch('/api/extract-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Extraction failed')
      setTask(data.task)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSave() {
    if (!task) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, source_text: rawText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setRawText('')
    setTask(null)
    setError(null)
    setSuccess(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 text-4xl">✓</div>
        <p className="text-lg font-semibold text-gray-900">Task saved!</p>
        <p className="mt-1 text-sm text-gray-500">Redirecting to dashboard…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Log a Task</h2>
        <p className="mt-1 text-sm text-gray-500">
          Paste anything — a Slack message, Fathom note, email snippet — and Claude will extract the task.
        </p>
      </div>

      {/* Step 1: Paste */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste raw text
        </label>
        <textarea
          rows={6}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Paste a Slack message, Fathom note, email thread, or anything with a task in it…"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={extracting || !!task}
        />
        {!task && (
          <button
            onClick={handleExtract}
            disabled={!rawText.trim() || extracting}
            className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {extracting ? 'Extracting…' : 'Extract Task with Claude →'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 2: Review + Edit */}
      {task && (
        <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Review extracted task</h3>
            <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">
              Start over
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={task.description ?? ''}
              onChange={(e) => setTask({ ...task, description: e.target.value || null })}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due date</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={task.due_date ?? ''}
                onChange={(e) => setTask({ ...task, due_date: e.target.value || null })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={task.priority}
                onChange={(e) => setTask({ ...task, priority: e.target.value as ExtractedTask['priority'] })}
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={task.status}
                onChange={(e) => setTask({ ...task, status: e.target.value as ExtractedTask['status'] })}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Blocked on</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={task.blocked_on ?? ''}
                onChange={(e) => setTask({ ...task, blocked_on: e.target.value || null })}
                placeholder="e.g. Jeff, vendor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={task.source}
                onChange={(e) => setTask({ ...task, source: e.target.value as ExtractedTask['source'] })}
              >
                {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Time estimate (min)</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={task.time_estimate ?? ''}
                onChange={(e) => setTask({ ...task, time_estimate: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="e.g. 30"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!task.title.trim() || saving}
            className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Task'}
          </button>
        </div>
      )}
    </div>
  )
}
