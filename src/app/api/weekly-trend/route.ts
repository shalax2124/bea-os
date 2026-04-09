import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const [addedRows, completedRows, statsRows] = await Promise.all([
    sql`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM tasks
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `,
    sql`
      SELECT DATE(updated_at) as day, COUNT(*) as count
      FROM tasks
      WHERE status = 'done'
      AND updated_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(updated_at)
      ORDER BY day ASC
    `,
    sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '28 days') as added_4w,
        COUNT(*) FILTER (WHERE status = 'done' AND updated_at >= NOW() - INTERVAL '28 days') as done_4w
      FROM tasks
    `,
  ])

  const addedMap = new Map<string, number>(
    addedRows.map((r) => [
      new Date(r.day).toISOString().split('T')[0],
      Number(r.count),
    ])
  )
  const completedMap = new Map<string, number>(
    completedRows.map((r) => [
      new Date(r.day).toISOString().split('T')[0],
      Number(r.count),
    ])
  )

  // Generate last 7 days array
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    return d.toISOString().split('T')[0]
  })

  const trend = days.map((day) => ({
    date: day,
    label: new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    added: addedMap.get(day) ?? 0,
    completed: completedMap.get(day) ?? 0,
  }))

  const stats = statsRows[0] ?? { added_4w: 0, done_4w: 0 }
  const jeffAddingFaster = Number(stats.added_4w) > Number(stats.done_4w) * 1.2

  return NextResponse.json({
    trend,
    jeffAddingFaster,
    added4w: Number(stats.added_4w),
    done4w: Number(stats.done_4w),
  })
}
