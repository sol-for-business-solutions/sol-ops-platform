'use client'
import { useState } from 'react'
import { Shield, Search, Trash2 } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

export function PDPLClient() {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setResult(null); setDeleted(false)
    const res = await fetch(`/api/trainees?course_id=all&email=${encodeURIComponent(email)}`)
    const data = await res.json()
    setResult(Array.isArray(data) ? data : []); setLoading(false)
  }

  async function handleDelete(traineeId: string) {
    if (!confirm(t('users.anonymizeConfirm'))) return
    await fetch(`/api/trainees/${traineeId}`, { method: 'DELETE' })
    setDeleted(true); setResult(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center"><Shield size={18} className="text-white" /></div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('users.pdplTitle')}</h1>
          <p className="text-sm text-gray-400">{t('users.pdplSubtitle')}</p>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800"><strong>PDPL:</strong> {t('users.pdplInfo')}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('users.searchByEmail')}</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('users.emailPlaceholder')}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
            <Search size={15} />{loading ? t('users.searching') : t('common.search')}
          </button>
        </form>
      </div>
      {deleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700">✓ {t('users.anonymizeSuccess')}</p>
        </div>
      )}
      {result && result.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-sm text-gray-500">{t('users.noTraineeFound')}</div>
      )}
      {result && result.length > 0 && result.map((trainee: any) => (
        <div key={trainee.id} className="bg-white rounded-xl border border-gray-200 p-5 mb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{t('users.fullNameEn')}</p>
                <p className="font-medium text-gray-900">{trainee.full_name_en}</p>
                <p className="text-sm text-gray-500" dir="rtl">{trainee.full_name_ar}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400">{t('users.phone')}</p><p className="text-gray-700">{trainee.phone}</p></div>
                <div><p className="text-xs text-gray-400">{t('attendance.nationalId')}</p><p className="font-mono text-gray-700">****{trainee.national_id_last4}</p></div>
              </div>
            </div>
            <button onClick={() => handleDelete(trainee.id)}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 size={14} />{t('users.anonymize')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
