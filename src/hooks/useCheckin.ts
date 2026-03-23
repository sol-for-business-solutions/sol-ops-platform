'use client'
import { useState, useEffect } from 'react'
import type { Checkin } from '@/types'

export function useCheckin(courseId: string, coordinatorId: string) {
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)

  useEffect(() => {
    if (!courseId || !coordinatorId) return
    fetch(`/api/checkins/status?course_id=${courseId}&coordinator_id=${coordinatorId}`)
      .then(r => r.json()).then(setCheckins).finally(() => setLoading(false))
  }, [courseId, coordinatorId])

  function getStatus(day: 1 | 2) {
    return checkins.find(c => c.day === day && c.coordinator_id === coordinatorId) ?? null
  }

  async function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return }
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
    })
  }

  async function checkIn(day: 1 | 2, type: 'in' | 'out') {
    setGpsError(null); setGpsLoading(true)
    let position: GeolocationPosition
    try { position = await getCurrentPosition() }
    catch (e: any) {
      setGpsError(e.code === 1 ? 'Location permission denied. Please enable location access.' : 'Could not get your location. Please try again.')
      setGpsLoading(false); return null
    }
    setGpsLoading(false); setSubmitting(true)
    try {
      const res = await fetch('/api/checkins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId, day, type, lat: position.coords.latitude, lng: position.coords.longitude }) })
      const data = await res.json()
      if (!res.ok) { setGpsError(data.error || 'Check-in failed'); return null }
      const statusRes = await fetch(`/api/checkins/status?course_id=${courseId}&coordinator_id=${coordinatorId}`)
      setCheckins(await statusRes.json())
      return data
    } catch (e: any) { setGpsError('Network error. Please try again.'); return null }
    finally { setSubmitting(false) }
  }

  return { checkins, loading, submitting, gpsError, gpsLoading, getStatus, checkIn }
}
