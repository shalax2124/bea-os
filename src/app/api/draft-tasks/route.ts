import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET: list all draft tasks
export async function GET() {
  try {
    const drafts = await sql`
      SELECT * FROM draft_tasks
      ORDER BY created_at DESC
    `
    return NextResponse.json(
      drafts.map((d) => ({
        ...d,
        due_date: d.due_date ? new Date(d.due_date).toISOString().split('T')[0] : null,
      }))
    )
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

// POST: approve a draft — moves it to tasks table, deletes from draft_tasks
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id, title, description, due_date, priority } = body

  if (!id || !title) {
    return NextResponse.json({ error: 'id and title are required' }, { status: 400 })
  }

  const [draft] = await sql`SELECT * FROM draft_tasks WHERE id = ${id}`
  if (!draft) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  const [inserted] = await sql`
    INSERT INTO tasks (title, description, due_date, priority, source, status)
    VALUES (
      ${title},
      ${description ?? null},
      ${due_date ?? null},
      ${priority ?? 'medium'},
      ${draft.source as string},
      'todo'
    )
    RETURNING id
  `

  await sql`DELETE FROM draft_tasks WHERE id = ${id}`

  return NextResponse.json({ ok: true, task_id: inserted.id })
}
