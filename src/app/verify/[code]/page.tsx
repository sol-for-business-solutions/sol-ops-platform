import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react'

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: cert } = await supabase.from('certificates')
    .select('*, trainee:trainees(full_name_en, full_name_ar), course:courses(title_en, title_ar, day1_date, day2_date, city:cities(name_en, name_ar))')
    .eq('verification_code', code.toUpperCase()).single()
  const isValid = !!cert

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500">SOL For Business Solution</p>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">Certificate Verification</h1>
        </div>
        <div className={`bg-white rounded-2xl border-2 p-8 text-center ${isValid ? 'border-green-200' : 'border-red-200'}`}>
          {isValid ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
              </div>
              <p className="text-green-700 font-semibold text-lg mb-6">Certificate Verified ✓</p>
              <div className="space-y-4 text-left">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Recipient</p>
                    <p className="font-semibold text-gray-900">{cert.trainee.full_name_en}</p>
                    <p className="text-sm text-gray-500" dir="rtl">{cert.trainee.full_name_ar}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Course</p>
                    <p className="font-medium text-gray-900">{cert.course.title_en}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Dates</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(cert.course.day1_date)}</p>
                      <p className="text-sm text-gray-500">{formatDate(cert.course.day2_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">City</p>
                      <p className="text-sm font-medium text-gray-900">{cert.course.city.name_en}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Verification Code</p>
                    <p className="font-mono font-semibold text-gray-900 tracking-widest">{code.toUpperCase()}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Issued on</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(cert.generated_at)}</p>
                  </div>
                </div>
                {cert.pdf_url && (
                  <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                    <ExternalLink size={15} />Download Certificate PDF
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle size={32} className="text-red-500" />
                </div>
              </div>
              <p className="text-red-700 font-semibold text-lg mb-2">Certificate Not Found</p>
              <p className="text-gray-500 text-sm">
                The code <span className="font-mono font-medium text-gray-700">{code.toUpperCase()}</span> does not match any issued certificate.
              </p>
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">SOL For Business Solution · Certificate Verification System</p>
      </div>
    </div>
  )
}
