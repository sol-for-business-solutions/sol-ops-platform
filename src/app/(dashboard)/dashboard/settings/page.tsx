import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return <SettingsClient profile={profile} />
}
