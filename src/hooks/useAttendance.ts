'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Trainee, Attendance, AttendanceSession } from '@/types'

export function useAttendance(courseId: string) {
  const [trainees, setTrainees] = useState<Trainee[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    const [tRes, aRes] = await Promise.all([fetch(`/api/trainees?course_id=${courseId}`), fetch(`/api/attendance?course_id=${courseId}`)])
    const [t, a] = await Promise.all([tRes.json(), aRes.json()])
    setTrainees(Array.isArray(t) ? t : [])
    setAttendance(Array.isArray(a) ? a : [])
    setLoading(false)
  }, [courseId])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!courseId) return
    const supabase = createClient()
    const channel = supabase.channel(`attendance:${courseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `course_id=eq.${courseId}` }, () => fetchAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [courseId, fetchAll])

  function isPresent(traineeId: string, session: AttendanceSession) {
    return attendance.some(a => a.trainee_id === traineeId && a.session === session && a.is_present)
  }

  function getSessionCount(traineeId: string) {
    return ['day1_am','day1_pm','day2_am','day2_pm'].filter(s => isPresent(traineeId, s as AttendanceSession)).length
  }

  function isEligible(traineeId: string) { return getSessionCount(traineeId) >= 3 }

  async function markAttendance(traineeId: string, session: AttendanceSession, present: boolean) {
    const key = `${traineeId}-${session}`; setSaving(key)
    setAttendance(prev => {
      const existing = prev.findIndex(a => a.trainee_id === traineeId && a.session === session)
      const record = { id: key, trainee_id: traineeId, course_id: courseId, session, is_present: present, marked_by: '', marked_at: new Date().toISOString() } as Attendance
      if (existing >= 0) { const updated = [...prev]; updated[existing] = record; return updated }
      return [...prev, record]
    })
    await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trainee_id: traineeId, course_id: courseId, session, is_present: present }) })
    setSaving(null)
  }

  async function markAllPresent(session: AttendanceSession) {
    const records = trainees.map(t => ({ trainee_id: t.id, is_present: true }))
    await fetch('/api/attendance/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId, session, records }) })
    await fetchAll()
  }

  const totalTrainees = trainees.length
  const eligibleCount = trainees.filter(t => isEligible(t.id)).length
  const sessionStats = (['day1_am','day1_pm','day2_am','day2_pm'] as AttendanceSession[]).map(session => ({
    session, present: trainees.filter(t => isPresent(t.id, session)).length, total: totalTrainees,
  }))

  return { trainees, attendance, loading, saving, isPresent, getSessionCount, isEligible, markAttendance, markAllPresent, totalTrainees, eligibleCount, sessionStats, refetch: fetchAll }
}
