'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/hooks/useLocale'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const { t, isRTL } = useLocale()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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

  const inputBase = "w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-gray-50 text-gray-900 transition-all focus:outline-none focus:ring-2"
  const inputStyle = { border: '1px solid #e8edf5', '--tw-ring-color': '#142680' } as React.CSSProperties

  return (
    <div className={isRTL ? 'text-right' : ''}>
      {/* Language toggle */}
      <div className={`flex mb-6 ${isRTL ? 'justify-start' : 'justify-end'}`}>
        <LanguageToggle />
      </div>

      {/* Logo + heading */}
      <div className={`mb-8 ${isRTL ? 'text-right' : ''}`}>
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{background:'linear-gradient(135deg,#142680,#2B35FF)'}}>
            <span className="text-sm font-black text-white">
              S<span style={{color:'#89e3fd'}}>O</span>L
            </span>
          </div>
          <span className="font-black text-lg" style={{color:'#142680'}}>SOL Ops</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('auth.signInToContinue')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t('auth.email')}
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputBase}
              style={inputStyle}
              placeholder="name@sol.sa"
              autoComplete="email"
              dir="ltr"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t('auth.password')}
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`${inputBase} pr-10`}
              style={inputStyle}
              autoComplete="current-password"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label="Toggle password visibility"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl p-3 text-sm" style={{background:'#fef2f2',border:'1px solid #fca5a5',color:'#991b1b'}}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white sol-btn-primary disabled:opacity-50 mt-2">
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('auth.signingIn')}
              </span>
            : t('auth.signIn')
          }
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">SOL For Business Solution · Operations Platform</p>
    </div>
  )
}
