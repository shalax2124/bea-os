import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// PATCH: update draft fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { title, description, due_date, priority } = body

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  await sql`
    UPDATE draft_tasks
    SET
      title = ${title},
      description = ${description ?? null},
      due_date = ${due_date ?? null},
      priority = ${priority ?? 'medium'}
    WHERE id = ${Number(id)}
  `

  return NextResponse.json({ ok: true })
}

// DELETE: reject draft
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await sql`DELETE FROM draft_tasks WHERE id = ${Number(id)}`
  return NextResponse.json({ ok: true })
}
