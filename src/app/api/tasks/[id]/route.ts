import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numericId = parseInt(id)
  const body = await req.json()
  const { status, priority, title, description, due_date, blocked_on, archived, is_adhoc_jeff } = body

  // Handle archive toggle separately (boolean doesn't work in COALESCE)
  if (typeof archived === 'boolean') {
    const [task] = await sql`
      UPDATE tasks SET archived = ${archived}, updated_at = NOW()
      WHERE id = ${numericId}
      RETURNING *
    `
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ task })
  }

  // Handle is_adhoc_jeff boolean separately (boolean doesn't work in COALESCE)
  if (typeof is_adhoc_jeff === 'boolean') {
    const [task] = await sql`
      UPDATE tasks SET is_adhoc_jeff = ${is_adhoc_jeff}, updated_at = NOW()
      WHERE id = ${numericId}
      RETURNING *
    `
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ task })
  }

  // Fetch current priority/status before update to detect changes for logging
  const [current] = await sql`SELECT priority, status FROM tasks WHERE id = ${numericId}`
  if (!current) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const oldPriority = current.priority as string
  const oldStatus = current.status as string
  const newPriority = (priority ?? null) as string | null
  const newStatus = (status ?? null) as string | null

  const [task] = await sql`
    UPDATE tasks SET
      title = COALESCE(${title ?? null}, title),
      description = COALESCE(${description ?? null}, description),
      due_date = COALESCE(${due_date ?? null}, due_date),
      priority = COALESCE(${newPriority}, priority),
      status = COALESCE(${newStatus}, status),
      blocked_on = COALESCE(${blocked_on ?? null}, blocked_on),
      updated_at = NOW()
    WHERE id = ${numericId}
    RETURNING *
  `

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Log priority/status changes for trend analysis
  const resolvedPriority = newPriority ?? oldPriority
  const resolvedStatus = newStatus ?? oldStatus
  if (resolvedPriority !== oldPriority || resolvedStatus !== oldStatus) {
    await sql`
      INSERT INTO task_priority_log (task_id, old_priority, new_priority, old_status, new_status)
      VALUES (${numericId}, ${oldPriority}, ${resolvedPriority}, ${oldStatus}, ${resolvedStatus})
    `
  }

  return NextResponse.json({ task })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await sql`DELETE FROM tasks WHERE id = ${parseInt(id)}`
  return NextResponse.json({ ok: true })
}
