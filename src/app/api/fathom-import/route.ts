import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Zapier posts here after a Fathom meeting ends
// Body: { transcript: string, secret?: string }
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })
  }

  // Optional webhook secret for security
  const webhookSecret = process.env.FATHOM_WEBHOOK_SECRET
  if (webhookSecret) {
    const incoming = req.headers.get('x-webhook-secret') ?? ''
    if (incoming !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: { transcript?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { transcript } = body
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 10) {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are a task extraction assistant for an executive assistant named Bea.
Extract ALL action items and tasks from this Fathom meeting transcript.

Today's date is ${today}.

Return ONLY a valid JSON array of task objects. Each object must have:
- title: short action-oriented task name (max 80 chars)
- description: more detail, or null
- due_date: ISO date (YYYY-MM-DD) if mentioned, or null
- priority: "high", "medium", or "low" based on urgency

If there are no tasks, return an empty array [].

Transcript:
"""
${transcript.slice(0, 4000)}
"""

JSON array:`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? '[]'
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  let tasks: { title: string; description?: string; due_date?: string; priority?: string }[]
  try {
    tasks = JSON.parse(cleaned)
    if (!Array.isArray(tasks)) tasks = []
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw }, { status: 500 })
  }

  if (tasks.length === 0) {
    return NextResponse.json({ inserted: 0, message: 'No tasks found in transcript' })
  }

  // Save all as draft tasks
  const inserted: number[] = []
  for (const task of tasks) {
    if (!task.title) continue
    const [row] = await sql`
      INSERT INTO draft_tasks (title, description, due_date, priority, source, raw_text)
      VALUES (
        ${task.title},
        ${task.description ?? null},
        ${task.due_date ?? null},
        ${task.priority ?? 'medium'},
        'fathom',
        ${transcript.slice(0, 2000)}
      )
      RETURNING id
    `
    if (row?.id) inserted.push(row.id as number)
  }

  return NextResponse.json({ inserted: inserted.length, ids: inserted })
}
