'use client'
import { useState, useEffect } from 'react'
import { CourseReport } from './CourseReport'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { BarChart2, TrendingUp, Users, Mail, CheckCircle2 } from 'lucide-react'

interface Course { id: string; title_en: string; status: string; day1_date: string; city: { name_en: string } }

function TrendChart({ data }: { data: any[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => Math.max(d.courses, d.certificates, d.flags, d.trainees)), 1)
  const BAR_W = 16
  const GAP = 4
  const GROUP = BAR_W * 4 + GAP * 5 + 12
  const H = 120
  const colors = ['#142680','#16a34a','#dc2626','#d97706']
  const keys = ['courses','certificates','flags','trainees']
  const labels = ['Courses','Certs','Flags','Trainees']
  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs flex-wrap">
        {labels.map((l,i) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{background:colors[i]}}></span>{l}
          </span>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${data.length * GROUP + 20} ${H + 36}`} style={{overflow:'visible'}}>
        {data.map((d,gi) => {
          const gx = 10 + gi * GROUP
          return (
            <g key={gi}>
              {keys.map((k,ki) => {
                const val = d[k] ?? 0
                const bh = Math.max((val / max) * H, val > 0 ? 3 : 0)
                const bx = gx + ki * (BAR_W + GAP)
                const by = H - bh
                return (
                  <g key={k}>
                    <rect x={bx} y={by} width={BAR_W} height={bh} fill={colors[ki]} rx="2" opacity="0.85">
                      <title>{labels[ki]}: {val}</title>
                    </rect>
                    {val > 0 && <text x={bx + BAR_W/2} y={by - 3} textAnchor="middle" fontSize="8" fill="#6b7280">{val}</text>}
                  </g>
                )
              })}
              <text x={gx + (BAR_W * 4 + GAP * 3)/2} y={H + 14} textAnchor="middle" fontSize="10" fill="#6b7280">{d.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function CoordinatorMetrics() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/dashboard/coordinators').then(r => r.json()).then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])
  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (!data.length) return <p className="text-sm text-gray-400">No coordinators found.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="text-left px-4 py-2.5">Coordinator</th>
            <th className="text-center px-3 py-2.5">Courses</th>
            <th className="text-center px-3 py-2.5">Checklist %</th>
            <th className="text-center px-3 py-2.5">Avg check-in</th>
            <th className="text-center px-3 py-2.5">On-time %</th>
            <th className="text-center px-3 py-2.5">Flags raised</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((c: any) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{c.full_name}</p>
                {c.full_name_ar && <p className="text-xs text-gray-400" dir="rtl">{c.full_name_ar}</p>}
              </td>
              <td className="text-center px-3 py-3 text-gray-700">{c.totalAssigned}</td>
              <td className="text-center px-3 py-3">
                {c.checklistRate !== null ? (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.checklistRate >= 80 ? 'bg-green-100 text-green-700' : c.checklistRate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {c.checklistRate}%
                  </span>
                ) : <span className="text-gray-300">—</span>}
              </td>
              <td className="text-center px-3 py-3 font-mono text-xs text-gray-600">
                {c.avgCheckinTime ?? <span className="text-gray-300">—</span>}
              </td>
              <td className="text-center px-3 py-3">
                {c.onTimeRate !== null ? (
                  <span className={`text-xs font-semibold ${c.onTimeRate >= 80 ? 'text-green-600' : c.onTimeRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {c.onTimeRate}%
                  </span>
                ) : <span className="text-gray-300">—</span>}
              </td>
              <td className="text-center px-3 py-3">
                <span className={`text-xs font-semibold ${c.flagsRaised > 5 ? 'text-red-600' : c.flagsRaised > 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                  {c.flagsRaised}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrendsTab() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/dashboard/trends').then(r => r.json()).then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])
  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>
  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  const pctChange = (curr: number, prev: number) => {
    if (!prev) return null
    const pct = Math.round(((curr - prev) / prev) * 100)
    return { pct, up: pct >= 0 }
  }
  return (
    <div className="space-y-6">
      {latest && prev && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Courses', key: 'courses', color: '#142680' },
            { label: 'Certificates', key: 'certificates', color: '#16a34a' },
            { label: 'Flags', key: 'flags', color: '#dc2626' },
            { label: 'Trainees', key: 'trainees', color: '#d97706' },
          ].map(item => {
            const change = pctChange(latest[item.key], prev[item.key])
            return (
              <div key={item.key} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{item.label} this month</p>
                <p className="text-2xl font-semibold" style={{color: item.color}}>{latest[item.key]}</p>
                {change !== null && (
                  <p className={`text-xs mt-1 font-medium ${change.up ? 'text-green-600' : 'text-red-600'}`}>
                    {change.up ? '↑' : '↓'} {Math.abs(change.pct)}% vs last month
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">6-month overview</h3>
        <TrendChart data={data} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Monthly breakdown</h3>
        <p className="text-xs text-gray-400 mb-4">Courses scheduled, completed, and trainees trained per month</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left py-2">Month</th>
                <th className="text-center py-2">Courses</th>
                <th className="text-center py-2">Completed</th>
                <th className="text-center py-2">Trainees</th>
                <th className="text-center py-2">Certificates</th>
                <th className="text-center py-2">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((d,i) => (
                <tr key={i} className={i === data.length - 1 ? 'bg-blue-50/50' : ''}>
                  <td className="py-2 font-medium text-gray-900">{d.label}{i === data.length-1 && <span className="ml-2 text-xs text-blue-600 font-normal">(current)</span>}</td>
                  <td className="text-center py-2 text-gray-700">{d.courses}</td>
                  <td className="text-center py-2 text-green-600 font-medium">{d.completed}</td>
                  <td className="text-center py-2 text-gray-700">{d.trainees}</td>
                  <td className="text-center py-2 text-amber-600 font-medium">{d.certificates}</td>
                  <td className="text-center py-2">
                    <span className={d.flags > 5 ? 'text-red-600 font-semibold' : 'text-gray-600'}>{d.flags}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EmailDigestButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  async function send() {
    setLoading(true); setResult(null)
    const res = await fetch('/api/reports/email', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
    setResult(await res.json()); setLoading(false)
  }
  return (
    <div className="flex items-center gap-3">
      <button onClick={send} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
        <Mail size={14} />{loading ? 'Sending…' : 'Email digest to managers'}
      </button>
      {result?.sent && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={13} />Sent to {result.recipients} recipient{result.recipients !== 1 ? 's' : ''}</span>}
      {result?.error && <span className="text-xs text-red-600">{result.error}</span>}
    </div>
  )
}

const TABS = ['Course report', 'Coordinator metrics', 'Trends & history']

export function ReportsClient({ courses }: { courses: Course[] }) {
  const [selectedId, setSelectedId] = useState(courses[0]?.id ?? '')
  const [tab, setTab] = useState(0)
  function formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-400">Course performance, coordinator metrics &amp; trends</p>
          </div>
        </div>
        <EmailDigestButton />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        courses.length === 0
          ? <EmptyState title="No completed courses yet" description="Reports are available for in-progress and completed courses" />
          : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Select course</p>
                <div className="space-y-1.5">
                  {courses.map(c => (
                    <button key={c.id} onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left px-3 py-3 rounded-lg border text-sm transition-all ${selectedId === c.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'}`}>
                      <p className="font-medium line-clamp-1">{c.title_en}</p>
                      <p className={`text-xs mt-0.5 ${selectedId === c.id ? 'text-gray-300' : 'text-gray-400'}`}>{c.city?.name_en} · {formatDate(c.day1_date)}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3">
                {selectedId ? <CourseReport courseId={selectedId} /> : <EmptyState title="Select a course" />}
              </div>
            </div>
          )
      )}

      {tab === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <Users size={16} className="text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Coordinator performance</p>
              <p className="text-xs text-gray-400">Checklist completion, check-in timing, flag frequency</p>
            </div>
          </div>
          <CoordinatorMetrics />
        </div>
      )}

      {tab === 2 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={16} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Month-over-month comparison</p>
          </div>
          <TrendsTab />
        </div>
      )}
    </div>
  )
}
