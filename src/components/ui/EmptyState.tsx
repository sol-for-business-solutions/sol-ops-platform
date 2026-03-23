interface EmptyStateProps { title: string; description?: string; action?: React.ReactNode }
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{background:'linear-gradient(135deg,#eff6ff,#e0e7ff)'}}>
        <span className="text-3xl">📋</span>
      </div>
      <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
