import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Polls Slack channel history, AI-extracts task-like messages → saves as draft_tasks
export async function POST() {
  const botToken = process.env.SLACK_BOT_TOKEN
  const channelId = process.env.SLACK_CHANNEL_ID
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!botToken || !channelId) {
    return NextResponse.json({ error: 'SLACK_BOT_TOKEN and SLACK_CHANNEL_ID are required' }, { status: 400 })
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })
  }

  // Get last synced timestamp
  const [stateRow] = await sql`SELECT last_synced_ts FROM slack_sync_state WHERE id = 1`
  const oldest = stateRow?.last_synced_ts ?? undefined

  // Fetch Slack messages since last sync
  const params = new URLSearchParams({
    channel: channelId,
    limit: '50',
    ...(oldest ? { oldest } : {}),
  })

  const slackRes = await fetch(`https://slack.com/api/conversations.history?${params}`, {
    headers: { Authorization: `Bearer ${botToken}` },
  })

  const slackData = await slackRes.json()

  if (!slackData.ok) {
    return NextResponse.json({ error: `Slack error: ${slackData.error}` }, { status: 500 })
  }

  const messages: { text: string; ts: string }[] = slackData.messages ?? []
  if (messages.length === 0) {
    return NextResponse.json({ synced: 0, message: 'No new messages' })
  }

  const today = new Date().toISOString().split('T')[0]
  let synced = 0

  for (const msg of messages) {
    if (!msg.text || msg.text.trim().length < 5) continue

    // Ask AI: is this a task?
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are a task extraction assistant for an executive assistant named Bea.

Today's date is ${today}.

Is this Slack message an actionable task? If yes, extract it. If no (e.g. it's a casual chat, announcement, or reaction), return null.

Return ONLY valid JSON: either null, or an object with:
- title: short action-oriented task name (max 80 chars)
- description: more detail, or null
- due_date: ISO date (YYYY-MM-DD) if mentioned, or null
- priority: "high", "medium", or "low"

Message:
"""
${msg.text.slice(0, 500)}
"""

JSON:`,
          },
        ],
      }),
    })

    if (!res.ok) continue

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? 'null'
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    let task: { title: string; description?: string; due_date?: string; priority?: string } | null
    try {
      task = JSON.parse(cleaned)
    } catch {
      continue
    }

    if (!task || !task.title) continue

    await sql`
      INSERT INTO draft_tasks (title, description, due_date, priority, source, raw_text)
      VALUES (
        ${task.title},
        ${task.description ?? null},
        ${task.due_date ?? null},
        ${task.priority ?? 'medium'},
        'slack',
        ${msg.text.slice(0, 1000)}
      )
    `
    synced++
  }

  // Update last synced timestamp to latest message ts
  const latestTs = messages[0]?.ts
  if (latestTs) {
    await sql`UPDATE slack_sync_state SET last_synced_ts = ${latestTs} WHERE id = 1`
  }

  return NextResponse.json({ synced, total_messages: messages.length })
}
