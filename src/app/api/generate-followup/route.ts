import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY is not set' }, { status: 500 })
  }

  const body = await req.json()
  const { taskTitle, daysWaiting, blockedOn } = body

  if (!taskTitle || typeof taskTitle !== 'string' || taskTitle.trim().length === 0) {
    return NextResponse.json({ error: 'taskTitle is required' }, { status: 400 })
  }
  if (typeof daysWaiting !== 'number') {
    return NextResponse.json({ error: 'daysWaiting is required' }, { status: 400 })
  }
  if (!blockedOn || typeof blockedOn !== 'string' || blockedOn.trim().length === 0) {
    return NextResponse.json({ error: 'blockedOn is required' }, { status: 400 })
  }

  const prompt = `Bea is an executive assistant following up with Jeff, her client/founder. She needs to send a short, friendly follow-up message about a task that's been waiting on Jeff for ${daysWaiting} days.

Task: "${taskTitle.trim()}"
Waiting on: ${blockedOn.trim()}

Write ONE short follow-up message (2 sentences max) that Bea can send Jeff via WhatsApp or Slack. Tone: warm, professional, not pushy. Don't start with "Hi Jeff" — just go straight to the follow-up. No emojis.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to generate follow-up' }, { status: 502 })
  }

  const data = await res.json()
  const message = data.choices?.[0]?.message?.content ?? ''

  return NextResponse.json({ message })
}
