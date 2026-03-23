'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Course } from '@/types'

interface Filters { status?: string; city_id?: string; search?: string }

export function useCourses(filters: Filters = {}) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.city_id) params.set('city_id', filters.city_id)
      if (filters.search) params.set('search', filters.search)
      const res = await fetch(`/api/courses?${params}`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      setCourses(await res.json())
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [filters.status, filters.city_id, filters.search])

  useEffect(() => { fetchCourses() }, [fetchCourses])
  return { courses, loading, error, refetch: fetchCourses }
}

export function useCourse(id: string) {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!id) return
    fetch(`/api/courses/${id}`).then(r => r.json()).then(setCourse).finally(() => setLoading(false))
  }, [id])
  return { course, loading }
}
