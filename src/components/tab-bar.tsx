'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Dashboard', href: '/' },
  { name: 'Log Task', href: '/log-task' },
  { name: 'Jeff', href: '/jeff-tracker' },
  { name: 'History', href: '/history' },
  { name: 'Archive', href: '/archive' },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ink border-t border-white/10 md:hidden">
      <nav className="flex" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex-1 whitespace-nowrap py-3 text-center text-[9px] font-bold tracking-widest uppercase transition-colors ${
                isActive
                  ? 'text-pink'
                  : 'text-white/35 hover:text-white/70'
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
