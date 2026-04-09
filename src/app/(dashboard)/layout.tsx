import { Nav } from '@/components/nav'
import { TabBar } from '@/components/tab-bar'
import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 md:ml-72">
        <Nav />
        <main className="flex-1 px-4 py-6 sm:px-8 max-w-5xl pb-20 md:pb-6">
          {children}
        </main>
        <TabBar />
      </div>
    </div>
  )
}
