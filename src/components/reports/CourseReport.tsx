'use client'
import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { Download, Users, Flag, CheckSquare, Award, FileText } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

interface Props { courseId: string }

export function CourseReport({
  const { t } = useLocale() courseId }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports/course?course_id=${courseId}`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [courseId])

  async function exportExcel() {
    setExporting(true)
    const xlsx = await import('xlsx')
    const wb = xlsx.utils.book_new()
    const summary = [['Metric', 'Value'], ['Course', data.course.title_en], ['City', data.course.city?.name_en], ['Day 1', data.course.day1_date], ['Day 2', data.course.day2_date], ['Trainer', data.course.trainer_name], ['Total Trainees', data.summary.totalTrainees], ['Eligible for Certificate', data.summary.eligibleTrainees], ['Certificates Issued', data.summary.certificatesIssued], ['Open Flags', data.summary.openFlags], ['Resolved Flags', data.summary.resolvedFlags], ['Checklist Completion', `${data.summary.checklistCompletion}%`]]
    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(summary), 'Summary')
    const traineeRows = [['Name (EN)', 'Name (AR)', 'National ID (last 4)', 'Phone', 'Sessions Attended', 'Eligible', 'Certificate Issued'], ...data.trainees.map((t: any) => [t.name_en, t.name_ar, t.national_id_last4, t.phone, t.sessions_attended, t.eligible ? 'Yes' : 'No', t.certificate_issued ? 'Yes' : 'No'])]
    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(traineeRows), 'Trainees')
    const flagRows = [['Severity', 'Category', 'Description', 'Status', 'Raised By', 'Created At'], ...data.flags.map((f: any) => [f.severity, f.category, f.description, f.status, f.raised_by_profile?.full_name ?? '', f.created_at])]
    xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet(flagRows), 'Flags')
    xlsx.writeFile(wb, `SOL-Report-${data.course.title_en.replace(/\s+/g, '-')}-${data.course.day1_date}.xlsx`)
    setExporting(false)
  }

  async function exportPdf() {
    setExportingPdf(true)
    try {
      const res = await fetch(`/api/reports/pdf?course_id=${courseId}`)
      if (!res.ok) { setExportingPdf(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SOL-Report-${data.course.title_en.replace(/\s+/g, '-')}-${data.course.day1_date}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportingPdf(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!data || data.error) return <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">{data?.error ?? 'Failed to load report'}</div>

  const s = data.summary
  const statCards = [
    { icon: <Users size={16} />, label: 'Total trainees', value: s.totalTrainees, color: 'text-gray-900' },
    { icon: <Award size={16} />, label: 'Cert. eligible', value: s.eligibleTrainees, color: 'text-green-700' },
    { icon: <Flag size={16} />, label: 'Open flags', value: s.openFlags, color: s.openFlags > 0 ? 'text-red-600' : 'text-gray-900' },
    { icon: <CheckSquare size={16} />, label: 'Checklist', value: `${s.checklistCompletion}%`, color: s.checklistCompletion === 100 ? 'text-green-700' : 'text-gray-900' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{data.course.title_en}</p>
          <p className="text-xs text-gray-400">{data.course.city?.name_en} · Trainer: {data.course.trainer_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportPdf} disabled={exportingPdf} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <FileText size={14} />{exportingPdf ? 'Exporting…' : 'Export PDF'}
          </button>
          <button onClick={exportExcel} disabled={exporting} className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Download size={14} />{exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-1.5 text-gray-400 mb-2">{card.icon}<span className="text-xs">{card.label}</span></div>
            <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
      {data.trainees.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Trainees ({data.trainees.length})</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-50 bg-gray-50"><th className="text-left py-2 px-4 text-xs font-semibold text-gray-400">Name</th><th className="text-center py-2 px-3 text-xs font-semibold text-gray-400">Sessions</th><th className="text-center py-2 px-3 text-xs font-semibold text-gray-400">Eligible</th><th className="text-center py-2 px-3 text-xs font-semibold text-gray-400">Certificate</th></tr></thead>
              <tbody className="divide-y divide-gray-50">
                {data.trainees.map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4"><p className="font-medium text-gray-900">{t.name_en}</p><p className="text-xs text-gray-400 font-mono">{t.national_id_last4}</p></td>
                    <td className="text-center py-2.5 px-3"><div className="flex justify-center gap-0.5">{[0,1,2,3].map(i => <div key={i} className={`w-2.5 h-2.5 rounded-sm ${i < t.sessions_attended ? 'bg-green-500' : 'bg-gray-200'}`} />)}</div></td>
                    <td className="text-center py-2.5 px-3">{t.eligible ? <span className="text-green-600 font-semibold text-xs">✓ Yes</span> : <span className="text-gray-300 text-xs">No</span>}</td>
                    <td className="text-center py-2.5 px-3">{t.certificate_issued ? <span className="text-amber-600 font-semibold text-xs">✓ Issued</span> : <span className="text-gray-300 text-xs">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {data.flags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Flags ({data.flags.length})</p></div>
          <div className="divide-y divide-gray-50">
            {data.flags.map((f: any) => {
              const sevColor: Record<string, string> = { emergency: 'text-red-600', critical: 'text-orange-600', warning: 'text-amber-600', info: 'text-blue-600' }
              const dotColor: Record<string, string> = { emergency: 'bg-red-500', critical: 'bg-orange-500', warning: 'bg-amber-500', info: 'bg-blue-500' }
              return (
                <div key={f.id} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${dotColor[f.severity] ?? 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className={`text-xs font-semibold capitalize ${sevColor[f.severity] ?? 'text-gray-600'}`}>{f.severity}</span><span className="text-xs text-gray-400">{f.status}</span></div>
                    <p className="text-sm text-gray-700 truncate">{f.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
