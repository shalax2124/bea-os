import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Sends the Monday brief to Slack. Called by Vercel Cron (GET) or manually (POST).
export async function GET() {
  return sendBrief()
}

export async function POST() {
  return sendBrief()
}

async function sendBrief() {
  const botToken = process.env.SLACK_BOT_TOKEN
  const channelId = process.env.SLACK_CHANNEL_ID

  if (!botToken || !channelId) {
    return NextResponse.json({ error: 'SLACK_BOT_TOKEN and SLACK_CHANNEL_ID are required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const dayName = new Date().toLocaleDateString('en-PH', { weekday: 'long', timeZone: 'Asia/Manila' })

  // Query tasks
  const tasks = await sql`
    SELECT * FROM tasks
    WHERE status != 'done' AND archived = FALSE
    ORDER BY
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      due_date ASC NULLS LAST
  `

  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date).toISOString().split('T')[0] < today)
  const highPriority = tasks.filter((t) => t.priority === 'high').slice(0, 5)
  const blockedOnJeff = tasks.filter((t) => t.blocked_on?.toLowerCase().includes('jeff'))

  const doneLastWeek = await sql`
    SELECT COUNT(*) as count FROM tasks
    WHERE status = 'done'
    AND updated_at >= NOW() - INTERVAL '7 days'
  `
  const doneCount = Number(doneLastWeek[0]?.count ?? 0)

  // Build message
  const lines: string[] = [
    `*Good morning, Bea! Here's your ${dayName} brief* 🌅`,
    '',
    `*📋 Active tasks:* ${tasks.length} total`,
  ]

  if (overdue.length > 0) {
    lines.push(`*🔴 Overdue (${overdue.length}):*`)
    for (const t of overdue.slice(0, 3)) {
      const due = new Date(t.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
      lines.push(`  • ${t.title} _(due ${due})_`)
    }
    if (overdue.length > 3) lines.push(`  _...and ${overdue.length - 3} more_`)
  }

  if (highPriority.length > 0) {
    lines.push(`*🔥 Top priorities:*`)
    for (const t of highPriority) {
      lines.push(`  • ${t.title}`)
    }
  }

  if (blockedOnJeff.length > 0) {
    lines.push(`*⏳ Waiting on Jeff (${blockedOnJeff.length}):*`)
    for (const t of blockedOnJeff.slice(0, 3)) {
      lines.push(`  • ${t.title}`)
    }
  }

  lines.push('')
  lines.push(`*✅ Done last 7 days:* ${doneCount} task${doneCount !== 1 ? 's' : ''}`)
  lines.push('')
  lines.push('_Have a great week! 💪_')

  const message = lines.join('\n')

  const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel: channelId, text: message }),
  })

  const slackData = await slackRes.json()
  if (!slackData.ok) {
    return NextResponse.json({ error: `Slack error: ${slackData.error}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message_ts: slackData.ts })
}
