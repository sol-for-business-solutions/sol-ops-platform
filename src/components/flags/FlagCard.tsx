'use client'
import { useState } from 'react'
import { Clock, CheckCircle2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { PLAYBOOKS } from '@/lib/playbooks'
import type { Flag, FlagSeverity } from '@/types'

const SEVERITY_CONFIG: Record<string, any> = {
  info: { color: 'border-blue-200 bg-blue-50', dot: 'bg-blue-500', label: 'Info', text: 'text-blue-700' },
  warning: { color: 'border-amber-200 bg-amber-50', dot: 'bg-amber-500', label: 'Warning', text: 'text-amber-700' },
  critical: { color: 'border-orange-200 bg-orange-50', dot: 'bg-orange-500', label: 'Critical', text: 'text-orange-700' },
  emergency: { color: 'border-red-200 bg-red-50', dot: 'bg-red-500', label: 'Emergency', text: 'text-red-700' },
}
const STATUS_FLOW: Record<string, string> = { open: 'acknowledged', acknowledged: 'in_progress', in_progress: 'resolved' }
const STATUS_LABELS: Record<string, string> = { open: 'Open', acknowledged: 'Acknowledged', in_progress: 'In Progress', resolved: 'Resolved' }

interface Props { flag: any; canResolve: boolean; onStatusUpdate: (id: string, status: string, notes?: string) => void }

export function FlagCard({ flag, canResolve, onStatusUpdate }: Props) {
  const [expanded, setExpanded] = useState(flag.severity === 'emergency')
  const [resolveNotes, setNotes] = useState('')
  const [showPlaybook, setPlaybook] = useState(false)
  const [saving, setSaving] = useState(false)
  const config = SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.info
  const playbook = PLAYBOOKS[flag.category]
  const nextStatus = STATUS_FLOW[flag.status]
  async function handleAdvance() {
    if (!nextStatus) return; setSaving(true)
    await onStatusUpdate(flag.id, nextStatus, nextStatus === 'resolved' ? resolveNotes : undefined)
    setSaving(false)
  }
  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime(); const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'; if (mins < 60) return `${mins}m ago`; return `${Math.floor(mins / 60)}h ago`
  }
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${config.color} ${flag.severity === 'emergency' ? 'shadow-md' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.dot} ${flag.severity === 'emergency' ? 'animate-pulse' : ''}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap"><span className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>{config.label}</span><span className="text-xs text-gray-500">{flag.course?.title_en}{flag.course?.city?.name_en && ` · ${flag.course.city.name_en}`}</span></div>
            <p className="text-sm font-medium text-gray-900 mt-0.5 line-clamp-2">{flag.description}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="shrink-0 p-1 rounded-lg hover:bg-white/60 transition-colors">
          {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </button>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(flag.created_at)}</span>
        <span>by {flag.raised_by_profile?.full_name ?? 'Unknown'}</span>
        <span className={`px-2 py-0.5 rounded-full font-medium ${flag.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-white/70 text-gray-600'}`}>{STATUS_LABELS[flag.status]}</span>
      </div>
      {expanded && (
        <div className="mt-4 space-y-3">
          {flag.photo_url && <img src={flag.photo_url} alt="Flag evidence" className="h-32 w-auto object-cover rounded-lg border border-white/50" />}
          {playbook && (
            <div>
              <button onClick={() => setPlaybook(!showPlaybook)} className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors">
                <BookOpen size={13} />{showPlaybook ? 'Hide' : 'View'} resolution playbook
              </button>
              {showPlaybook && (
                <div className="mt-2 bg-white/70 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">{playbook.title} — Step-by-step</p>
                  <ol className="space-y-2">{playbook.steps.map((step, i) => (<li key={i} className="flex gap-2 text-xs text-gray-700"><span className="shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-medium text-xs">{i + 1}</span>{step}</li>))}</ol>
                  {playbook.contacts && (<div className="mt-3 pt-3 border-t border-gray-200"><p className="text-xs font-medium text-gray-500">Key contacts:</p><div className="flex flex-wrap gap-2 mt-1">{playbook.contacts.map(c => <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>)}</div></div>)}
                </div>
              )}
            </div>
          )}
          {canResolve && nextStatus === 'resolved' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Resolution notes (required to close)</label>
              <textarea value={resolveNotes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Describe how the issue was resolved..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white/80" />
            </div>
          )}
          {flag.status === 'resolved' && flag.resolution_notes && (
            <div className="bg-green-100 rounded-lg p-3"><p className="text-xs font-medium text-green-800 mb-1">Resolved by {flag.resolved_by_profile?.full_name}</p><p className="text-xs text-green-700">{flag.resolution_notes}</p></div>
          )}
          {canResolve && nextStatus && flag.status !== 'resolved' && (
            <button onClick={handleAdvance} disabled={saving || (nextStatus === 'resolved' && !resolveNotes.trim())} className="flex items-center gap-2 text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40">
              <CheckCircle2 size={15} />{saving ? 'Saving...' : `Mark as ${STATUS_LABELS[nextStatus]}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
