import Link from 'next/link'

const ACCENTS: Record<string, string> = {
  default: '#142680', green: '#16a34a', red: '#dc2626', orange: '#ea580c', amber: '#d97706',
}

interface Props { icon: React.ReactNode; label: string; value: string | number; subLabel?: string; href?: string; color?: string }

export function StatCard({ icon, label, value, subLabel, href, color = 'default' }: Props) {
  const accent = ACCENTS[color] ?? ACCENTS.default
  const card = (
    <div className={`sol-card p-5 stat-card-accent ${href ? 'cursor-pointer' : ''}`}
      style={{borderTopColor: accent}}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{background:`${accent}12`,color:accent}}>
          {icon}
        </div>
        {href && <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:`${accent}10`,color:accent}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>}
      </div>
      <p className="text-2xl font-bold" style={{color:'#10120f'}}>{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
    </div>
  )
  return href ? <Link href={href}>{card}</Link> : card
}
