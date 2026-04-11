'use client'

import { useState } from 'react'

type Source = 'fathom' | 'slack' | 'whatsapp' | 'email' | 'manual'
type Priority = 'high' | 'medium' | 'low'
type Mode = 'smart' | 'manual'

type FormState = {
  rawText: string
  title: string
  source: Source
  priority: Priority
  due_date: string
  notes: string
  is_adhoc_jeff: boolean
  owner: string
}

const defaultForm: FormState = {
  rawText: '',
  title: '',
  source: 'manual',
  priority: 'medium',
  due_date: '',
  notes: '',
  is_adhoc_jeff: false,
  owner: 'Bea (me)',
}

const priorityOptions: { label: string; value: Priority }[] = [
  { label: 'P1 — Do today', value: 'high' },
  { label: 'P2 — This week', value: 'medium' },
  { label: 'P3 — Someday', value: 'low' },
]

const sourceOptions: { label: string; value: Source }[] = [
  { label: 'Fathom', value: 'fathom' },
  { label: 'Slack', value: 'slack' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Email', value: 'email' },
]

const inputCls = 'text-xs border border-white/15 bg-white/8 text-white placeholder-white/30 px-2 py-1.5 w-full focus:outline-none focus:border-pink transition-colors'
const labelCls = 'text-[9px] font-black text-white/35 tracking-[0.15em] uppercase block mb-1'

export function SidebarLogTask() {
  const [mode, setMode] = useState<Mode>('smart')
  const [form, setForm] = useState<FormState>(defaultForm)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleExtract() {
    if (!form.rawText.trim()) return
    setExtracting(true)
    setError(null)
    try {
      const res = await fetch('/api/extract-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.rawText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Extraction failed')
      const task = data.task
      setForm((prev) => ({
        ...prev,
        title: task.title ?? prev.title,
        source: task.source ?? prev.source,
        priority: task.priority ?? prev.priority,
        due_date: task.due_date ?? prev.due_date,
        notes: task.description ?? prev.notes,
      }))
      setMode('manual')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setExtracting(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          source: form.source,
          priority: form.priority,
          due_date: form.due_date || null,
          description: form.notes,
          is_adhoc_jeff: form.is_adhoc_jeff,
          source_text: form.rawText,
          owner: form.owner,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setForm(defaultForm)
        setMode('smart')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2">
      <div className="border-t border-white/10 my-4" />
      <p className={labelCls}>Log a Task</p>

      {error && <p className="text-[10px] text-pink mb-2">{error}</p>}

      {success ? (
        <p className="text-[10px] font-black text-lime uppercase tracking-widest py-1">✓ Task added!</p>
      ) : (
        <>
          {/* Smart Paste */}
          {mode === 'smart' && (
            <div className="flex flex-col gap-2">
              <p className={labelCls}>Smart Paste</p>
              <textarea
                rows={3}
                value={form.rawText}
                onChange={(e) => updateField('rawText', e.target.value)}
                placeholder="Paste a Fathom transcript, Slack message, email..."
                className={`${inputCls} resize-none`}
              />
              <button
                onClick={handleExtract}
                disabled={extracting || !form.rawText.trim()}
                className="text-[10px] font-black uppercase tracking-widest bg-pink text-white px-3 py-2 w-full disabled:opacity-40 hover:opacity-80 transition-opacity"
              >
                {extracting ? 'Extracting…' : 'Extract with Claude →'}
              </button>
              <button
                onClick={() => setMode('manual')}
                className="text-[9px] text-white/30 hover:text-white/60 text-center transition-colors"
              >
                or fill in manually
              </button>
            </div>
          )}

          {/* Manual */}
          {mode === 'manual' && (
            <div className="flex flex-col gap-2">
              <div>
                <label className={labelCls}>Task</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Task name"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Source</label>
                <div className="flex gap-1 flex-wrap">
                  {sourceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateField('source', form.source === opt.value ? 'manual' : opt.value)}
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 transition-colors ${
                        form.source === opt.value
                          ? 'bg-pink text-white'
                          : 'border border-white/20 text-white/40 hover:border-white/40 hover:text-white/70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Owner</label>
                <input
                  type="text"
                  value={form.owner}
                  onChange={(e) => updateField('owner', e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Priority</label>
                <select
                  value={priorityOptions.find((p) => p.value === form.priority)?.label ?? 'P2 — This week'}
                  onChange={(e) => {
                    const found = priorityOptions.find((p) => p.label === e.target.value)
                    if (found) updateField('priority', found.value)
                  }}
                  className={`${inputCls} appearance-none`}
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.label} className="bg-ink text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => updateField('due_date', e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`}
                />
              </div>

              <div>
                <label className={labelCls}>Notes <span className="font-normal normal-case opacity-60">(optional)</span></label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <label className={labelCls}>Jeff Added This?</label>
                <select
                  value={form.is_adhoc_jeff ? 'Yes — ad hoc' : 'No — planned'}
                  onChange={(e) => updateField('is_adhoc_jeff', e.target.value === 'Yes — ad hoc')}
                  className={`${inputCls} appearance-none`}
                >
                  <option className="bg-ink text-white">No — planned</option>
                  <option className="bg-ink text-white">Yes — ad hoc</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="text-[10px] font-black uppercase tracking-widest bg-pink text-white px-3 py-2 w-full disabled:opacity-40 hover:opacity-80 transition-opacity mt-1"
              >
                {saving ? 'Saving…' : '+ Add Task'}
              </button>

              <button
                onClick={() => setMode('smart')}
                className="text-[9px] text-white/30 hover:text-white/60 text-center transition-colors"
              >
                ← smart paste
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
