interface Stats { info: number; warning: number; critical: number; emergency: number }
const CFG = [
  { key: 'emergency' as const, label: 'Emergency', color: '#dc2626', light: '#fef2f2', text: '#991b1b' },
  { key: 'critical'  as const, label: 'Critical',  color: '#ea580c', light: '#fff7ed', text: '#9a3412' },
  { key: 'warning'   as const, label: 'Warning',   color: '#d97706', light: '#fffbeb', text: '#92400e' },
  { key: 'info'      as const, label: 'Info',      color: '#142680', light: '#eff6ff', text: '#1d4ed8' },
]
export function FlagSeverityBar({ stats, total }: { stats: Stats; total: number }) {
  if (total === 0) return (
    <div className="flex flex-col items-center py-8">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{background:'linear-gradient(135deg,#f0fdf4,#dcfce7)'}}>
        <span className="text-2xl">✓</span>
      </div>
      <p className="text-sm font-bold text-gray-800">All clear</p>
      <p className="text-xs text-gray-400 mt-1">No open flags at this time</p>
    </div>
  )
  return (
    <div className="space-y-4">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {CFG.map(c => stats[c.key] > 0 && (
          <div key={c.key} className="rounded-full transition-all" style={{width:`${(stats[c.key]/total)*100}%`,background:c.color}} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CFG.map(c => (
          <div key={c.key} className="flex items-center justify-between p-3 rounded-xl"
            style={{background:c.light,border:`1px solid ${c.color}20`}}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{background:c.color}} />
              <span className="text-xs font-semibold" style={{color:c.text}}>{c.label}</span>
            </div>
            <span className="text-sm font-bold" style={{color:c.text}}>{stats[c.key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
