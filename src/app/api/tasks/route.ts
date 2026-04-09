import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const tasks = await sql`
    SELECT * FROM tasks
    WHERE status != 'done'
    ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      due_date ASC NULLS LAST,
      created_at DESC
  `
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, due_date, priority, status, blocked_on, source_text, source, time_estimate } = body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const validSources = ['fathom', 'slack', 'whatsapp', 'email', 'manual']
  const safeSource = validSources.includes(source) ? source : 'manual'
  const safeTimeEstimate = Number.isInteger(time_estimate) && time_estimate > 0 ? time_estimate : null

  const [task] = await sql`
    INSERT INTO tasks (title, description, due_date, priority, status, blocked_on, source_text, source, time_estimate)
    VALUES (
      ${title.trim()},
      ${description ?? null},
      ${due_date ?? null},
      ${priority ?? 'medium'},
      ${status ?? 'todo'},
      ${blocked_on ?? null},
      ${source_text ?? null},
      ${safeSource},
      ${safeTimeEstimate}
    )
    RETURNING *
  `

  return NextResponse.json({ task }, { status: 201 })
}
