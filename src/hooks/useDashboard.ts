'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useDashboardStats(cityId?: string) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    const params = cityId ? `?city_id=${cityId}` : ''
    const res = await fetch(`/api/dashboard/stats${params}`)
    setStats(await res.json())
    setLoading(false)
  }, [cityId])

  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flags' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, () => fetchStats())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchStats])

  return { stats, loading, refetch: fetchStats }
}

export function useCityStats() {
  const [cities, setCities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/dashboard/cities').then(r => r.json()).then(setCities).finally(() => setLoading(false))
  }, [])
  return { cities, loading }
}

export function useCoordinatorStats() {
  const [coordinators, setCoordinators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/dashboard/coordinators').then(r => r.json()).then(setCoordinators).finally(() => setLoading(false))
  }, [])
  return { coordinators, loading }
}
