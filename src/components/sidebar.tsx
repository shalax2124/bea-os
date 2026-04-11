'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { SidebarLogTask } from './sidebar-log-task'

const links = [
  { name: 'Dashboard', href: '/' },
  { name: 'Log Task', href: '/log-task' },
  { name: 'Jeff Tracker', href: '/jeff-tracker' },
  { name: 'History', href: '/history' },
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
  return `${fmt(monday)} – ${fmt(friday)}, ${year}`
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-72 bg-ink flex-col fixed top-0 left-0 h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-white/10">
        <h1 className="text-xl font-black tracking-[0.2em] text-white uppercase">
          Bea&apos;s OS
        </h1>
        <p className="mt-1.5 text-[10px] tracking-widest uppercase text-white/35 font-medium">
          {getCurrentWeekLabel()}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-3 pt-4 gap-0.5 flex-1">
        {links.map((link, i) => {
          const isActive = link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href)
          return (
            <Link
              key={link.name}
              href={link.href}
              style={{ animationDelay: `${i * 0.05 + 0.1}s` }}
              className={`animate-fade-in flex items-center px-3 py-2.5 text-[11px] font-bold tracking-[0.12em] uppercase transition-all duration-150 border-l-2 ${
                isActive
                  ? 'border-pink bg-white/8 text-white'
                  : 'border-transparent text-white/40 hover:text-white hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {link.name}
            </Link>
          )
        })}
      </nav>

      {/* Log Task */}
      <div className="px-4 pb-2">
        <SidebarLogTask />
      </div>

      {/* User */}
      <div className="px-6 py-5 border-t border-white/10">
        <UserButton />
      </div>
    </aside>
  )
}
