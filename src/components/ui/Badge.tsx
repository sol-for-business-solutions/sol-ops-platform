const VARIANTS: Record<string, { bg: string; text: string; border: string }> = {
  draft:       { bg: '#f8f9fa', text: '#6b7280', border: '#e5e7eb' },
  scheduled:   { bg: '#eff6ff', text: '#142680', border: '#bfdbfe' },
  in_progress: { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
  completed:   { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  archived:    { bg: '#f9fafb', text: '#9ca3af', border: '#e5e7eb' },
  info:        { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  warning:     { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
  critical:    { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  emergency:   { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
  default:     { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' },
}

interface BadgeProps { label: string; variant?: string; className?: string }

export function Badge({ label, variant = 'default', className }: BadgeProps) {
  const style = VARIANTS[variant] ?? VARIANTS.default
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${className ?? ''}`}
      style={{background:style.bg,color:style.text,border:`1px solid ${style.border}`}}>
      {label}
    </span>
  )
}
