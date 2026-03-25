'use client'
import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

interface Props { courseId: string; onClose: () => void; onSuccess: () => void }

export function AddTraineeModal({ courseId, onClose, onSuccess }: Props) {
  const { t } = useLocale()
  const [form, setForm] = useState({ full_name_en: '', full_name_ar: '', national_id_last4: '', phone: '', email: '', consent_given: false })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string | boolean) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consent_given) { setError(t('attendance.consent')); return }
    setSubmitting(true); setError('')
    const res = await fetch('/api/trainees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, course_id: courseId }) })
    if (!res.ok) { const err = await res.json(); setError(err.error || 'Failed to add trainee'); setSubmitting(false); return }
    onSuccess()
  }

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2"><UserPlus size={18} className="text-gray-600" /><h2 className="font-semibold text-gray-900">{t('attendance.addTrainee')}</h2></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>{t('attendance.nameEn')}</label>
            <input type="text" required value={form.full_name_en} onChange={e => set('full_name_en', e.target.value)} className={inputClass} placeholder="e.g. Ahmed Al-Rashidi" />
          </div>
          <div>
            <label className={labelClass}>{t('attendance.nameAr')}</label>
            <input type="text" required value={form.full_name_ar} onChange={e => set('full_name_ar', e.target.value)} className={inputClass} dir="rtl" placeholder="مثال: أحمد الراشدي" />
          </div>
          <div>
            <label className={labelClass}>{t('attendance.nationalId')}</label>
            <input type="text" required value={form.national_id_last4} onChange={e => set('national_id_last4', e.target.value)} className={inputClass} maxLength={4} pattern="\d{4}" placeholder="e.g. 4521" />
            <p className="text-xs text-gray-400 mt-1">{t('users.pdplInfo').slice(0, 50)}…</p>
          </div>
          <div>
            <label className={labelClass}>{t('attendance.phone')}</label>
            <input type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)} className={inputClass} placeholder="+966501234567" />
          </div>
          <div>
            <label className={labelClass}>{t('attendance.email')}</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} placeholder="trainee@example.com" />
          </div>
          <div className={`rounded-xl border-2 p-4 ${form.consent_given ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.consent_given} onChange={e => set('consent_given', e.target.checked)} className="mt-0.5 rounded" />
              <div>
                <p className="text-sm font-medium text-gray-900">{t('attendance.consent')}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t('users.pdplInfo')}</p>
              </div>
            </label>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">{t('common.cancel')}</button>
            <button type="submit" disabled={submitting || !form.consent_given} className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
              {submitting ? t('common.saving') : t('attendance.addBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
