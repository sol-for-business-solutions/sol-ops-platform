'use client'
import Link from 'next/link'
import { ExternalLink, Award } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import { RegenerateCertButton } from '@/app/(dashboard)/dashboard/certificates/RegenerateCertButton'

interface Cert {
  id: string; pdf_url: string | null; verification_code: string; version: number | null; generated_at: string
  trainee?: { full_name_en: string; full_name_ar: string; email: string | null }
  course?: { title_en: string; city?: { name_en: string } }
}

interface Props { certs: Cert[]; canRegen: boolean }

export function CertificatesClient({ certs, canRegen }: Props) {
  const { t, locale } = useLocale()

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('certificates.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{certs.length} {t('certificates.title').toLowerCase()}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {certs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Award size={32} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-900">{t('certificates.noCerts')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('certificates.noCertsDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <div className={`grid gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide ${canRegen ? 'grid-cols-6' : 'grid-cols-5'}`}>
              <div className="col-span-2">{t('attendance.nameEn')}</div>
              <div>{t('courses.title')}</div>
              <div>{t('certificates.issuedOn')}</div>
              <div>{t('certificates.verifyCode')}</div>
              <div>{t('common.actions')}</div>
            </div>
            {certs.map((cert) => (
              <div key={cert.id} className={`grid gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors ${canRegen ? 'grid-cols-6' : 'grid-cols-5'}`}>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">{cert.trainee?.full_name_en}</p>
                  <p className="text-xs text-gray-400" dir="rtl">{cert.trainee?.full_name_ar}</p>
                  {cert.trainee?.email && <p className="text-xs text-gray-400 truncate">{cert.trainee.email}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-700 line-clamp-1">{cert.course?.title_en}</p>
                  <p className="text-xs text-gray-400">{cert.course?.city?.name_en}</p>
                </div>
                <div><p className="text-sm text-gray-700">{formatDate(cert.generated_at)}</p></div>
                <div><p className="font-mono text-xs text-gray-500">{cert.verification_code}</p></div>
                <div className="flex items-center gap-2 flex-wrap">
                  {cert.pdf_url && (
                    <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors">
                      <ExternalLink size={13} />{t('certificates.download')}
                    </a>
                  )}
                  <Link href={`/verify/${cert.verification_code}`} target="_blank"
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                    Verify
                  </Link>
                  {canRegen && <RegenerateCertButton certId={cert.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
