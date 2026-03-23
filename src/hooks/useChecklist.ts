'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChecklistItem } from '@/types'

export function useChecklist(courseId: string) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    const res = await fetch(`/api/checklists?course_id=${courseId}`)
    setItems(await res.json())
    setLoading(false)
  }, [courseId])

  useEffect(() => { fetchItems() }, [fetchItems])

  useEffect(() => {
    if (!courseId) return
    const supabase = createClient()
    const channel = supabase.channel(`checklist:${courseId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'checklist_items', filter: `course_id=eq.${courseId}` }, () => fetchItems())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [courseId, fetchItems])

  async function toggleItem(id: string, is_completed: boolean) {
    setSaving(id)
    setItems(prev => prev.map(item => item.id === id ? { ...item, is_completed } : item))
    await fetch(`/api/checklists/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_completed }) })
    setSaving(null)
  }

  async function uploadPhoto(id: string, file: File) {
    setSaving(id)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('item_id', id)
    const res = await fetch('/api/checklists/upload', { method: 'POST', body: formData })
    const { url } = await res.json()
    await fetch(`/api/checklists/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_completed: true, photo_url: url }) })
    setItems(prev => prev.map(item => item.id === id ? { ...item, is_completed: true, photo_url: url } : item))
    setSaving(null)
  }

  const total = items.length
  const completed = items.filter(i => i.is_completed).length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const byPhase = {
    pre: items.filter(i => i.phase === 'pre'),
    during: items.filter(i => i.phase === 'during'),
    post: items.filter(i => i.phase === 'post'),
  }

  return { items, loading, saving, toggleItem, uploadPhoto, total, completed, percentage, byPhase, refetch: fetchItems }
}
