'use client'

import { useEffect, useState } from 'react'

type Draft = {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  source: 'fathom' | 'slack'
  raw_text: string | null
  created_at: string
}

type EditState = {
  title: string
  description: string
  due_date: string
  priority: 'high' | 'medium' | 'low'
}

const SOURCE_BADGE: Record<Draft['source'], string> = {
  fathom: 'bg-purple-100 text-purple-700',
  slack: 'bg-green-100 text-green-700',
}

const PRIORITY_BADGE: Record<Draft['priority'], string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

export function DraftReviewPanel() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<number, EditState>>({})
  const [busy, setBusy] = useState<Record<number, boolean>>({})
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  async function fetchDrafts() {
    setLoading(true)
    try {
      const res = await fetch('/api/draft-tasks')
      const data = await res.json()
      setDrafts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDrafts() }, [])

  function startEdit(draft: Draft) {
    setEditing((prev) => ({
      ...prev,
      [draft.id]: {
        title: draft.title,
        description: draft.description ?? '',
        due_date: draft.due_date ?? '',
        priority: draft.priority,
      },
    }))
  }

  function cancelEdit(id: number) {
    setEditing((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function saveEdit(id: number) {
    const state = editing[id]
    if (!state) return
    setBusy((p) => ({ ...p, [id]: true }))
    await fetch(`/api/draft-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    cancelEdit(id)
    setBusy((p) => ({ ...p, [id]: false }))
    fetchDrafts()
  }

  async function approve(draft: Draft) {
    setBusy((p) => ({ ...p, [draft.id]: true }))
    const state = editing[draft.id]
    await fetch('/api/draft-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: draft.id,
        title: state?.title ?? draft.title,
        description: state?.description ?? draft.description,
        due_date: state?.due_date ?? draft.due_date,
        priority: state?.priority ?? draft.priority,
      }),
    })
    setBusy((p) => ({ ...p, [draft.id]: false }))
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id))
    cancelEdit(draft.id)
  }

  async function reject(id: number) {
    setBusy((p) => ({ ...p, [id]: true }))
    await fetch(`/api/draft-tasks/${id}`, { method: 'DELETE' })
    setDrafts((prev) => prev.filter((d) => d.id !== id))
    setBusy((p) => ({ ...p, [id]: false }))
  }

  async function syncSlack() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/slack/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setSyncMsg(`Error: ${data.error}`)
      } else {
        setSyncMsg(`Synced ${data.synced} new task${data.synced !== 1 ? 's' : ''} from ${data.total_messages} messages`)
        fetchDrafts()
      }
    } catch {
      setSyncMsg('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-400">Loading drafts…</p>
      </div>
    )
  }

  if (drafts.length === 0 && !syncMsg) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Pending Review</p>
            <p className="text-xs text-gray-400 mt-0.5">No drafts from Slack or Fathom</p>
          </div>
          <button
            onClick={syncSlack}
            disabled={syncing}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync Slack'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Pending Review
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
              {drafts.length}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">From Slack and Fathom — approve to add to tasks</p>
        </div>
        <button
          onClick={syncSlack}
          disabled={syncing}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Sync Slack'}
        </button>
      </div>

      {syncMsg && (
        <p className="mb-3 text-xs text-gray-600 bg-white rounded px-3 py-2">{syncMsg}</p>
      )}

      <div className="space-y-3">
        {drafts.map((draft) => {
          const isEditing = !!editing[draft.id]
          const state = editing[draft.id]
          const isBusy = busy[draft.id]

          return (
            <div
              key={draft.id}
              className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-start gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SOURCE_BADGE[draft.source]}`}>
                  {draft.source}
                </span>
                {!isEditing && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[draft.priority]}`}>
                    {draft.priority}
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={state.title}
                    onChange={(e) => setEditing((p) => ({ ...p, [draft.id]: { ...state, title: e.target.value } }))}
                    placeholder="Title"
                  />
                  <textarea
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    rows={2}
                    value={state.description}
                    onChange={(e) => setEditing((p) => ({ ...p, [draft.id]: { ...state, description: e.target.value } }))}
                    placeholder="Description (optional)"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      value={state.due_date}
                      onChange={(e) => setEditing((p) => ({ ...p, [draft.id]: { ...state, due_date: e.target.value } }))}
                    />
                    <select
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      value={state.priority}
                      onChange={(e) => setEditing((p) => ({ ...p, [draft.id]: { ...state, priority: e.target.value as 'high' | 'medium' | 'low' } }))}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-900">{draft.title}</p>
                  {draft.description && (
                    <p className="mt-0.5 text-xs text-gray-500">{draft.description}</p>
                  )}
                  {draft.due_date && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      Due: {new Date(draft.due_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approve(draft)}
                  disabled={isBusy}
                  className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isBusy ? '…' : 'Approve'}
                </button>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => saveEdit(draft.id)}
                      disabled={isBusy}
                      className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => cancelEdit(draft.id)}
                      className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(draft)}
                    className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => reject(draft.id)}
                  disabled={isBusy}
                  className="ml-auto rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
