'use client'
import { useRef } from 'react'
import { Camera, CheckCircle2, Circle, ImageIcon, Loader2 } from 'lucide-react'
import type { ChecklistItem } from '@/types'

interface Props { items: ChecklistItem[]; saving: string | null; canEdit: boolean; onToggle: (id: string, is_completed: boolean) => void; onUploadPhoto: (id: string, file: File) => void }

export function ChecklistPhase({ items, saving, canEdit, onToggle, onUploadPhoto }: Props) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  if (items.length === 0) return <div className="text-center py-12 text-sm text-gray-400">No items in this phase</div>
  return (
    <div className="space-y-2">
      {items.map(item => {
        const isSaving = saving === item.id
        return (
          <div key={item.id} className={`bg-white rounded-xl border p-4 transition-all ${item.is_completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <button disabled={!canEdit || isSaving} onClick={() => onToggle(item.id, !item.is_completed)} className="mt-0.5 shrink-0 transition-transform active:scale-90 disabled:opacity-50">
                {isSaving ? <Loader2 size={22} className="animate-spin text-gray-400" /> : item.is_completed ? <CheckCircle2 size={22} className="text-green-500" /> : <Circle size={22} className="text-gray-300" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.is_completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>{item.title_en}</p>
                <p className={`text-sm mt-0.5 ${item.is_completed ? 'text-green-600' : 'text-gray-400'}`} dir="rtl">{item.title_ar}</p>
                {item.is_completed && item.completed_at && <p className="text-xs text-green-600 mt-1">Completed {new Date(item.completed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>}
                {item.requires_photo && (
                  <div className="mt-3">
                    {item.photo_url ? (
                      <div className="flex items-center gap-2">
                        <img src={item.photo_url} alt="Evidence" className="h-16 w-16 object-cover rounded-lg border border-green-200" />
                        {canEdit && <button onClick={() => fileRefs.current[item.id]?.click()} className="text-xs text-gray-500 hover:text-gray-700 underline">Replace photo</button>}
                      </div>
                    ) : canEdit && (
                      <button onClick={() => fileRefs.current[item.id]?.click()} disabled={isSaving} className="flex items-center gap-1.5 text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50">
                        <Camera size={14} />Upload photo evidence<span className="text-red-400 ml-1">*required</span>
                      </button>
                    )}
                    <input ref={el => { fileRefs.current[item.id] = el }} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { const file = e.target.files?.[0]; if (file) onUploadPhoto(item.id, file) }} />
                  </div>
                )}
              </div>
              {item.requires_photo && <div className="shrink-0 mt-0.5"><ImageIcon size={14} className={item.photo_url ? 'text-green-400' : 'text-gray-300'} /></div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
