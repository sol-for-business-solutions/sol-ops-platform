'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, Globe, Shield,
         CheckSquare, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'
import type { Profile } from '@/types'

interface Props { profile: Profile }

interface ChecklistTemplate {
  id: string
  course_type: string
  phase: 'pre' | 'during' | 'post'
  title_en: string
  title_ar: string
  description: string | null
  requires_photo: boolean
  order_index: number
  is_active: boolean
}

const ROLE_INFO: Record<string, { label: string; labelAr: string; desc: string; color: string }> = {
  super_admin: { label: 'Super Admin', labelAr: 'مشرف عام',  desc: 'Full system access including user management', color: '#7e22ce' },
  manager:     { label: 'Manager',     labelAr: 'مدير',       desc: 'Manage courses, reports, and certificates',   color: '#142680' },
  coordinator: { label: 'Coordinator', labelAr: 'منسق',       desc: 'Field operations — check-in, attendance, flags', color: '#166534' },
  viewer:      { label: 'Viewer',      labelAr: 'مشاهد',      desc: 'Read-only access to courses and dashboard',   color: '#6b7280' },
}

const PHASE_LABELS = { pre: 'Pre-course', during: 'During course', post: 'Post-course' }
const PHASE_COLORS = { pre: '#2563eb', during: '#d97706', post: '#16a34a' }

export function SettingsClient({ profile }: Props) {
  const { locale, setLocale } = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isAdminOrManager = ['super_admin', 'manager'].includes(profile.role)

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'checklists'>('profile')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Profile form
  const [fullName, setFullName] = useState(profile.full_name)
  const [fullNameAr, setFullNameAr] = useState(profile.full_name_ar ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')

  // Password form
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Checklist templates
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateModal, setTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null)
  const [tForm, setTForm] = useState({
    course_type: 'standard', phase: 'pre' as 'pre' | 'during' | 'post',
    title_en: '', title_ar: '', description: '',
    requires_photo: false, order_index: 0,
  })
  const [tSaving, setTSaving] = useState(false)
  const [phaseFilter, setPhaseFilter] = useState<string>('all')

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    const res = await fetch('/api/admin/checklist-templates')
    const data = await res.json()
    setTemplates(Array.isArray(data) ? data : [])
    setTemplatesLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'checklists') fetchTemplates()
  }, [activeTab, fetchTemplates])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, full_name_ar: fullNameAr, phone }),
    })
    if (res.ok) { setSuccess('Profile updated successfully'); router.refresh() }
    else { const d = await res.json(); setError(d.error || 'Failed to update profile') }
    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { setError('Passwords do not match'); return }
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return }
    setSaving(true); setError(''); setSuccess('')
    const { error: err } = await supabase.auth.updateUser({ password: newPw })
    if (err) { setError(err.message) }
    else { setSuccess('Password changed successfully'); setNewPw(''); setConfirmPw('') }
    setSaving(false)
  }

  function openCreateTemplate() {
    setEditingTemplate(null)
    setTForm({ course_type: 'standard', phase: 'pre', title_en: '', title_ar: '', description: '', requires_photo: false, order_index: templates.length + 1 })
    setTemplateModal(true)
  }

  function openEditTemplate(t: ChecklistTemplate) {
    setEditingTemplate(t)
    setTForm({ course_type: t.course_type, phase: t.phase, title_en: t.title_en, title_ar: t.title_ar, description: t.description ?? '', requires_photo: t.requires_photo, order_index: t.order_index })
    setTemplateModal(true)
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!tForm.title_en || !tForm.title_ar) return
    setTSaving(true)
    const url = editingTemplate
      ? `/api/admin/checklist-templates/${editingTemplate.id}`
      : '/api/admin/checklist-templates'
    const method = editingTemplate ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tForm),
    })
    if (res.ok) { setTemplateModal(false); fetchTemplates() }
    else { const d = await res.json(); alert(d.error || 'Failed to save template') }
    setTSaving(false)
  }

  async function toggleTemplate(t: ChecklistTemplate) {
    await fetch(`/api/admin/checklist-templates/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    })
    fetchTemplates()
  }

  async function deleteTemplate(t: ChecklistTemplate) {
    if (!confirm(`Deactivate "${t.title_en}"? It won't appear in new courses.`)) return
    await fetch(`/api/admin/checklist-templates/${t.id}`, { method: 'DELETE' })
    fetchTemplates()
  }

  const roleInfo = ROLE_INFO[profile.role] ?? ROLE_INFO.viewer
  const inputClass = 'w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50 text-gray-800'
  const inputStyle = { border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties
  const labelClass = 'block text-sm font-bold text-gray-700 mb-1.5'

  const tabs = [
    { key: 'profile' as const,     label: 'Profile',     labelAr: 'الملف الشخصي', icon: User },
    { key: 'security' as const,    label: 'Security',    labelAr: 'الأمان',         icon: Lock },
    { key: 'preferences' as const, label: 'Preferences', labelAr: 'التفضيلات',      icon: Globe },
    ...(isAdminOrManager
      ? [{ key: 'checklists' as const, label: 'Checklists', labelAr: 'قوائم التحقق', icon: CheckSquare }]
      : []),
  ]

  const filteredTemplates = phaseFilter === 'all'
    ? templates
    : templates.filter(t => t.phase === phaseFilter)

  return (
    <div className="max-w-3xl">
      {/* Header */}
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
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>Active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sol-card overflow-hidden">
        <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid #e8edf5' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSuccess(''); setError('') }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all whitespace-nowrap"
              style={activeTab === tab.key
                ? { color: '#142680', borderBottom: '2px solid #142680', background: '#f8f9ff', marginBottom: '-1px' }
                : { color: '#9ca3af', borderBottom: '2px solid transparent' }}>
              <tab.icon size={15} />
              <span>{locale === 'ar' ? tab.labelAr : tab.label}</span>
            </button>
          ))}
        </div>

        {/* Alerts */}
        {(success || error) && (
          <div className="px-6 pt-4">
            {success && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>{success}</div>}
            {error && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>{error}</div>}
          </div>
        )}

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <form onSubmit={saveProfile} className="p-6 space-y-4">
            <div>
              <label className={labelClass}>Full name (English)</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className={inputClass + ' pl-9'} style={inputStyle} />
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
                  className={inputClass + ' pl-9 cursor-not-allowed opacity-60'} style={inputStyle} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Contact your administrator to change email</p>
            </div>
            <div>
              <label className={labelClass}>Phone number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className={inputClass + ' pl-9'} style={inputStyle} placeholder="+966501234567" />
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

        {/* ── Security Tab ── */}
        {activeTab === 'security' && (
          <form onSubmit={changePassword} className="p-6 space-y-4">
            <div className="p-4 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
              <p className="text-sm font-semibold text-amber-800">Changing your password</p>
              <p className="text-xs text-amber-700 mt-1">Choose a strong password with at least 8 characters.</p>
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showNew ? 'text' : 'password'} required minLength={8} value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  className={inputClass + ' pl-9 pr-10'} style={inputStyle} placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowNew(!showNew)} aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showConfirm ? 'text' : 'password'} required value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  className={`${inputClass} pl-9 pr-10 ${confirmPw && confirmPw !== newPw ? 'ring-2 ring-red-400' : ''}`}
                  style={inputStyle} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle confirm password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirmPw && confirmPw !== newPw && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
            </div>
            <button type="submit" disabled={saving || !newPw || newPw !== confirmPw}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={15} />}
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        {/* ── Preferences Tab ── */}
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
              <p className="text-xs text-gray-400 mt-3">Language is saved in your browser and applies immediately.</p>
            </div>
          </div>
        )}

        {/* ── Checklists Tab ── */}
        {activeTab === 'checklists' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Checklist Templates</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage the default checklist items added to every new course
                </p>
              </div>
              <button onClick={openCreateTemplate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white sol-btn-primary">
                <Plus size={14} /> Add template
              </button>
            </div>

            {/* Phase filter */}
            <div className="flex gap-2 mb-4">
              {['all', 'pre', 'during', 'post'].map(p => (
                <button key={p} onClick={() => setPhaseFilter(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={phaseFilter === p
                    ? { background: '#142680', color: '#fff' }
                    : { background: '#f1f5f9', color: '#64748b' }}>
                  {p === 'all' ? 'All phases' : PHASE_LABELS[p as keyof typeof PHASE_LABELS]}
                </button>
              ))}
            </div>

            {templatesLoading ? (
              <div className="flex justify-center py-8">
                <span className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">No templates found</div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map(t => (
                  <div key={t.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      border: '1px solid #e8edf5',
                      background: t.is_active ? '#ffffff' : '#f8fafc',
                      opacity: t.is_active ? 1 : 0.6,
                    }}>
                    {/* Phase badge */}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                      style={{
                        background: `${PHASE_COLORS[t.phase]}15`,
                        color: PHASE_COLORS[t.phase],
                      }}>
                      {PHASE_LABELS[t.phase]}
                    </span>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.title_en}</p>
                      <p className="text-xs text-gray-400 truncate" dir="rtl">{t.title_ar}</p>
                    </div>

                    {/* Photo badge */}
                    {t.requires_photo && (
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                        📷 Photo
                      </span>
                    )}

                    {/* Order */}
                    <span className="text-xs text-gray-400 flex-shrink-0">#{t.order_index}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEditTemplate(t)}
                        aria-label={`Edit ${t.title_en}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => toggleTemplate(t)}
                        aria-label={t.is_active ? 'Deactivate template' : 'Activate template'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: t.is_active ? '#16a34a' : '#9ca3af' }}>
                        {t.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      {profile.role === 'super_admin' && (
                        <button onClick={() => deleteTemplate(t)}
                          aria-label={`Delete ${t.title_en}`}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Template Modal ── */}
      {templateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #e8edf5' }}>
              <h2 className="text-base font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'New Checklist Template'}
              </h2>
              <button onClick={() => setTemplateModal(false)} aria-label="Close modal"
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={saveTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Phase</label>
                  <select value={tForm.phase}
                    onChange={e => setTForm(f => ({ ...f, phase: e.target.value as 'pre' | 'during' | 'post' }))}
                    className={inputClass} style={inputStyle}>
                    <option value="pre">Pre-course</option>
                    <option value="during">During course</option>
                    <option value="post">Post-course</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Course type</label>
                  <input type="text" value={tForm.course_type}
                    onChange={e => setTForm(f => ({ ...f, course_type: e.target.value }))}
                    className={inputClass} style={inputStyle} placeholder="standard" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Title (English)</label>
                <input type="text" required value={tForm.title_en}
                  onChange={e => setTForm(f => ({ ...f, title_en: e.target.value }))}
                  className={inputClass} style={inputStyle} placeholder="e.g. Venue confirmation received" />
              </div>
              <div>
                <label className={labelClass}>Title (Arabic)</label>
                <input type="text" required value={tForm.title_ar}
                  onChange={e => setTForm(f => ({ ...f, title_ar: e.target.value }))}
                  className={inputClass} style={inputStyle} dir="rtl" placeholder="مثال: تأكيد استلام المكان" />
              </div>
              <div>
                <label className={labelClass}>Description (optional)</label>
                <textarea value={tForm.description}
                  onChange={e => setTForm(f => ({ ...f, description: e.target.value }))}
                  className={inputClass} style={{ ...inputStyle, resize: 'none' }} rows={2}
                  placeholder="Optional guidance for coordinators" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Order index</label>
                  <input type="number" min={0} value={tForm.order_index}
                    onChange={e => setTForm(f => ({ ...f, order_index: Number(e.target.value) }))}
                    className={inputClass} style={inputStyle} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={tForm.requires_photo}
                      onChange={e => setTForm(f => ({ ...f, requires_photo: e.target.checked }))}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium text-gray-700">Requires photo evidence</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={tSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50">
                  {tSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                  {tSaving ? 'Saving...' : editingTemplate ? 'Update template' : 'Create template'}
                </button>
                <button type="button" onClick={() => setTemplateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
