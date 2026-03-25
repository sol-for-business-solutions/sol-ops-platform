import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { CertificatesClient } from '@/components/certificates/CertificatesClient'

export default async function CertificatesPage() {
  const supabase = await createClient()
  const profile = await getProfile()
  const { data: certs } = await supabase.from('certificates')
    .select('*, trainee:trainees(full_name_en, full_name_ar, email), course:courses(title_en, day1_date, city:cities(name_en))')
    .order('generated_at', { ascending: false })
    .limit(200)
  const canRegen = ['super_admin', 'manager'].includes(profile?.role ?? '')
  return (
    <div className="p-6 md:p-8">
      <CertificatesClient certs={(certs ?? []) as any} canRegen={canRegen} />
    </div>
  )
}
