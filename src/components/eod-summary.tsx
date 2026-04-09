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

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }

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
    <div className="border border-gray-200 bg-white rounded-lg p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">EOD Update</h3>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Generating…
          </>
        ) : (
          'Generate EOD Update'
        )}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {summary && (
        <div className="mt-3 space-y-2">
          <textarea
            readOnly
            value={summary}
            rows={10}
            className="w-full rounded border border-gray-200 bg-gray-50 p-3 text-xs font-mono text-gray-800 resize-none focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}
