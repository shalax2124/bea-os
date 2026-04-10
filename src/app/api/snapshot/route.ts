import { NextResponse } from 'next/server'
import { runOverdueSnapshot } from '@/lib/snapshot'

export async function POST() {
  const logged = await runOverdueSnapshot()
  return NextResponse.json({ logged })
}
