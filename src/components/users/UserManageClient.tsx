'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, PowerOff, Power, X, User, Mail, Lock, Phone, Shield, Eye, EyeOff, Search, RefreshCw } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useLocale } from '@/hooks/useLocale'

type UserRole = 'super_admin' | 'manager' | 'coordinator' | 'viewer'

interface UserProfile {
  id: string
  email: string
  full_name: string
  full_name_ar: string
  role: UserRole
  phone: string | null
  is_active: boolean
  created_at: string
}

const ROLE_CONFIG: Record<UserRole, { label: string; labelAr: string; bg: string; text: string; border: string; icon: string }> = {
  super_admin: { label: 'Super Admin', labelAr: 'مشرف عام',  bg: '#faf5ff', text: '#7e22ce', border: '#d8b4fe', icon: '👑' },
  manager:     { label: 'Manager',     labelAr: 'مدير',       bg: '#eff6ff', text: '#142680', border: '#bfdbfe', icon: '👔' },
  coordinator: { label: 'Coordinator', labelAr: 'منسق',       bg: '#f0fdf4', text: '#166534', border: '#86efac', icon: '🧑‍💼' },
  viewer:      { label: 'Viewer',      labelAr: 'مشاهد',      bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb', icon: '👁️' },
}

const ROLES: UserRole[] = ['super_admin', 'manager', 'coordinator', 'viewer']

interface ModalState {
  open: boolean
  mode: 'create' | 'edit'
  user?: UserProfile
}

export function UserManageClient() {
  const { t, locale } = useLocale()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPw, setShowPw] = useState(false)

  // Form state
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', full_name_ar: '',
    role: 'coordinator' as UserRole, phone: '',
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  function openCreate() {
    setForm({ email: '', password: '', full_name: '', full_name_ar: '', role: 'coordinator', phone: '' })
    setError(''); setSuccess('')
    setModal({ open: true, mode: 'create' })
  }

  function openEdit(u: UserProfile) {
    setForm({ email: u.email, password: '', full_name: u.full_name, full_name_ar: u.full_name_ar ?? '', role: u.role, phone: u.phone ?? '' })
    setError(''); setSuccess('')
    setModal({ open: true, mode: 'edit', user: u })
  }

  function closeModal() { setModal({ open: false, mode: 'create' }) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')

    try {
      if (modal.mode === 'create') {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create user')
        setSuccess(`✓ User "${form.full_name}" created successfully with ${form.role} role`)
        closeModal()
        await fetchUsers()
      } else if (modal.mode === 'edit' && modal.user) {
        const updates: any = { role: form.role, full_name: form.full_name, full_name_ar: form.full_name_ar, phone: form.phone, ...(form.password ? { password: form.password } : {}) }
        const res = await fetch(`/api/admin/users/${modal.user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update user')
        setSuccess(`✓ User "${form.full_name}" updated successfully`)
        closeModal()
        await fetchUsers()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(u: UserProfile) {
    if (!confirm(`${u.is_active ? t('users.deactivate') : t('users.activate')} user "${u.full_name}"?`)) return
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !u.is_active }),
    })
    if (res.ok) {
      setSuccess(`✓ User "${u.full_name}" ${u.is_active ? 'deactivated' : 'activated'}`)
      await fetchUsers()
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50 text-gray-800"
  const inputStyle = { border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.filter(u => u.is_active).length} active · {users.length} total users</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchUsers} className="p-2.5 rounded-xl transition-all" style={{ border: '1px solid #e8edf5', background: 'white', color: '#6b7280' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white sol-btn-primary">
            <Plus size={16} /> Create user
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
          <span className="text-green-600 text-sm font-semibold">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700"><X size={14} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="sol-card p-4 mb-5">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
              className={inputClass + " pl-9"} style={inputStyle} />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={inputClass + " w-auto"} style={inputStyle}>
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
          </select>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role && u.is_active).length
          const cfg = ROLE_CONFIG[role]
          return (
            <div key={role} className="p-4 rounded-xl cursor-pointer transition-all"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{cfg.icon}</span>
                <span className="text-2xl font-black" style={{ color: cfg.text }}>{count}</span>
              </div>
              <p className="text-xs font-bold" style={{ color: cfg.text }}>{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* Users table */}
      <div className="sol-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-gray-600">No users found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #e8edf5', background: '#f8f9fc' }}>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.viewer
                return (
                  <tr key={u.id} className={`transition-colors ${!u.is_active ? 'opacity-50' : ''}`}
                    style={{ borderBottom: '1px solid #f0f4ff' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafbff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg,#142680,#2B35FF)' }}>
                          {u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.full_name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                          {u.full_name_ar && <p className="text-xs text-gray-400" dir="rtl">{u.full_name_ar}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                        <span>{cfg.icon}</span>{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{u.phone ?? '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${u.is_active ? 'text-green-700' : 'text-gray-500'}`}
                        style={{ background: u.is_active ? '#f0fdf4' : '#f9fafb', border: `1px solid ${u.is_active ? '#86efac' : '#e5e7eb'}` }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {u.is_active ? t('users.active') : t('users.inactive')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: '#eff6ff', color: '#142680', border: '1px solid #bfdbfe' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button onClick={() => toggleActive(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={u.is_active
                            ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }
                            : { background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>
                          {u.is_active ? <><PowerOff size={12} /> Deactivate</> : <><Power size={12} /> Activate</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 sticky top-0 bg-white rounded-t-2xl z-10"
              style={{ borderBottom: '1px solid #e8edf5' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg,#142680,#2B35FF)' }}>
                  {modal.mode === 'create' ? <Plus size={18} /> : <Edit2 size={16} />}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{modal.mode === 'create' ? 'Create new user' : t('users.editUser')}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{modal.mode === 'create' ? 'User will be able to log in immediately' : `Editing ${modal.user?.email}`}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(role => {
                    const cfg = ROLE_CONFIG[role]
                    return (
                      <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role }))}
                        className="p-3 rounded-xl text-left transition-all"
                        style={form.role === role
                          ? { background: cfg.bg, border: `2px solid ${cfg.text}`, color: cfg.text }
                          : { background: '#f8f9fc', border: '2px solid #e8edf5', color: '#6b7280' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cfg.icon}</span>
                          <div>
                            <p className="text-xs font-bold">{cfg.label}</p>
                            <p className="text-xs opacity-70">{cfg.labelAr}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Full name (EN) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      className={inputClass + " pl-9"} style={inputStyle} placeholder="Ahmed Al-Said" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Full name (AR)</label>
                  <input type="text" value={form.full_name_ar} onChange={e => setForm(f => ({ ...f, full_name_ar: e.target.value }))}
                    className={inputClass} style={inputStyle} dir="rtl" placeholder="أحمد السعيد" />
                </div>
              </div>

              {/* Email (create only) */}
              {modal.mode === 'create' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={inputClass + " pl-9"} style={inputStyle} placeholder="user@sol.com.sa" />
                  </div>
                </div>
              )}

              {/* Password (create only) */}
              {modal.mode === 'create' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPw ? 'text' : 'password'} required minLength={8} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className={inputClass + " pl-9 pr-10"} style={inputStyle} placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">User can log in immediately — no email confirmation needed</p>
                </div>
              )}

              {modal.mode === 'edit' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Reset password
                    <span className="text-gray-400 font-normal ml-1">(leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPw ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className={inputClass + " pl-9 pr-10"} style={inputStyle}
                      placeholder="Type new password to reset..." />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {form.password.length > 0 && form.password.length < 8 && (
                    <p className="text-xs text-red-500 mt-1">Minimum 8 characters</p>
                  )}
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className={inputClass + " pl-9"} style={inputStyle} placeholder="+966501234567" />
                </div>
              </div>

              {/* Role info box */}
              <div className="rounded-xl p-3" style={{ background: ROLE_CONFIG[form.role].bg, border: `1px solid ${ROLE_CONFIG[form.role].border}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={13} style={{ color: ROLE_CONFIG[form.role].text }} />
                  <span className="text-xs font-bold" style={{ color: ROLE_CONFIG[form.role].text }}>
                    {ROLE_CONFIG[form.role].label} permissions
                  </span>
                </div>
                <p className="text-xs" style={{ color: ROLE_CONFIG[form.role].text, opacity: 0.8 }}>
                  {form.role === 'super_admin' && 'Full access — can manage users, all courses, reports, certificates, and PDPL data'}
                  {form.role === 'manager' && 'Can create/edit courses, assign coordinators, view reports, generate certificates, resolve flags'}
                  {form.role === 'coordinator' && 'Field access only — GPS check-in, attendance, checklist, raise flags. Only sees assigned courses'}
                  {form.role === 'viewer' && 'Read-only — can view courses and dashboard. Cannot create, edit, or take any actions'}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600"
                  style={{ border: '1px solid #e8edf5', background: 'white' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {modal.mode === 'create' ? 'Creating...' : t('common.saving')}
                    </span>
                  ) : modal.mode === 'create' ? t('users.addUser') : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
