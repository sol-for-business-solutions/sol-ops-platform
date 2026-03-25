'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/hooks/useLocale'
import { LanguageToggle } from '@/components/layout/LanguageToggle'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(t('auth.invalidCredentials'))
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 bg-gray-50 text-gray-900 transition-all"
  const inputStyle = { border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg,#142680,#2B35FF)' }}>
            <span className="text-2xl font-black text-white tracking-tight">
              S<span style={{ color: '#89e3fd' }}>O</span>L
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('auth.signInToContinue')}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: '1px solid #e8edf5' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className={inputClass} style={inputStyle} placeholder="name@sol.sa" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.password')}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className={inputClass} style={inputStyle} autoComplete="current-password" />
            </div>
            {error && (
              <div className="rounded-xl p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50 mt-2">
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">SOL For Business Solution · Operations Platform</p>
      </div>
    </div>
  )
}
