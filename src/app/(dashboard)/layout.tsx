import { Nav } from '@/components/nav'
import { TabBar } from '@/components/tab-bar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <TabBar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
