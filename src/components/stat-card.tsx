interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  detail?: string
  accent?: boolean
}

export function StatCard({ title, value, subtitle, detail, accent }: StatCardProps) {
  return (
    <div className="group border-2 border-ink bg-white p-5 transition-all duration-200 hover:bg-ink cursor-default">
      <p className="text-[9px] font-black tracking-[0.18em] uppercase text-gray-400 group-hover:text-white/40 transition-colors">
        {title}
      </p>
      <p className={`mt-2 text-4xl font-black leading-none animate-count transition-colors ${
        accent ? 'text-pink group-hover:text-pink' : 'text-ink group-hover:text-white'
      }`}>
        {value}
      </p>
      {subtitle && (
        <p className="mt-2 text-[10px] text-gray-400 group-hover:text-white/40 transition-colors">
          {subtitle}
        </p>
      )}
      {detail && (
        <p className="mt-0.5 text-[10px] font-medium text-gray-500 group-hover:text-white/50 transition-colors">
          {detail}
        </p>
      )}
    </div>
  )
}
