'use client'

import { useEffect, useState } from 'react'

type TrendDay = {
  date: string
  label: string
  added: number
  completed: number
}

type TrendData = {
  trend: TrendDay[]
  jeffAddingFaster: boolean
  added4w: number
  done4w: number
}

const MAX_BAR_HEIGHT = 64
const BAR_SCALE = 8

function barHeight(value: number): number {
  return Math.min(Math.max(value * BAR_SCALE, 4), MAX_BAR_HEIGHT)
}

export function WeeklyTrend() {
  const [data, setData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/weekly-trend')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch weekly trend')
        return res.json()
      })
      .then((d: TrendData) => {
        setData(d)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      })
  }, [])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Weekly Trend</h3>
        <span className="text-xs text-gray-400">Tasks added vs. done</span>
      </div>

      {loading && (
        <div className="flex items-end gap-3 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex gap-0.5">
                <div
                  className="w-3 animate-pulse rounded-sm bg-gray-200"
                  style={{ height: `${20 + Math.random() * 30}px` }}
                />
                <div
                  className="w-3 animate-pulse rounded-sm bg-gray-200"
                  style={{ height: `${20 + Math.random() * 30}px` }}
                />
              </div>
              <div className="h-3 w-6 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">Could not load trend data.</p>
      )}

      {data && !loading && (
        <>
          <div className="flex items-end gap-1">
            {data.trend.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col-reverse items-center gap-0.5">
                <span className="text-xs text-gray-400">{day.label}</span>
                <div className="flex gap-0.5 items-end">
                  <div
                    className="w-3 rounded-sm bg-red-400"
                    style={{ height: `${barHeight(day.added)}px` }}
                    title={`Added: ${day.added}`}
                  />
                  <div
                    className="w-3 rounded-sm bg-green-400"
                    style={{ height: `${barHeight(day.completed)}px` }}
                    title={`Completed: ${day.completed}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-red-400" />
              <span className="text-xs text-gray-500">Tasks added</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-green-400" />
              <span className="text-xs text-gray-500">Tasks completed</span>
            </div>
          </div>

          {data.jeffAddingFaster && (
            <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ⚠ Jeff is consistently adding tasks faster than Bea can complete them.
            </div>
          )}
        </>
      )}
    </div>
  )
}
