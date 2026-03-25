'use client'
import { useState } from 'react'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function RegenerateCertButton({ certId }: { certId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleRegen() {
    if (!confirm('Regenerate this certificate? A new verification code will be issued and the old one will be invalidated.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/certificates/${certId}`, { method: 'PATCH' })
      if (res.ok) {
        setDone(true)
        setTimeout(() => { router.refresh(); setDone(false) }, 1000)
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) return <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={12} />Done</span>

  return (
    <button
      onClick={handleRegen}
      disabled={loading}
      title="Regenerate with new code"
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-700 transition-colors disabled:opacity-50">
      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      {loading ? '…' : 'Regen'}
    </button>
  )
}
