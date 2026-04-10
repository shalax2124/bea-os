import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const EVENT_LABELS: Record<string, string> = {
  became_done: 'Done',
  became_overdue: 'Overdue',
  became_blocked: 'Blocked',
  became_in_progress: 'In Progress',
  became_todo: 'To Do',
}

function getWeekBounds(week: string): { start: string; end: string } | null {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  if (week === 'this_week') {
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return { start: monday.toISOString(), end: sunday.toISOString() }
  }

  if (week === 'last_week') {
    const lastMonday = new Date(monday)
    lastMonday.setDate(monday.getDate() - 7)
    const lastSunday = new Date(monday)
    lastSunday.setMilliseconds(-1)
    return { start: lastMonday.toISOString(), end: lastSunday.toISOString() }
  }

  return null
}

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const week = searchParams.get('week') ?? 'all'

  const validFilters = ['all', 'became_done', 'became_overdue', 'became_blocked', 'became_in_progress', 'became_todo']
  if (!validFilters.includes(filter)) {
    return NextResponse.json({ error: 'Invalid filter' }, { status: 400 })
  }

  try {
    const bounds = getWeekBounds(week)

    let rows
    if (filter === 'all' && !bounds) {
      rows = await sql`SELECT * FROM task_state_log ORDER BY occurred_at DESC LIMIT 5000`
    } else if (filter === 'all' && bounds) {
      rows = await sql`
        SELECT * FROM task_state_log
        WHERE occurred_at >= ${bounds.start} AND occurred_at <= ${bounds.end}
        ORDER BY occurred_at DESC
      `
    } else if (!bounds) {
      rows = await sql`
        SELECT * FROM task_state_log
        WHERE event_type = ${filter}
        ORDER BY occurred_at DESC
        LIMIT 5000
      `
    } else {
      rows = await sql`
        SELECT * FROM task_state_log
        WHERE event_type = ${filter}
          AND occurred_at >= ${bounds.start}
          AND occurred_at <= ${bounds.end}
        ORDER BY occurred_at DESC
      `
    }

    const header = ['Task', 'Event', 'Date & Time', 'Details']
    const csvRows = rows.map((row) => {
      const label = EVENT_LABELS[row.event_type as string] ?? String(row.event_type)
      const date = new Date(row.occurred_at as string).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
      return [
        escapeCSV(row.task_title as string),
        escapeCSV(label),
        escapeCSV(date),
        escapeCSV(row.details as string | null),
      ].join(',')
    })

    const csv = [header.join(','), ...csvRows].join('\n')
    const filename = `bea-os-history-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
