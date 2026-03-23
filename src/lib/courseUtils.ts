import type { CourseStatus, FlagSeverity } from '@/types'

export const statusLabels: Record<CourseStatus, string> = {
  draft: 'Draft', scheduled: 'Scheduled', in_progress: 'In Progress',
  completed: 'Completed', archived: 'Archived',
}

export const flagSeverityLabels: Record<FlagSeverity, string> = {
  info: 'Info', warning: 'Warning', critical: 'Critical', emergency: 'Emergency',
}

export const flagSeverityColors: Record<FlagSeverity, string> = {
  info: 'bg-blue-500', warning: 'bg-amber-500',
  critical: 'bg-orange-500', emergency: 'bg-red-500',
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
