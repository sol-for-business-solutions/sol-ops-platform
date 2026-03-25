'use client'
import { useState, useRef } from 'react'
import { X, Camera, AlertTriangle } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import type { FlagCategory, FlagSeverity } from '@/types'

interface Props { courses: { id: string; title_en: string; title_ar: string }[]; initialCourseId: string; onClose: () => void; onSuccess: () => void }

export function RaiseFlagModal({ courses, initialCourseId, onClose, onSuccess }: Props) {
  const { t, locale } = useLocale()
  const [courseId, setCourseId] = useState(initialCourseId ?? courses[0]?.id ?? '')
  const [severity, setSeverity] = useState<FlagSeverity>('warning')
  const [category, setCategory] = useState<FlagCategory>('other')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const SEVERITY_OPTIONS: { value: FlagSeverity; label: string; desc: string; color: string }[] = [
    { value: 'info',      label: t('severity.info'),      desc: t('flags.severityDesc.info'),      color: 'border-blue-200 bg-blue-50 text-blue-700' },
    { value: 'warning',   label: t('severity.warning'),   desc: t('flags.severityDesc.warning'),   color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { value: 'critical',  label: t('severity.critical'),  desc: t('flags.severityDesc.critical'),  color: 'border-orange-200 bg-orange-50 text-orange-700' },
    { value: 'emergency', label: t('severity.emergency'), desc: t('flags.severityDesc.emergency'), color: 'border-red-200 bg-red-50 text-red-700' },
  ]
  const CATEGORY_OPTIONS: { value: FlagCategory; label: string }[] = [
    { value: 'trainer_issue',     label: t('flags.categories.trainer_issue') },
    { value: 'venue_issue',       label: t('flags.categories.venue_issue') },
    { value: 'equipment_failure', label: t('flags.categories.equipment_failure') },
    { value: 'low_turnout',       label: t('flags.categories.low_turnout') },
    { value: 'medical_emergency', label: t('flags.categories.medical_emergency') },
    { value: 'other',             label: t('flags.categories.other') },
  ]

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    const formData = new FormData(); formData.append('file', file)
    const res = await fetch('/api/flags/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.url) setPhotoUrl(data.url)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) { setError(t('flags.describeRequired')); return }
    setSubmitting(true); setError('')
    const res = await fetch('/api/flags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId, severity, category, description: description.trim(), photo_url: photoUrl || null }) })
    if (!res.ok) { const err = await res.json(); setError(err.error || 'Failed'); setSubmitting(false); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /><h2 className="font-semibold text-gray-900">{t('flags.raiseTitle')}</h2></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {courses.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('flags.course')}</label>
              <select value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                {courses.map(c => <option key={c.id} value={c.id}>{locale === 'ar' ? c.title_ar : c.title_en}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('flags.severity')}</label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setSeverity(opt.value)} className={`p-3 rounded-lg border-2 text-left transition-all ${severity === opt.value ? opt.color + ' border-current' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="text-sm font-semibold">{opt.label}</p><p className="text-xs opacity-75 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('flags.category')}</label>
            <select value={category} onChange={e => setCategory(e.target.value as FlagCategory)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('flags.describe')}</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={t('flags.describePlaceholder')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('flags.photoEvidence')}</label>
            {photoUrl ? (
              <div className="flex items-center gap-3"><img src={photoUrl} alt="Evidence" className="h-20 w-20 object-cover rounded-lg border border-gray-200" /><button type="button" onClick={() => setPhotoUrl('')} className="text-xs text-red-500 hover:text-red-700 underline">{t('flags.removePhoto')}</button></div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 transition-colors disabled:opacity-50">
                <Camera size={16} />{uploading ? t('flags.uploading') : t('flags.takePhoto')}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file) }} />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
            <button type="submit" disabled={submitting || !description.trim()} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${severity === 'emergency' ? 'bg-red-600 hover:bg-red-700' : severity === 'critical' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
              {submitting ? t('flags.raisingFlag') : `${t('flags.raiseBtn')} — ${t(`severity.${severity}`)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
