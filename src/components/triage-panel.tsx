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

const typeLabel: Record<TriageSuggestion['type'], { label: string; cls: string }> = {
  defer:     { label: 'DEFER',    cls: 'bg-gray-100 text-gray-600' },
  delegate:  { label: 'DELEGATE', cls: 'bg-lime text-ink' },
  ask_jeff:  { label: 'ASK JEFF', cls: 'bg-ink text-white' },
  flag:      { label: 'FLAG',     cls: 'bg-pink text-white' },
}

function SuggestionRow({ s }: { s: TriageSuggestion }) {
  const [showDraft, setShowDraft] = useState(false)
  const { label, cls } = typeLabel[s.type]
  return (
    <div className="py-3 border-b border-white/10 last:border-0">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 text-[9px] font-black tracking-widest uppercase ${cls}`}>
          {label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-snug">{s.task_title}</p>
          <p className="text-xs text-white/60 mt-0.5">{s.reason}</p>
          {s.draft_message && (
            <button
              onClick={() => setShowDraft((v) => !v)}
              className="mt-1.5 text-[10px] font-black text-pink uppercase tracking-wide hover:opacity-70 transition-opacity"
            >
              {showDraft ? 'Hide draft' : 'View draft →'}
            </button>
          )}
          {showDraft && s.draft_message && (
            <textarea
              readOnly
              value={s.draft_message}
              className="mt-2 w-full bg-white/10 border border-white/20 p-2.5 text-xs text-white/80 resize-none focus:outline-none"
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
        <div key={i} className="flex items-start gap-3 py-3">
          <div className="h-4 w-14 bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 bg-white/10" />
            <div className="h-3 w-full bg-white/8" />
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
    <div className="space-y-2 text-sm text-white/70">
      {deferrable.length > 0 && (
        <p>Consider deferring {deferrable.length} low-priority task{deferrable.length > 1 ? 's' : ''} with no deadline</p>
      )}
      {blocked.length > 0 && (
        <p>{blocked.length} task{blocked.length > 1 ? 's are' : ' is'} blocked — chase or park them</p>
      )}
    </div>
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
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((data) => setSuggestions(data.suggestions ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (totalMinutes <= CAPACITY_MINUTES) return null

  const totalHours = (totalMinutes / 60).toFixed(1)

  return (
    <div className="bg-ink border-2 border-ink">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-white/10">
        <div>
          <h3 className="text-[10px] font-black tracking-[0.18em] uppercase text-pink">
            Triage Needed
          </h3>
          <p className="mt-1 text-sm font-bold text-white">
            {totalHours}h queued — over your 8h capacity
          </p>
          <p className="text-xs text-white/50 mt-0.5">Pick one action below</p>
        </div>
        <span className="text-2xl font-black text-pink animate-pulse-pink">{totalHours}h</span>
      </div>

      <div className="px-5 py-2">
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
    </div>
  )
}
