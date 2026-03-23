'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, Globe, Shield, Bell } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import type { Profile } from '@/types'

interface Props { profile: Profile }

const ROLE_INFO: Record<string, { label: string; labelAr: string; desc: string; color: string }> = {
  super_admin: { label: 'Super Admin', labelAr: 'مشرف عام',  desc: 'Full system access including user management', color: '#7e22ce' },
  manager:     { label: 'Manager',     labelAr: 'مدير',       desc: 'Manage courses, reports, and certificates',   color: '#142680' },
  coordinator: { label: 'Coordinator', labelAr: 'منسق',       desc: 'Field operations — check-in, attendance, flags', color: '#166534' },
  viewer:      { label: 'Viewer',      labelAr: 'مشاهد',      desc: 'Read-only access to courses and dashboard',   color: '#6b7280' },
}

export function SettingsClient({ profile }: Props) {
  const { locale, setLocale } = useLocale()
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Profile form
  const [fullName, setFullName] = useState(profile.full_name)
  const [fullNameAr, setFullNameAr] = useState(profile.full_name_ar ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, full_name_ar: fullNameAr, phone }),
    })
    if (res.ok) {
      setSuccess('Profile updated successfully')
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to update profile')
    }
    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { setError('New passwords do not match'); return }
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return }
    setSaving(true); setError(''); setSuccess('')
    const { error: err } = await supabase.auth.updateUser({ password: newPw })
    if (err) { setError(err.message) }
    else {
      setSuccess('Password changed successfully')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    }
    setSaving(false)
  }

  const roleInfo = ROLE_INFO[profile.role] ?? ROLE_INFO.viewer
  const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50 text-gray-800"
  const inputStyle = { border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties
  const labelClass = "block text-sm font-bold text-gray-700 mb-1.5"

  const tabs = [
    { key: 'profile' as const,     label: 'Profile',     labelAr: 'الملف الشخصي', icon: User },
    { key: 'security' as const,    label: 'Security',    labelAr: 'الأمان',         icon: Lock },
    { key: 'preferences' as const, label: 'Preferences', labelAr: 'التفضيلات',      icon: Globe },
  ]

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
          style={{ background: 'linear-gradient(135deg,#142680,#2B35FF)' }}>
          {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">{profile.email}</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="sol-card p-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${roleInfo.color}15` }}>
          <Shield size={18} style={{ color: roleInfo.color }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: roleInfo.color }}>{roleInfo.label}</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-400" dir="rtl">{roleInfo.labelAr}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{roleInfo.desc}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>
            Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sol-card overflow-hidden">
        <div className="flex" style={{ borderBottom: '1px solid #e8edf5' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSuccess(''); setError('') }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all"
              style={activeTab === tab.key
                ? { color: '#142680', borderBottom: '2px solid #142680', background: '#f8f9ff', marginBottom: '-1px' }
                : { color: '#9ca3af', borderBottom: '2px solid transparent' }}>
              <tab.icon size={15} />
              <span>{locale === 'ar' ? tab.labelAr : tab.label}</span>
            </button>
          ))}
        </div>

        {/* Success / Error */}
        {(success || error) && (
          <div className="px-6 pt-4">
            {success && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>{success}</div>}
            {error && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>{error}</div>}
          </div>
        )}

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <form onSubmit={saveProfile} className="p-6 space-y-4">
            <div>
              <label className={labelClass}>Full name (English)</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className={inputClass + " pl-9"} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Full name (Arabic)</label>
              <input type="text" value={fullNameAr} onChange={e => setFullNameAr(e.target.value)}
                className={inputClass} style={inputStyle} dir="rtl" placeholder="الاسم بالعربية" />
            </div>
            <div>
              <label className={labelClass}>Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={profile.email} disabled
                  className={inputClass + " pl-9 cursor-not-allowed opacity-60"} style={inputStyle} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed here — contact your administrator</p>
            </div>
            <div>
              <label className={labelClass}>Phone number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className={inputClass + " pl-9"} style={inputStyle} placeholder="+966501234567" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <form onSubmit={changePassword} className="p-6 space-y-4">
            <div className="p-4 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
              <p className="text-sm font-semibold text-amber-800">Changing your password</p>
              <p className="text-xs text-amber-700 mt-1">You will remain logged in after changing your password. Choose a strong password with at least 8 characters.</p>
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showNew ? 'text' : 'password'} required minLength={8} value={newPw} onChange={e => setNewPw(e.target.value)}
                  className={inputClass + " pl-9 pr-10"} style={inputStyle} placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showCurrent ? 'text' : 'password'} required value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className={`${inputClass} pl-9 ${confirmPw && confirmPw !== newPw ? 'ring-2 ring-red-400' : ''}`} style={inputStyle} />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirmPw && confirmPw !== newPw && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
            </div>
            <div className="pt-2">
              <button type="submit" disabled={saving || !newPw || newPw !== confirmPw}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={15} />}
                {saving ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        )}

        {/* Preferences tab */}
        {activeTab === 'preferences' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Globe size={15} /> Language</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { lang: 'en' as const, flag: '🇬🇧', label: 'English', sub: 'Left to right' },
                  { lang: 'ar' as const, flag: '🇸🇦', label: 'العربية', sub: 'يمين إلى يسار' },
                ].map(opt => (
                  <button key={opt.lang} onClick={() => setLocale(opt.lang)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={locale === opt.lang
                      ? { background: '#eff6ff', border: '2px solid #142680' }
                      : { background: '#f8f9fc', border: '2px solid #e8edf5' }}>
                    <div className="text-2xl mb-2">{opt.flag}</div>
                    <p className="text-sm font-bold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.sub}</p>
                    {locale === opt.lang && <div className="mt-2 text-xs font-bold" style={{ color: '#142680' }}>✓ Active</div>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">Language preference is saved in your browser and applies immediately across the entire platform.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
