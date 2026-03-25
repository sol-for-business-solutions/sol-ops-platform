'use client'
import { useLocale } from '@/hooks/useLocale'

interface City { id: string; name_en: string; name_ar: string; region_en: string; region_ar: string; total: number; active: number; scheduled: number; completed: number; openFlags: number; trainees: number }

export function CityTable({ cities }: { cities: City[] }) {
  const { t, locale } = useLocale()
  const active = cities.filter(c => c.total > 0)
  if (active.length === 0) return <p className="text-sm text-gray-400 text-center py-8">{t('cities.noCityData')}</p>
  const headers = [t('cities.city'), t('cities.active'), t('cities.scheduled'), t('cities.completed'), t('cities.flags'), t('cities.trainees')]
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr style={{borderBottom:'1px solid #e8edf5'}}>
            {headers.map((h, i) => (
              <th key={h} className={`py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map(city => (
            <tr key={city.id} className="hover:bg-blue-50/50 transition-colors" style={{borderBottom:'1px solid #f0f4ff'}}>
              <td className="py-3 px-3">
                <p className="font-semibold text-gray-800">{locale === 'ar' ? city.name_ar : city.name_en}</p>
                <p className="text-xs text-gray-400">{locale === 'ar' ? city.region_ar : city.region_en}</p>
              </td>
              <td className="text-right py-3 px-3"><span className="text-sm font-bold" style={{color: city.active > 0 ? '#16a34a' : '#9ca3af'}}>{city.active || '—'}</span></td>
              <td className="text-right py-3 px-3"><span className="text-sm font-semibold" style={{color: city.scheduled > 0 ? '#142680' : '#9ca3af'}}>{city.scheduled || '—'}</span></td>
              <td className="text-right py-3 px-3 text-gray-600">{city.completed}</td>
              <td className="text-right py-3 px-3"><span className="text-sm font-bold" style={{color: city.openFlags > 0 ? '#dc2626' : '#9ca3af'}}>{city.openFlags || '—'}</span></td>
              <td className="text-right py-3 px-3 text-gray-600">{city.trainees}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
