import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 })
  }

  const [doneRows, blockedRows, tomorrowRows] = await Promise.all([
    sql`
      SELECT title FROM tasks
      WHERE status = 'done'
      AND updated_at::date = CURRENT_DATE
      AND archived = FALSE
      ORDER BY updated_at DESC
    `,
    sql`
      SELECT title, blocked_on FROM tasks
      WHERE status = 'blocked'
      AND archived = FALSE
      ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
    `,
    sql`
      SELECT title FROM tasks
      WHERE due_date = CURRENT_DATE + 1
      AND status != 'done'
      AND archived = FALSE
      ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
    `,
  ])

  const doneList =
    doneRows.length > 0
      ? doneRows.map((r) => `- ${r.title}`).join('\n')
      : 'nothing completed today'

  const blockedList =
    blockedRows.length > 0
      ? blockedRows.map((r) => `- ${r.title}${r.blocked_on ? ` (waiting on: ${r.blocked_on})` : ''}`).join('\n')
      : 'nothing blocked'

  const tomorrowList =
    tomorrowRows.length > 0
      ? tomorrowRows.map((r) => `- ${r.title}`).join('\n')
      : 'nothing due tomorrow'

  const prompt = `You are helping Bea, an executive assistant, write a brief EOD Slack update.

Done today:
${doneList}

Blocked:
${blockedList}

Due tomorrow:
${tomorrowList}

Write a short, natural EOD Slack message (3 bullets max per section, casual but professional tone). Format:

✅ Done today:
• [item]

🚧 Blocked (waiting on):
• [item] — [blocker]

📋 Tomorrow:
• [item]

Keep it concise. End with one friendly closing line like "Let me know if anything needs to shift!"`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  const summary = data.choices?.[0]?.message?.content ?? ''

  return NextResponse.json({ summary })
}
