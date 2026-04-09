import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 })
  }

  const tasks = await sql`
    SELECT title, priority, due_date, status, blocked_on, is_adhoc_jeff, source
    FROM tasks
    WHERE archived = FALSE AND status != 'done'
    ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      due_date ASC NULLS LAST
    LIMIT 20
  `

  const today = new Date().toISOString().split('T')[0]

  const taskLines = tasks
    .map((t) => {
      const parts: string[] = [`- [${t.priority}] ${t.title}`]
      if (t.due_date) {
        const dueStr = new Date(t.due_date).toISOString().split('T')[0]
        const overdue = dueStr < today
        parts.push(`due ${dueStr}${overdue ? ' (OVERDUE)' : ''}`)
      }
      if (t.blocked_on) parts.push(`blocked on: ${t.blocked_on}`)
      if (t.is_adhoc_jeff) parts.push('(Jeff ad-hoc)')
      return parts.join(' | ')
    })
    .join('\n')

  const jeffCount = tasks.filter((t) =>
    String(t.blocked_on ?? '').toLowerCase().includes('jeff')
  ).length

  const prompt = `You are writing a Monday morning Slack DM from Claude to Bea, an executive assistant managing Jeff Yu's business operations.

Active tasks this week:
${taskLines || 'No active tasks.'}

Items waiting on Jeff: ${jeffCount}

Write a brief, warm Monday morning message (under 150 words) that:
1. Surfaces Bea's top 3 priorities for the week
2. Notes how many items are waiting on Jeff
3. Flags any tasks that are overdue or need attention today
4. Ends with one encouraging line

Use plain text with minimal formatting. Start with "Morning Bea 👋"`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `OpenRouter error: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  const message = data.choices?.[0]?.message?.content ?? ''

  return NextResponse.json({ message })
}
