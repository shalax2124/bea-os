'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Dashboard', href: '/' },
  { name: 'Log Task', href: '/log-task' },
  { name: 'Jeff Tracker', href: '/jeff-tracker' },
  { name: 'Archive', href: '/archive' },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-1 px-4 sm:px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
