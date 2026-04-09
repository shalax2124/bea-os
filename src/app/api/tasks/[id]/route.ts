import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { status, priority, title, description, due_date, blocked_on } = body

  const [task] = await sql`
    UPDATE tasks SET
      title = COALESCE(${title ?? null}, title),
      description = COALESCE(${description ?? null}, description),
      due_date = COALESCE(${due_date ?? null}, due_date),
      priority = COALESCE(${priority ?? null}, priority),
      status = COALESCE(${status ?? null}, status),
      blocked_on = COALESCE(${blocked_on ?? null}, blocked_on),
      updated_at = NOW()
    WHERE id = ${parseInt(id)}
    RETURNING *
  `

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  return NextResponse.json({ task })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await sql`DELETE FROM tasks WHERE id = ${parseInt(id)}`
  return NextResponse.json({ ok: true })
}
