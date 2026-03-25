'use client'
import { useState, useRef } from 'react'
import { X, Upload, CheckCircle2, AlertCircle, Download } from 'lucide-react'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const SAMPLE_CSV = `title_en,title_ar,city_name,venue,day1_date,trainer_name,capacity,course_type
Leadership Excellence,التميز القيادي,Riyadh,Hilton Riyadh,2026-04-10,Ahmed Al-Ghamdi,30,standard
Project Management,إدارة المشاريع,Jeddah,Marriott Jeddah,2026-04-17,Sara Hassan,25,standard`

export function BulkCourseImportModal({ onClose, onSuccess }: Props) {
  const [csv, setCsv] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function parseCsv(text: string) {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCsv(ev.target?.result as string)
    reader.readAsText(file)
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'sample_courses.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const rows = csv ? parseCsv(csv) : []

  async function handleImport() {
    if (rows.length === 0) { setError('No valid rows to import'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/courses/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: rows }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Import failed'); return }
      setResult(data)
      if (data.created > 0) setTimeout(() => { onSuccess() }, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ border: '1px solid #e8edf5' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Bulk Course Import</h2>
            <p className="text-xs text-gray-400 mt-0.5">Import multiple courses from a CSV file</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Upload size={15} />Choose CSV file
            </button>
            <button onClick={downloadSample}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Download size={15} />Download sample
            </button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Or paste CSV directly</label>
            <textarea
              value={csv}
              onChange={e => setCsv(e.target.value)}
              rows={6}
              placeholder={SAMPLE_CSV}
              className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 bg-gray-50"
              style={{ '--tw-ring-color': '#142680' } as React.CSSProperties}
            />
          </div>

          {rows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">{rows.length} row{rows.length !== 1 ? 's' : ''} detected</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {Object.keys(rows[0]).map(h => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          {Object.values(row as Record<string, string>).map((v, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700 truncate max-w-24">{v as string}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 5 && <p className="text-xs text-gray-400 px-3 py-2">+ {rows.length - 5} more rows</p>}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />{error}
            </div>
          )}

          {result && (
            <div className={`rounded-lg p-4 border ${result.created > 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className={result.created > 0 ? 'text-green-600' : 'text-amber-600'} />
                <span className={`text-sm font-semibold ${result.created > 0 ? 'text-green-800' : 'text-amber-800'}`}>
                  {result.created} course{result.created !== 1 ? 's' : ''} imported successfully
                </span>
              </div>
              {result.errors?.length > 0 && (
                <div className="space-y-1 mt-2">
                  {result.errors.map((e: any, i: number) => (
                    <p key={i} className="text-xs text-red-700">Row {e.row}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleImport}
            disabled={loading || rows.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#142680,#2B35FF)' }}>
            {loading ? 'Importing…' : `Import ${rows.length} course${rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
