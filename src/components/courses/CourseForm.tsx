'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCities } from '@/hooks/useCities'
import { ChevronLeft } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import type { Course } from '@/types'

export function CourseForm({ course }: { course?: Course }) {
  const router = useRouter()
  const { cities } = useCities()
  const { t, locale } = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title_en: course?.title_en ?? '', title_ar: course?.title_ar ?? '',
    city_id: course?.city_id ?? '', venue: course?.venue ?? '',
    day1_date: course?.day1_date ?? '', day2_date: course?.day2_date ?? '',
    trainer_name: course?.trainer_name ?? '', capacity: course?.capacity ?? 30,
    course_type: course?.course_type ?? 'standard',
  })

  useEffect(() => {
    if (form.day1_date) {
      const d = new Date(form.day1_date); d.setDate(d.getDate() + 1)
      setForm(f => ({ ...f, day2_date: d.toISOString().split('T')[0] }))
    }
  }, [form.day1_date])

  const set = (field: string, value: string | number) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const url = course ? `/api/courses/${course.id}` : '/api/courses'
      const res = await fetch(url, { method: course ? 'PATCH' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 409) throw new Error(`⚠️ ${err.error}`)
        throw new Error(err.error || 'Failed to save course')
      }
      const data = await res.json()
      router.push(`/dashboard/courses/${data.id}`)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50 text-gray-800 transition-all"
  const inputStyle = {border:'1px solid #e8edf5','--tw-ring-color':'#142680'} as React.CSSProperties
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5"

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors" style={{color:'#142680'}}>
        <ChevronLeft size={16} /> {t('common.back')}
      </button>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="sol-card p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full" style={{background:'linear-gradient(180deg,#142680,#2B35FF)'}} />
            <h2 className="text-base font-bold text-gray-900">{t('courses.courseInfo')}</h2>
          </div>
          <div>
            <label className={labelClass}>{t('courses.titleEn')}</label>
            <input type="text" required value={form.title_en} onChange={e => set('title_en', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="e.g. Leadership Excellence Program" />
          </div>
          <div>
            <label className={labelClass}>{t('courses.titleAr')}</label>
            <input type="text" required value={form.title_ar} onChange={e => set('title_ar', e.target.value)}
              className={inputClass} style={inputStyle} dir="rtl" placeholder="مثال: برنامج التميز القيادي" />
          </div>
          <div>
            <label className={labelClass}>{t('courses.city')}</label>
            <select required value={form.city_id} onChange={e => set('city_id', e.target.value)} className={inputClass} style={inputStyle}>
              <option value="">{t('courses.selectCity')}</option>
              {cities.map(c => <option key={c.id} value={c.id}>{locale === 'ar' ? `${c.name_ar} — ${c.region_ar}` : `${c.name_en} (${c.name_ar}) — ${c.region_en}`}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('courses.venue')}</label>
            <input type="text" required value={form.venue} onChange={e => set('venue', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="e.g. Hilton Riyadh Hotel" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('courses.day1')}</label>
              <input type="date" required value={form.day1_date} onChange={e => set('day1_date', e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>{t('courses.day2')}</label>
              <input type="date" required value={form.day2_date} readOnly className={`${inputClass} cursor-not-allowed opacity-60`} style={inputStyle} />
              <p className="text-xs text-gray-400 mt-1">{t('courses.day2Auto')}</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('courses.trainer')}</label>
            <input type="text" required value={form.trainer_name} onChange={e => set('trainer_name', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="e.g. Ahmed Al-Rashidi" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('courses.capacity')}</label>
              <input type="number" required min={1} max={500} value={form.capacity} onChange={e => set('capacity', parseInt(e.target.value))} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>{t('courses.courseType')}</label>
              <select value={form.course_type} onChange={e => set('course_type', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="standard">{t('courses.standard')}</option>
                <option value="advanced">{t('courses.advanced')}</option>
                <option value="workshop">{t('courses.workshop')}</option>
              </select>
            </div>
          </div>
        </div>
        {error && (
          <div className="rounded-xl p-4 text-sm" style={{background:'#fef2f2',border:'1px solid #fca5a5',color:'#991b1b'}}>{error}</div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 transition-all"
            style={{border:'1px solid #e8edf5',background:'white'}}>
            {t('common.cancel')}
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50">
            {loading ? t('common.saving') : course ? t('courses.updateCourse') : t('courses.createCourse')}
          </button>
        </div>
      </form>
    </div>
  )
}
