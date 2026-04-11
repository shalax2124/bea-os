import { Nav } from '@/components/nav'
import { TabBar } from '@/components/tab-bar'
import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex flex-col flex-1 md:ml-72">
        <Nav />
        <main className="flex-1 px-4 py-8 sm:px-8 max-w-5xl pb-24 md:pb-8">
          {children}
        </main>
        <TabBar />
      </div>
    </div>
  )
}
