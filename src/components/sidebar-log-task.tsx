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
      <hr className="border-gray-100 my-4" />
      <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-3">
        Log a Task
      </p>

      {error && (
        <p className="text-[10px] text-red-500 mb-2">{error}</p>
      )}

      {success ? (
        <p className="text-[10px] text-green-600 font-medium py-1">✓ Task added!</p>
      ) : (
        <>
          {/* Smart Paste Mode */}
          {mode === 'smart' && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                Smart Paste
              </p>
              <textarea
                rows={3}
                value={form.rawText}
                onChange={(e) => updateField('rawText', e.target.value)}
                placeholder="e.g. Paste a Fathom transcript, Slack message, WhatsApp chat... Claude will extract the task automatically."
                className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-full resize-none focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
              <button
                onClick={handleExtract}
                disabled={extracting || !form.rawText.trim()}
                className="text-xs bg-blue-600 text-white rounded-md px-3 py-1.5 w-full disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {extracting ? 'Extracting…' : 'Extract Task with Claude →'}
              </button>
              <button
                onClick={() => setMode('manual')}
                className="text-[10px] text-gray-400 hover:text-gray-600 text-center"
              >
                or fill in manually
              </button>
            </div>
          )}

          {/* Manual / Review Mode */}
          {mode === 'manual' && (
            <div className="flex flex-col gap-2">
              {/* TASK */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block mb-1">
                  Task
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Task name"
                  className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>

              {/* SOURCE */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block mb-1">
                  Source
                </label>
                <div className="flex gap-1 flex-wrap">
                  {sourceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        updateField(
                          'source',
                          form.source === opt.value ? 'manual' : opt.value
                        )
                      }
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        form.source === opt.value
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'border-gray-300 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* OWNER */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block mb-1">
                  Owner
                </label>
                <input
                  type="text"
                  value={form.owner}
                  onChange={(e) => updateField('owner', e.target.value)}
                  className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>

              {/* PRIORITY */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block mb-1">
                  Priority
                </label>
                <select
                  value={priorityOptions.find((p) => p.value === form.priority)?.label ?? 'P2 — This week'}
                  onChange={(e) => {
                    const found = priorityOptions.find((p) => p.label === e.target.value)
                    if (found) updateField('priority', found.value)
                  }}
                  className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DUE DATE */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => updateField('due_date', e.target.value)}
                  className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>

              {/* NOTES */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block mb-1">
                  Notes <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-full resize-none focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>

              {/* JEFF ADDED THIS? */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase block mb-1">
                  Jeff Added This?
                </label>
                <select
                  value={form.is_adhoc_jeff ? 'Yes — ad hoc' : 'No — planned'}
                  onChange={(e) =>
                    updateField('is_adhoc_jeff', e.target.value === 'Yes — ad hoc')
                  }
                  className="text-xs border border-gray-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
                >
                  <option>No — planned</option>
                  <option>Yes — ad hoc</option>
                </select>
              </div>

              {/* SAVE */}
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="text-xs bg-gray-900 text-white rounded-md px-3 py-1.5 w-full disabled:opacity-50 hover:bg-gray-700 transition-colors mt-1"
              >
                {saving ? 'Saving…' : '+ Add Task'}
              </button>

              {/* Back to smart paste */}
              <button
                onClick={() => setMode('smart')}
                className="text-[10px] text-gray-400 hover:text-gray-600 text-center"
              >
                ← back to smart paste
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
