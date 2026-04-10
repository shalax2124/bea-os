import { sql } from '@/lib/db'
import { HistoryExportButton } from '@/components/history-export-button'

export const dynamic = 'force-dynamic'

type StateEvent = {
  id: number
  task_id: number
  event_type: string
  occurred_at: string
  task_title: string
  details: string | null
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  became_done: { label: 'Done', color: 'bg-green-100 text-green-700' },
  became_overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  became_blocked: { label: 'Blocked', color: 'bg-yellow-100 text-yellow-700' },
  became_in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  became_todo: { label: 'To Do', color: 'bg-gray-100 text-gray-600' },
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function buildHref(params: { filter: string; week: string }, override: Partial<{ filter: string; week: string }>) {
  const merged = { ...params, ...override }
  return `/history?filter=${merged.filter}&week=${merged.week}`
}

async function getHistory(filter: string, week: string): Promise<StateEvent[]> {
  const validFilters = ['became_done', 'became_overdue', 'became_blocked', 'became_in_progress', 'became_todo']
  const bounds = getWeekBounds(week)

  try {
    if (filter === 'all' && !bounds) {
      return (await sql`
        SELECT * FROM task_state_log ORDER BY occurred_at DESC LIMIT 200
      `) as StateEvent[]
    }
    if (filter === 'all' && bounds) {
      return (await sql`
        SELECT * FROM task_state_log
        WHERE occurred_at >= ${bounds.start} AND occurred_at <= ${bounds.end}
        ORDER BY occurred_at DESC
      `) as StateEvent[]
    }
    if (!validFilters.includes(filter)) return []
    if (!bounds) {
      return (await sql`
        SELECT * FROM task_state_log
        WHERE event_type = ${filter}
        ORDER BY occurred_at DESC LIMIT 200
      `) as StateEvent[]
    }
    return (await sql`
      SELECT * FROM task_state_log
      WHERE event_type = ${filter}
        AND occurred_at >= ${bounds.start}
        AND occurred_at <= ${bounds.end}
      ORDER BY occurred_at DESC
    `) as StateEvent[]
  } catch {
    return []
  }
}

async function getCounts(week: string): Promise<Record<string, number>> {
  const bounds = getWeekBounds(week)
  try {
    let rows
    if (bounds) {
      rows = await sql`
        SELECT event_type, COUNT(*) as count
        FROM task_state_log
        WHERE occurred_at >= ${bounds.start} AND occurred_at <= ${bounds.end}
        GROUP BY event_type
      `
    } else {
      rows = await sql`
        SELECT event_type, COUNT(*) as count
        FROM task_state_log
        GROUP BY event_type
      `
    }
    const counts: Record<string, number> = { all: 0 }
    for (const row of rows) {
      counts[row.event_type as string] = Number(row.count)
      counts.all += Number(row.count)
    }
    return counts
  } catch {
    return { all: 0 }
  }
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; week?: string }>
}) {
  const { filter = 'all', week = 'all' } = await searchParams
  const [events, counts] = await Promise.all([getHistory(filter, week), getCounts(week)])

  const params = { filter, week }

  const eventTabs = [
    { key: 'all', label: 'All' },
    { key: 'became_done', label: 'Done' },
    { key: 'became_overdue', label: 'Overdue' },
    { key: 'became_blocked', label: 'Blocked' },
  ]

  const weekTabs = [
    { key: 'all', label: 'All time' },
    { key: 'this_week', label: 'This week' },
    { key: 'last_week', label: 'Last week' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Task History</h2>
          <p className="text-sm text-gray-500 mt-0.5">Full record of all state changes — retained indefinitely.</p>
        </div>
        <HistoryExportButton filter={filter} week={week} />
      </div>

      {/* Week filter */}
      <div className="flex gap-1.5 flex-wrap">
        {weekTabs.map((tab) => {
          const isActive = week === tab.key
          return (
            <a
              key={tab.key}
              href={buildHref(params, { week: tab.key })}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </a>
          )
        })}
      </div>

      {/* Event type filter */}
      <div className="flex gap-2 flex-wrap">
        {eventTabs.map((tab) => {
          const isActive = filter === tab.key
          const count = counts[tab.key] ?? 0
          return (
            <a
              key={tab.key}
              href={buildHref(params, { filter: tab.key })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {count}
              </span>
            </a>
          )
        })}
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
          No events found for this filter.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
          {events.map((event) => {
            const meta = EVENT_LABELS[event.event_type] ?? { label: event.event_type, color: 'bg-gray-100 text-gray-600' }
            return (
              <div key={event.id} className="flex items-start gap-3 px-5 py-4">
                <span className={`mt-0.5 inline-flex shrink-0 items-center px-2 py-0.5 rounded text-xs font-semibold ${meta.color}`}>
                  {meta.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.task_title}</p>
                  {event.details && (
                    <p className="text-xs text-gray-400 mt-0.5">{event.details}</p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-gray-400">{formatDate(event.occurred_at)}</time>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
