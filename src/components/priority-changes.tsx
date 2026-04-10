import { sql } from '@/lib/db'

type ChangeRow = {
  id: number
  task_id: number
  changed_at: string
  old_priority: string | null
  new_priority: string | null
  old_status: string | null
  new_status: string | null
  title: string
  source: string | null
  is_adhoc_jeff: boolean | null
}

type NewTaskRow = {
  id: number
  title: string
  source: string | null
  is_adhoc_jeff: boolean | null
  created_at: string
  priority: string
}

function relativeDate(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

const SOURCE_COLORS: Record<string, string> = {
  fathom: 'bg-purple-100 text-purple-700',
  slack: 'bg-green-100 text-green-700',
  whatsapp: 'bg-emerald-100 text-emerald-700',
  email: 'bg-blue-100 text-blue-700',
  manual: 'bg-gray-100 text-gray-600',
}

function SourcePill({ source }: { source: string }) {
  const colors = SOURCE_COLORS[source] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${colors}`}>
      {source}
    </span>
  )
}

export async function PriorityChanges() {
  let changes: ChangeRow[] = []
  let newTasks: NewTaskRow[] = []

  try {
    changes = (await sql`
      SELECT
        pl.id,
        pl.task_id,
        pl.changed_at,
        pl.old_priority,
        pl.new_priority,
        pl.old_status,
        pl.new_status,
        t.title,
        t.source,
        t.is_adhoc_jeff
      FROM task_priority_log pl
      JOIN tasks t ON t.id = pl.task_id
      WHERE pl.changed_at >= NOW() - INTERVAL '7 days'
      ORDER BY pl.changed_at DESC
      LIMIT 15
    `) as ChangeRow[]

    newTasks = (await sql`
      SELECT id, title, source, is_adhoc_jeff, created_at, priority
      FROM tasks
      WHERE created_at >= NOW() - INTERVAL '7 days'
      AND archived = FALSE
      ORDER BY created_at DESC
    `) as NewTaskRow[]
  } catch {
    // table may not exist yet — fail silently
  }

  const totalCount = changes.length + newTasks.length

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Priority Changes</h2>
        {totalCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            {totalCount} this week
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No priority changes this week.</p>
      ) : (
        <ul className="space-y-3">
          {newTasks.map((t) => (
            <li key={`new-${t.id}`} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                  NEW
                </span>
                <span className="font-medium text-sm text-gray-900">{t.title}</span>
                {t.is_adhoc_jeff && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                    JEFF (AD HOC)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{relativeDate(new Date(t.created_at).toISOString())}</span>
                <SourcePill source={t.source ?? 'manual'} />
              </div>
            </li>
          ))}

          {changes.map((c) => (
            <li key={`change-${c.id}`} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-sm text-gray-900">{c.title}</span>
                {c.is_adhoc_jeff && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700">
                    JEFF (AD HOC)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                {c.old_priority !== c.new_priority && (
                  <span>
                    {c.old_priority} <span className="text-gray-400">&#x2192;</span> {c.new_priority}
                  </span>
                )}
                {c.old_status !== c.new_status && (
                  <span>
                    {c.old_status} <span className="text-gray-400">&#x2192;</span> {c.new_status}
                  </span>
                )}
                <span>{relativeDate(new Date(c.changed_at).toISOString())}</span>
                <SourcePill source={c.source ?? 'manual'} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
