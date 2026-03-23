'use client'
import { useState, useEffect } from 'react'
import type { City } from '@/types'

export function useCities() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/cities').then(r => r.json()).then(setCities).finally(() => setLoading(false))
  }, [])
  return { cities, loading }
}
