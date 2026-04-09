import { NextResponse } from 'next/server'

type Task = {
  id: number
  title: string
  description: string | null
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'blocked' | 'done'
  blocked_on: string | null
  source: 'fathom' | 'slack' | 'whatsapp' | 'email' | 'manual' | null
  time_estimate: number | null
  created_at: string
  is_adhoc_jeff?: boolean | null
}

export async function POST(request: Request) {
  let body: { tasks?: unknown; totalMinutes?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tasks, totalMinutes } = body

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ error: 'tasks array is required and must not be empty' }, { status: 400 })
  }

  if (typeof totalMinutes !== 'number') {
    return NextResponse.json({ error: 'totalMinutes is required and must be a number' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 })
  }

  const typedTasks = tasks as Task[]
  const totalHours = (totalMinutes / 60).toFixed(1)

  const taskLines = typedTasks
    .map(
      (t) =>
        `- ${t.title} | priority: ${t.priority} | source: ${t.source} | is_adhoc_jeff: ${t.is_adhoc_jeff ?? false} | time: ${t.time_estimate ?? 'unknown'} min | due: ${t.due_date ?? 'no date'} | blocked_on: ${t.blocked_on ?? 'nothing'}`
    )
    .join('\n')

  const prompt = `You are an AI assistant helping Bea, an executive assistant for Jeff Yu (a Hong Kong fashion startup founder). Bea is overloaded today.

Today's task queue (${totalMinutes} min = ${totalHours}h estimated, over 8h capacity):
${taskLines}

Generate 3-4 specific, actionable triage suggestions. For each suggestion, pick one of these types:
- "defer": suggest pushing a specific task to a later date (only if no external party is waiting)
- "delegate": suggest delegating to Avena (Jeff's design VA) or the marketing VA
- "ask_jeff": suggest asking Jeff to confirm priority between two tasks, provide a draft WhatsApp message
- "flag": flag the overload pattern to Sharie (Bea's manager) if this is a recurring issue

Return ONLY valid JSON array:
[
  {
    "type": "defer" | "delegate" | "ask_jeff" | "flag",
    "task_title": "exact task name from the list",
    "reason": "one sentence explanation",
    "draft_message": "optional short message Bea can send (for ask_jeff type)"
  }
]`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  let text: string = data.choices?.[0]?.message?.content ?? ''

  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const suggestions = JSON.parse(text)
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 })
  }
}
