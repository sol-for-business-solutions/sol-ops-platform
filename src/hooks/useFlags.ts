'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Flag } from '@/types'

interface FlagFilters { course_id?: string; severity?: string; status?: string }

export function useFlags(filters: FlagFilters = {}) {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFlags = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.course_id) params.set('course_id', filters.course_id)
    if (filters.severity) params.set('severity', filters.severity)
    if (filters.status) params.set('status', filters.status)
    const res = await fetch(`/api/flags?${params}`)
    const data = await res.json()
    setFlags(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filters.course_id, filters.severity, filters.status])

  useEffect(() => { fetchFlags() }, [fetchFlags])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('flags-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flags' }, () => fetchFlags())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchFlags])

  async function updateFlagStatus(id: string, status: string, resolution_notes?: string) {
    await fetch(`/api/flags/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, resolution_notes }) })
    await fetchFlags()
  }

  return { flags, loading, refetch: fetchFlags, updateFlagStatus }
}
