'use client'

import { useState } from 'react'

export function EodSummary() {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-eod', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setSummary(data.summary)
    } catch {
      setError('Failed to reach the server.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!summary) return
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-2 border-ink bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-ink px-5 py-3">
        <h3 className="text-[10px] font-black tracking-[0.18em] uppercase text-white">
          EOD Update
        </h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 bg-pink px-3 py-1 text-[10px] font-black tracking-widest uppercase text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating
            </>
          ) : (
            'Generate →'
          )}
        </button>
      </div>

      <div className="px-5 py-4">
        {!summary && !error && (
          <p className="text-xs text-gray-400 py-2">
            Generate your end-of-day summary to copy into Slack or email.
          </p>
        )}

        {error && <p className="text-xs text-pink font-bold">{error}</p>}

        {summary && (
          <div className="space-y-3">
            <textarea
              readOnly
              value={summary}
              rows={10}
              className="w-full border border-gray-200 bg-cream px-3 py-2.5 text-xs font-mono text-ink resize-none focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-2 transition-all ${
                copied
                  ? 'border-lime bg-lime text-ink'
                  : 'border-ink bg-white text-ink hover:bg-ink hover:text-white'
              }`}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
