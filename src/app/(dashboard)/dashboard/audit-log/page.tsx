import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuditLogClient } from '@/components/users/AuditLogClient'

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only super_admin can access this page
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="p-6 md:p-8">
      <AuditLogClient />
    </div>
  )
}
