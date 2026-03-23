'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Invalid email or password.'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  const inputClass = "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 text-gray-800 bg-gray-50 transition-all"
  const focusStyle = { '--tw-ring-color': '#142680' } as React.CSSProperties

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="relative">
        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className={inputClass} style={focusStyle} placeholder="you@sol.com.sa" />
      </div>
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
          className={`${inputClass} pr-10`} style={focusStyle} placeholder="••••••••" />
        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold shrink-0">!</span>
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all sol-btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in...
          </span>
        ) : 'Sign in'}
      </button>
    </form>
  )
}
