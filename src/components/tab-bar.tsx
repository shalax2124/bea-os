'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Dashboard', href: '/' },
  { name: 'Log Task', href: '/log-task' },
  { name: 'Jeff Tracker', href: '/jeff-tracker' },
  { name: 'History', href: '/history' },
  { name: 'Archive', href: '/archive' },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white md:hidden">
      <nav className="flex" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex-1 whitespace-nowrap px-2 py-3 text-center text-xs font-medium ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
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
