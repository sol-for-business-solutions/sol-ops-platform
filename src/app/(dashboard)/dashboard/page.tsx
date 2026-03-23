import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return <DashboardClient profile={profile} />
}
