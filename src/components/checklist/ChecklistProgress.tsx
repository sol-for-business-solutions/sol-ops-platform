'use client'
import { useLocale } from '@/hooks/useLocale'

interface Props { total: number; completed: number; percentage: number }
export function ChecklistProgress({ total, completed, percentage }: Props) {
  const { t } = useLocale()
  const color = percentage === 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-gray-900'
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{t('checklist.completion')}</p>
          <p className="text-xs text-gray-400 mt-0.5">{completed} {t('common.of')} {total} {t('checklist.tasksCompleted')}</p>
        </div>
        <span className={`text-2xl font-semibold ${percentage === 100 ? 'text-green-600' : 'text-gray-900'}`}>{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
