'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, User, Clock, Monitor, Database,
  Download, AlertCircle, X
} from 'lucide-react'
import { useLocale } from '@/hooks/useLocale'

interface AuditEntry {
  id: string
  user_id: string | null
  user?: { id: string; full_name: string; full_name_ar: string; email: string; role: string } | null
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  ip_address: string | null
  created_at: string
}

interface AuditResponse {
  logs: AuditEntry[]
  total: number
  page: number
  pages: number
  limit: number
}

// ── Action metadata ──────────────────────────────────────────────
const ACTION_META: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  COURSE_CREATED:                { color: '#166534', bg: '#f0fdf4', icon: '📋', label: 'Course Created'         },
  COURSE_UPDATED:                { color: '#1e40af', bg: '#eff6ff', icon: '✏️',  label: 'Course Updated'         },
  COURSE_DELETED:                { color: '#991b1b', bg: '#fef2f2', icon: '🗑️', label: 'Course Deleted'         },
  COURSE_CLONED:                 { color: '#6b21a8', bg: '#faf5ff', icon: '📄', label: 'Course Cloned'          },
  BULK_COURSES_IMPORTED:         { color: '#0c4a6e', bg: '#f0f9ff', icon: '📦', label: 'Bulk Courses Imported'  },
  FLAG_RAISED:                   { color: '#92400e', bg: '#fffbeb', icon: '🚩', label: 'Flag Raised'            },
  FLAG_ACKNOWLEDGED:             { color: '#1e40af', bg: '#eff6ff', icon: '👁️', label: 'Flag Acknowledged'      },
  FLAG_IN_PROGRESS:              { color: '#92400e', bg: '#fffbeb', icon: '🔧', label: 'Flag In Progress'       },
  FLAG_RESOLVED:                 { color: '#166534', bg: '#f0fdf4', icon: '✅', label: 'Flag Resolved'          },
  CERTIFICATES_GENERATED:        { color: '#166534', bg: '#f0fdf4', icon: '🎓', label: 'Certificates Generated' },
  CERTIFICATE_REGENERATED:       { color: '#1e40af', bg: '#eff6ff', icon: '🔄', label: 'Certificate Regenerated'},
  TRAINEE_REGISTERED:            { color: '#166534', bg: '#f0fdf4', icon: '👤', label: 'Trainee Registered'     },
  TRAINEE_ANONYMIZED:            { color: '#991b1b', bg: '#fef2f2', icon: '🔒', label: 'Trainee Anonymized'     },
  TRAINEES_BULK_IMPORTED:        { color: '#0c4a6e', bg: '#f0f9ff', icon: '👥', label: 'Trainees Bulk Imported' },
  ATTENDANCE_BULK_MARKED:        { color: '#166534', bg: '#f0fdf4', icon: '✔️', label: 'Attendance Bulk Marked' },
  ABSENT_SMS_SENT:               { color: '#92400e', bg: '#fffbeb', icon: '📱', label: 'Absent SMS Sent'        },
  USER_CREATED:                  { color: '#166534', bg: '#f0fdf4', icon: '👤', label: 'User Created'           },
  USER_UPDATED:                  { color: '#1e40af', bg: '#eff6ff', icon: '✏️',  label: 'User Updated'           },
  USER_DEACTIVATED:              { color: '#991b1b', bg: '#fef2f2', icon: '🚫', label: 'User Deactivated'       },
  CHECKLIST_TEMPLATE_CREATED:    { color: '#166534', bg: '#f0fdf4', icon: '📝', label: 'Template Created'       },
  CHECKLIST_TEMPLATE_UPDATED:    { color: '#1e40af', bg: '#eff6ff', icon: '✏️',  label: 'Template Updated'       },
  CHECKLIST_TEMPLATE_DEACTIVATED:{ color: '#991b1b', bg: '#fef2f2', icon: '🔕', label: 'Template Deactivated'   },
}

const TABLE_LABELS: Record<string, string> = {
  courses: 'Courses', flags: 'Flags', certificates: 'Certificates',
  trainees: 'Trainees', attendance: 'Attendance', profiles: 'Users',
  checklist_templates: 'Checklist Templates', audit_log: 'Audit Log',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#7e22ce', manager: '#142680', coordinator: '#166534', viewer: '#6b7280',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function JsonViewer({ data, label }: { data: Record<string, any> | null; label: string }) {
  const [open, setOpen] = useState(false)
  if (!data || Object.keys(data).length === 0) return <span className="text-xs text-gray-300">—</span>
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {label} ({Object.keys(data).length} fields)
      </button>
      {open && (
        <pre className="mt-1 p-2 rounded-lg text-xs font-mono overflow-x-auto max-h-48"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

export function AuditLogClient() {
  const { t } = useLocale()
  const [data, setData]         = useState<AuditResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)

  // Filters
  const [search,  setSearch]    = useState('')
  const [action,  setAction]    = useState('')
  const [table,   setTable]     = useState('')
  const [fromDate,setFromDate]  = useState('')
  const [toDate,  setToDate]    = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Active filter count
  const activeFilters = [action, table, fromDate, toDate].filter(Boolean).length

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '50' })
    if (search)   params.set('search',  search)
    if (action)   params.set('action',  action)
    if (table)    params.set('table',   table)
    if (fromDate) params.set('from',    fromDate)
    if (toDate)   params.set('to',      toDate)

    const res = await fetch(`/api/admin/audit-logs?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [search, action, table, fromDate, toDate])

  useEffect(() => { fetchLogs(page) }, [page]) // eslint-disable-line

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchLogs(1)
  }

  function clearFilters() {
    setAction(''); setTable(''); setFromDate(''); setToDate('')
    setSearch(''); setPage(1)
    setTimeout(() => fetchLogs(1), 50)
  }

  async function exportCSV() {
    const params = new URLSearchParams({ page: '1', limit: '1000' })
    if (search)   params.set('search',  search)
    if (action)   params.set('action',  action)
    if (table)    params.set('table',   table)
    if (fromDate) params.set('from',    fromDate)
    if (toDate)   params.set('to',      toDate)
    const res = await fetch(`/api/admin/audit-logs?${params}`)
    const json: AuditResponse = await res.json()
    const rows = [
      [t('auditLog.timestamp'), t('auditLog.user'), 'Role', t('auditLog.action'), 'Table', t('auditLog.recordId'), t('auditLog.ipAddress')],
      ...json.logs.map(l => [
        l.created_at,
        l.user?.full_name ?? l.user_id ?? t('auditLog.systemUser'),
        l.user?.role ?? '',
        l.action,
        l.table_name,
        l.record_id ?? '',
        l.ip_address ?? '',
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const uniqueActions = Object.keys(ACTION_META)
  const uniqueTables  = Object.keys(TABLE_LABELS)

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#142680,#2B35FF)' }}>
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-400">
              {data ? `${data.total.toLocaleString()} ${t('auditLog.allEvents')}` : t('auditLog.allActivity')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            style={{ border: '1px solid #e8edf5' }}>
            <Download size={14} /> {t('auditLog.exportCSV')}
          </button>
          <button onClick={() => fetchLogs(page)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            style={{ border: '1px solid #e8edf5' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="sol-card p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('auditLog.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2"
              style={{ border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties}
            />
          </div>
          <button type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white sol-btn-primary">
            Search
          </button>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={showFilters || activeFilters > 0
              ? { background: '#eff6ff', color: '#142680', border: '1px solid #bfdbfe' }
              : { background: '#f8fafc', color: '#64748b', border: '1px solid #e8edf5' }}>
            <Filter size={14} />
            Filters
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ background: '#142680' }}>{activeFilters}</span>
            )}
          </button>
          {(activeFilters > 0 || search) && (
            <button type="button" onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              style={{ border: '1px solid #fca5a5' }}>
              <X size={13} /> Clear
            </button>
          )}
        </form>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {/* Action filter */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Action</label>
              <select value={action} onChange={e => setAction(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2"
                style={{ border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties}>
                <option value="">All actions</option>
                {uniqueActions.map(a => (
                  <option key={a} value={a}>{ACTION_META[a]?.label ?? a}</option>
                ))}
              </select>
            </div>
            {/* Table filter */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Module</label>
              <select value={table} onChange={e => setTable(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2"
                style={{ border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties}>
                <option value="">All modules</option>
                {uniqueTables.map(t => (
                  <option key={t} value={t}>{TABLE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            {/* From date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">From date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2"
                style={{ border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties} />
            </div>
            {/* To date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">To date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 focus:outline-none focus:ring-2"
                style={{ border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties} />
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      {data && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('auditLog.totalEvents'),   value: data.total,                                         color: '#142680', bg: '#eff6ff' },
            { label: t('auditLog.thisPage'),      value: data.logs.length,                                   color: '#166534', bg: '#f0fdf4' },
            { label: t('auditLog.uniqueActions'), value: new Set(data.logs.map(l => l.action)).size,          color: '#92400e', bg: '#fffbeb' },
            { label: t('auditLog.uniqueUsers'),   value: new Set(data.logs.map(l => l.user_id).filter(Boolean)).size, color: '#6b21a8', bg: '#faf5ff' },
          ].map(s => (
            <div key={s.label} className="sol-card p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="sol-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">{t('common.loading')}</p>
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No audit log entries found</p>
            {(search || activeFilters > 0) && (
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {[t('auditLog.timestamp'), t('auditLog.user'), t('auditLog.action'), t('auditLog.module'), t('auditLog.recordId'), t('auditLog.changes'), t('auditLog.ipAddress')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log, i) => {
                  const meta = ACTION_META[log.action]
                  return (
                    <tr key={log.id}
                      className="transition-colors hover:bg-gray-50"
                      style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>

                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-300 flex-shrink-0" />
                          <span className="text-xs font-mono text-gray-600">{formatDate(log.created_at)}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: ROLE_COLORS[log.user.role] ?? '#6b7280' }}>
                              {log.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 leading-tight">{log.user.full_name}</p>
                              <p className="text-xs text-gray-400 leading-tight capitalize">{log.user.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                              <User size={12} className="text-gray-400" />
                            </div>
                            <span className="text-xs text-gray-400">System</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{
                            background: meta?.bg ?? '#f1f5f9',
                            color: meta?.color ?? '#475569',
                          }}>
                          {meta?.icon && <span>{meta.icon}</span>}
                          {meta?.label ?? log.action.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Module / Table */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Database size={12} className="text-gray-300" />
                          <span className="text-xs font-medium text-gray-600">
                            {TABLE_LABELS[log.table_name] ?? log.table_name}
                          </span>
                        </div>
                      </td>

                      {/* Record ID */}
                      <td className="px-4 py-3">
                        {log.record_id ? (
                          <span className="text-xs font-mono text-gray-400 truncate block max-w-[120px]"
                            title={log.record_id}>
                            {log.record_id.length > 8 ? `${log.record_id.slice(0, 8)}…` : log.record_id}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Changes */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <div className="space-y-1">
                          {log.new_values && <JsonViewer data={log.new_values} label="New values" />}
                          {log.old_values && <JsonViewer data={log.old_values} label="Old values" />}
                          {!log.new_values && !log.old_values && (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.ip_address ? (
                          <div className="flex items-center gap-1.5">
                            <Monitor size={11} className="text-gray-300" />
                            <span className="text-xs font-mono text-gray-500">{log.ip_address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-sm text-gray-500">
              {t('auditLog.showing')} {((page - 1) * data.limit) + 1}–{Math.min(page * data.limit, data.total)} {t('common.of')} <strong>{data.total.toLocaleString()}</strong> {t('auditLog.events')}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-100 transition-colors">
                {t('auditLog.first')}
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors">
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, data.pages - 4))
                const p = start + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                    style={p === page
                      ? { background: '#142680', color: '#fff' }
                      : { color: '#64748b' }}>
                    {p}
                  </button>
                )
              })}

              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                aria-label="Next page"
                className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors">
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setPage(data.pages)} disabled={page === data.pages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gray-100 transition-colors">
                {t('auditLog.last')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
