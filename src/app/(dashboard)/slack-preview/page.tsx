'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

export default function SlackPreviewPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generateBrief() {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/generate-slack-preview', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate brief')
      }
      const data = await res.json()
      setMessage(data.message ?? '')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard() {
    if (!message) return
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Monday Morning Brief</h2>
          <p className="mt-1 text-sm text-gray-500">
            Preview the Slack DM Claude would send Bea on Monday morning.
          </p>
        </div>
        <button
          onClick={generateBrief}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate Brief'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!message && !loading && !error && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-400">
          Click &ldquo;Generate Brief&rdquo; to preview your Monday morning message.
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      )}

      {message && !loading && (
        <div className="space-y-3">
          {/* Slack-style message card */}
          <div className="rounded-lg bg-gray-800 p-5 shadow-md">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500 text-xs font-bold text-white">
                C
              </div>
              <div>
                <span className="text-sm font-semibold text-white">Claude</span>
                <span className="ml-2 text-xs text-gray-400">Monday morning</span>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-100">
              {message}
            </pre>
          </div>

          <div className="flex justify-end">
            <button
              onClick={copyToClipboard}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
