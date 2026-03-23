import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import Link from 'next/link'
import { ExternalLink, Award } from 'lucide-react'

export default async function CertificatesPage() {
  const supabase = await createClient()
  await getProfile()
  const { data: certs } = await supabase.from('certificates')
    .select('*, trainee:trainees(full_name_en, full_name_ar), course:courses(title_en, day1_date, city:cities(name_en))')
    .order('generated_at', { ascending: false })
    .limit(100)

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Certificates</h1>
          <p className="text-sm text-gray-500 mt-0.5">{certs?.length ?? 0} certificates issued</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!certs || certs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Award size={32} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-900">No certificates yet</p>
            <p className="text-sm text-gray-400 mt-1">Generate certificates from the Attendance page</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Trainee</div>
              <div>Course</div>
              <div>Issued</div>
              <div>Actions</div>
            </div>
            {certs.map((cert: any) => (
              <div key={cert.id} className="grid grid-cols-5 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors">
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">{cert.trainee?.full_name_en}</p>
                  <p className="text-xs text-gray-400" dir="rtl">{cert.trainee?.full_name_ar}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 line-clamp-1">{cert.course?.title_en}</p>
                  <p className="text-xs text-gray-400">{cert.course?.city?.name_en}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">{formatDate(cert.generated_at)}</p>
                  <p className="font-mono text-xs text-gray-400">{cert.verification_code}</p>
                </div>
                <div className="flex items-center gap-2">
                  {cert.pdf_url && (
                    <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors">
                      <ExternalLink size={13} />PDF
                    </a>
                  )}
                  <Link href={`/verify/${cert.verification_code}`} target="_blank"
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                    Verify
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
