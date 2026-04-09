'use client'

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
  is_adhoc_jeff?: boolean | null
}

type TriageSuggestion = {
  type: 'defer' | 'delegate' | 'ask_jeff' | 'flag'
  task_title: string
  reason: string
  draft_message?: string
}

const CAPACITY_MINUTES = 480

const typeIcon: Record<TriageSuggestion['type'], string> = {
  defer: '🔵',
  delegate: '🟡',
  ask_jeff: '⚪',
  flag: '🔴',
}

function SuggestionRow({ s }: { s: TriageSuggestion }) {
  const [showDraft, setShowDraft] = useState(false)
  return (
    <div className="py-2 border-b border-red-100 last:border-0">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-sm">{typeIcon[s.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug">{s.task_title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{s.reason}</p>
          {s.draft_message && (
            <button
              onClick={() => setShowDraft((v) => !v)}
              className="mt-1 text-xs text-blue-600 hover:underline focus:outline-none"
            >
              {showDraft ? 'Hide draft' : 'Draft ready →'}
            </button>
          )}
          {showDraft && s.draft_message && (
            <textarea
              readOnly
              value={s.draft_message}
              className="mt-1 w-full rounded border border-gray-200 bg-white p-2 text-xs text-gray-700 resize-none focus:outline-none"
              rows={3}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="mt-1 h-3 w-3 rounded-full bg-red-200 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded bg-red-200" />
            <div className="h-3 w-full rounded bg-red-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function StaticFallback({ tasks }: { tasks: Task[] }) {
  const deferrable = tasks.filter((t) => t.priority === 'low' && t.due_date === null)
  const blocked = tasks.filter((t) => t.status === 'blocked')
  return (
    <ul className="space-y-1.5 text-sm text-red-700">
      {deferrable.length > 0 && (
        <li>
          Consider deferring: {deferrable.length} low-priority task
          {deferrable.length > 1 ? 's' : ''} with no deadline
        </li>
      )}
      {blocked.length > 0 && (
        <li>
          {blocked.length} task{blocked.length > 1 ? 's are' : ' is'} blocked — chase them or park
          them
        </li>
      )}
    </ul>
  )
}

export function TriagePanel({ tasks }: { tasks: Task[] }) {
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.time_estimate ?? 0), 0)

  const [suggestions, setSuggestions] = useState<TriageSuggestion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (totalMinutes <= CAPACITY_MINUTES) return

    setLoading(true)
    fetch('/api/generate-triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, totalMinutes }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('non-ok response')
        return res.json()
      })
      .then((data) => {
        setSuggestions(data.suggestions ?? [])
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (totalMinutes <= CAPACITY_MINUTES) return null

  const totalHours = (totalMinutes / 60).toFixed(1)

  const now = new Date()
  const dayLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h3 className="mb-1 text-sm font-semibold text-red-700">
        Triage needed — {dayLabel}
      </h3>
      <p className="mb-4 text-sm text-red-600">
        You have {totalHours}h of work queued, over your 8h capacity. Pick one action:
      </p>

      {loading && <Skeleton />}

      {!loading && error && <StaticFallback tasks={tasks} />}

      {!loading && !error && suggestions && (
        <div>
          {suggestions.map((s, i) => (
            <SuggestionRow key={i} s={s} />
          ))}
        </div>
      )}
    </div>
  )
}
