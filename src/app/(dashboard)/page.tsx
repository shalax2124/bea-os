import { StatCard } from '@/components/stat-card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Tasks" value={0} subtitle="All active tasks" />
        <StatCard title="Overdue" value={0} subtitle="Past deadline" />
        <StatCard title="Blocked on Jeff" value={0} subtitle="Waiting for response" />
        <StatCard title="Done This Week" value={0} subtitle="Completed recently" />
      </div>
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
        Task list will appear here once tasks are logged.
      </div>
    </div>
  )
}
