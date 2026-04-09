'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { SidebarLogTask } from './sidebar-log-task'

const links = [
  { name: 'Dashboard', href: '/' },
  { name: 'Log Task', href: '/log-task' },
  { name: 'Jeff Tracker', href: '/jeff-tracker' },
  { name: 'Archive', href: '/archive' },
  { name: 'Slack Preview', href: '/slack-preview' },
]

function getCurrentWeekLabel(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const year = friday.getFullYear()
  return `Week of ${fmt(monday)}\u2013${fmt(friday)}, ${year}`
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-72 bg-white border-r border-gray-200 flex-col p-4 fixed top-0 left-0 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-base font-bold text-gray-900">Bea&apos;s OS</h1>
        <p className="text-xs text-gray-500 mt-0.5">{getCurrentWeekLabel()}</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((link) => {
          const isActive = link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href)
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {link.name}
            </Link>
          )
        })}
      </nav>
      <SidebarLogTask />
      <div className="pt-4 border-t border-gray-200">
        <UserButton />
      </div>
    </aside>
  )
}
