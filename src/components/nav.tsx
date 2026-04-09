import { UserButton } from '@clerk/nextjs'

function getCurrentWeekLabel(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Monday of current week
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  // Friday of current week
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const year = friday.getFullYear()
  return `Week of ${fmt(monday)}\u2013${fmt(friday)}, ${year}`
}

export function Nav() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Bea&apos;s OS</h1>
        <p className="text-xs text-gray-500">{getCurrentWeekLabel()}</p>
      </div>
      <UserButton />
    </nav>
  )
}
