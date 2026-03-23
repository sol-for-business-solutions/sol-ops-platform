import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { LocaleProvider } from '@/context/LocaleContext'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return (
    <LocaleProvider>
      <div className="flex h-screen overflow-hidden" style={{background:'#f5f6fa'}}>
        <Sidebar role={profile.role} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Topbar profile={profile} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </LocaleProvider>
  )
}
