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

const SOURCE_STYLE: Record<Draft['source'], string> = {
  fathom: 'bg-ink text-white',
  slack:  'bg-lime text-ink',
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
    setEditing((prev) => { const next = { ...prev }; delete next[id]; return next })
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

  if (loading) return null

  const hasDrafts = drafts.length > 0

  return (
    <div className={`border-2 ${hasDrafts ? 'border-pink' : 'border-gray-200'} bg-white`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3 ${hasDrafts ? 'bg-pink' : 'bg-white border-b border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <h3 className={`text-[10px] font-black tracking-[0.18em] uppercase ${hasDrafts ? 'text-white' : 'text-gray-400'}`}>
            Pending Review
          </h3>
          {hasDrafts && (
            <span className="bg-white text-pink text-[10px] font-black px-2 py-0.5">
              {drafts.length}
            </span>
          )}
        </div>
        <button
          onClick={syncSlack}
          disabled={syncing}
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 transition-opacity disabled:opacity-50 ${
            hasDrafts ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-lime text-ink hover:opacity-80'
          }`}
        >
          {syncing ? 'Syncing…' : 'Sync Slack'}
        </button>
      </div>

      <div className="px-5 py-4">
        {syncMsg && (
          <p className="mb-4 text-xs font-medium text-gray-600 bg-cream px-3 py-2 border border-gray-200">
            {syncMsg}
          </p>
        )}

        {!hasDrafts && !syncMsg && (
          <p className="text-xs text-gray-400 py-1">
            No drafts from Slack or Fathom. Sync to check for new tasks.
          </p>
        )}

        {hasDrafts && (
          <div className="space-y-3">
            {drafts.map((draft) => {
              const isEditing = !!editing[draft.id]
              const state = editing[draft.id]
              const isBusy = busy[draft.id]

              return (
                <div key={draft.id} className="border border-gray-200 bg-cream p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[9px] font-black tracking-widest uppercase ${SOURCE_STYLE[draft.source]}`}>
                      {draft.source}
                    </span>
                    {!isEditing && (
                      <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        draft.priority === 'high' ? 'text-pink' : draft.priority === 'medium' ? 'text-ink' : 'text-gray-400'
                      }`}>
                        {draft.priority}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        className="w-full border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:border-pink"
                        value={state.title}
                        onChange={(e) => setEditing((p) => ({ ...p, [draft.id]: { ...state, title: e.target.value } }))}
                        placeholder="Title"
                      />
                      <textarea
                        className="w-full border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-pink resize-none"
                        rows={2}
                        value={state.description}
                        onChange={(e) => setEditing((p) => ({ ...p, [draft.id]: { ...state, description: e.target.value } }))}
                        placeholder="Description (optional)"
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-pink"
                          value={state.due_date}
                          onChange={(e) => setEditing((p) => ({ ...p, [draft.id]: { ...state, due_date: e.target.value } }))}
                        />
                        <select
                          className="border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-pink"
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
                      <p className="text-sm font-bold text-ink">{draft.title}</p>
                      {draft.description && (
                        <p className="mt-0.5 text-xs text-gray-500">{draft.description}</p>
                      )}
                      {draft.due_date && (
                        <p className="mt-0.5 text-[10px] text-gray-400 uppercase tracking-wide font-bold">
                          Due {new Date(draft.due_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => approve(draft)}
                      disabled={isBusy}
                      className="bg-ink text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 hover:bg-pink transition-colors disabled:opacity-50"
                    >
                      {isBusy ? '…' : 'Approve'}
                    </button>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(draft.id)} disabled={isBusy} className="border border-ink text-ink text-[10px] font-black uppercase tracking-widest px-3 py-1.5 hover:bg-ink hover:text-white transition-colors disabled:opacity-50">Save</button>
                        <button onClick={() => cancelEdit(draft.id)} className="text-[10px] font-bold text-gray-400 px-2 py-1.5 hover:text-gray-700 transition-colors">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(draft)} className="border border-gray-300 text-gray-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 hover:border-ink hover:text-ink transition-colors">Edit</button>
                    )}
                    <button
                      onClick={() => reject(draft.id)}
                      disabled={isBusy}
                      className="ml-auto text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-pink transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
