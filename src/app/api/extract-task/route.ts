import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 })
  }

  const body = await req.json()
  const { text } = body

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a task extraction assistant for an executive assistant named Bea. Extract a structured task from the raw text below.

Today's date is ${today}.

Return ONLY valid JSON with these exact fields:
- title: short action-oriented task name (max 80 chars)
- description: more detail if needed, or null
- due_date: ISO date string (YYYY-MM-DD) if mentioned, or null
- priority: "high", "medium", or "low" based on urgency cues
- status: "todo" (default), "in_progress", "blocked", or "done"
- blocked_on: who/what is blocking this (e.g. "Jeff", "vendor"), or null

Raw text:
"""
${text}
"""

JSON:`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? ''

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  let extracted
  try {
    extracted = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'Failed to parse response', raw }, { status: 500 })
  }

  return NextResponse.json({ task: extracted })
}
