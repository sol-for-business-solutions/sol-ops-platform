'use client'
import { useEffect, useRef } from 'react'

interface CheckinRecord {
  id: string
  type: 'in' | 'out'
  day: number
  lat: number
  lng: number
  is_valid: boolean
  distance_meters: number
  created_at: string
  coordinator?: { full_name: string; full_name_ar: string }
}

interface VenueCoords { lat: number; lng: number; name: string }

interface Props {
  checkins: CheckinRecord[]
  venue: VenueCoords
}

export function CheckinMap({ checkins, venue }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as any).L
      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current).setView([venue.lat, venue.lng], 15)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      // Venue marker (blue)
      const venueIcon = L.divIcon({
        html: `<div style="background:#142680;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        className: '', iconAnchor: [8, 8],
      })
      L.marker([venue.lat, venue.lng], { icon: venueIcon })
        .addTo(map)
        .bindPopup(`<strong>${venue.name}</strong><br>Venue location`)

      // 500m radius circle
      L.circle([venue.lat, venue.lng], {
        radius: 500, color: '#142680', fillColor: '#142680',
        fillOpacity: 0.05, weight: 1.5, dashArray: '5 5',
      }).addTo(map)

      // Check-in markers
      checkins.forEach(c => {
        const color = c.is_valid ? '#16a34a' : '#dc2626'
        const icon = L.divIcon({
          html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
          className: '', iconAnchor: [6, 6],
        })
        const time = new Date(c.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        L.marker([Number(c.lat), Number(c.lng)], { icon })
          .addTo(map)
          .bindPopup(`
            <strong>${c.coordinator?.full_name ?? 'Coordinator'}</strong><br>
            Day ${c.day} — Check-${c.type}<br>
            ${time}<br>
            <span style="color:${color}">${c.distance_meters}m from venue · ${c.is_valid ? 'Valid ✓' : 'Outside radius ✗'}</span>
          `)
      })

      // Fit bounds to include all markers
      if (checkins.length > 0) {
        const allPoints = [[venue.lat, venue.lng], ...checkins.map(c => [Number(c.lat), Number(c.lng)])]
        map.fitBounds(allPoints as any, { padding: [30, 30] })
      }
    }
    document.body.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // eslint-disable-line

  // Update markers when data changes (after initial mount)
  useEffect(() => {
    if (!mapInstanceRef.current || checkins.length === 0) return
    // Map already initialized, markers added on mount
  }, [checkins])

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#142680] inline-block border-2 border-white shadow"></span>
          Venue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block border-2 border-white shadow"></span>
          Valid check-in
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600 inline-block border-2 border-white shadow"></span>
          Outside radius
        </span>
        <span className="text-gray-400 ml-auto">Dashed circle = 500m radius</span>
      </div>
      <div ref={mapRef} style={{ height: '400px', borderRadius: '12px', border: '1px solid #e8edf5', overflow: 'hidden' }} />
    </div>
  )
}
