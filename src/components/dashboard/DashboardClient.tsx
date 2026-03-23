'use client'
import { useDashboardStats, useCityStats } from '@/hooks/useDashboard'
import { StatCard } from './StatCard'
import { FlagSeverityBar } from './FlagSeverityBar'
import { CityTable } from './CityTable'
import { RecentFlags } from './RecentFlags'
import { Spinner } from '@/components/ui/Spinner'
import { BookOpen, Flag, CheckSquare, Navigation, Award, AlertTriangle, TrendingUp } from 'lucide-react'
import type { Profile } from '@/types'

export function DashboardClient({ profile }: { profile: Profile }) {
  const { stats, loading } = useDashboardStats()
  const { cities } = useCityStats()

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-gray-400 font-medium">Loading your operations...</p>
    </div>
  )

  if (!stats) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header banner */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{background:'linear-gradient(135deg,#0d1a5c 0%,#142680 50%,#1e3aaa 100%)'}}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{background:'radial-gradient(circle,#89e3fd,transparent)',transform:'translate(30%,-30%)'}} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">{greeting},</p>
            <h1 className="text-2xl font-bold mt-0.5">{profile.full_name.split(' ')[0]}</h1>
            <p className="text-blue-300 text-sm mt-1">Here's your operations summary for today</p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.activeCourses}</p>
              <p className="text-blue-200 text-xs font-medium mt-0.5">Active Courses</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.certificatesIssued}</p>
              <p className="text-blue-200 text-xs font-medium mt-0.5">Certificates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency alert */}
      {(stats.flagsBySeverity.emergency > 0 || stats.flagsBySeverity.critical > 0) && (
        <div className="rounded-2xl border-2 p-4 flex items-center gap-3"
          style={stats.flagsBySeverity.emergency > 0 ? {borderColor:'#fca5a5',background:'#fef2f2'} : {borderColor:'#fdba74',background:'#fff7ed'}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{background: stats.flagsBySeverity.emergency > 0 ? '#fee2e2' : '#ffedd5'}}>
            <AlertTriangle size={18} className={stats.flagsBySeverity.emergency > 0 ? 'text-red-600 animate-pulse' : 'text-orange-600'} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${stats.flagsBySeverity.emergency > 0 ? 'text-red-800' : 'text-orange-800'}`}>
              {stats.flagsBySeverity.emergency > 0 ? `${stats.flagsBySeverity.emergency} emergency flag${stats.flagsBySeverity.emergency > 1 ? 's' : ''} require immediate action` : `${stats.flagsBySeverity.critical} critical flag${stats.flagsBySeverity.critical > 1 ? 's' : ''} require urgent attention`}
            </p>
          </div>
          <a href="/dashboard/flags" className="text-sm font-semibold px-4 py-2 rounded-xl text-white shrink-0"
            style={{background: stats.flagsBySeverity.emergency > 0 ? '#dc2626' : '#ea580c'}}>
            View now
          </a>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={18} />} label="Active courses" value={stats.activeCourses} subLabel={`${stats.scheduledCourses} scheduled`} href="/dashboard/courses" color="default" />
        <StatCard icon={<Flag size={18} />} label="Open flags" value={stats.openFlags} subLabel={stats.flagsBySeverity.emergency > 0 ? `${stats.flagsBySeverity.emergency} emergency` : 'All under control'} href="/dashboard/flags" color={stats.flagsBySeverity.emergency > 0 ? 'red' : stats.flagsBySeverity.critical > 0 ? 'orange' : 'default'} />
        <StatCard icon={<CheckSquare size={18} />} label="Checklist" value={`${stats.checklistPct}%`} subLabel={`${stats.checklistStats.completed}/${stats.checklistStats.total} done`} href="/dashboard/checklists" color={stats.checklistPct === 100 ? 'green' : 'default'} />
        <StatCard icon={<Navigation size={18} />} label="Checked in" value={stats.checkedInToday} subLabel="coordinators today" href="/dashboard/checkins" color="default" />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 sol-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Flags by severity</h2>
              <p className="text-xs text-gray-400 mt-0.5">{stats.openFlags} open flag{stats.openFlags !== 1 ? 's' : ''}</p>
            </div>
            <a href="/dashboard/flags" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{background:'#eff6ff',color:'#142680'}}>View all →</a>
          </div>
          <FlagSeverityBar stats={stats.flagsBySeverity} total={stats.openFlags} />
        </div>
        <div className="sol-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{background:'linear-gradient(135deg,#fffbeb,#fef3c7)'}}>
              <Award size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Certificates</h2>
              <p className="text-xs text-gray-400">Total issued</p>
            </div>
          </div>
          <p className="text-4xl font-black" style={{color:'#142680'}}>{stats.certificatesIssued}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingUp size={13} className="text-green-500" />
            <p className="text-xs text-green-600 font-medium">Certificates issued to date</p>
          </div>
          <a href="/dashboard/certificates" className="block mt-4 text-center text-xs font-semibold py-2 rounded-xl transition-all"
            style={{background:'#eff6ff',color:'#142680'}}>View all →</a>
        </div>
      </div>

      {/* Cities */}
      {['super_admin', 'manager'].includes(profile.role) && (
        <div className="sol-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-800">KSA Cities overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Operations across all 16 cities</p>
            </div>
            <a href="/dashboard/reports" className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{background:'#eff6ff',color:'#142680'}}>Full report →</a>
          </div>
          <CityTable cities={cities} />
        </div>
      )}

      {/* Recent flags */}
      <div className="sol-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Recent flags</h2>
            <p className="text-xs text-gray-400 mt-0.5">Live updates from the field</p>
          </div>
          <a href="/dashboard/flags" className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{background:'#eff6ff',color:'#142680'}}>View all →</a>
        </div>
        <RecentFlags />
      </div>
    </div>
  )
}
