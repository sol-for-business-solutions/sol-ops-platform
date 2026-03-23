import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#0d1a5c,#142680,#1e3aaa)'}}>
      <div className="text-center text-white">
        <div className="text-8xl font-black opacity-20 mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-blue-200 text-sm mb-8">The page you're looking for doesn't exist.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)'}}>
          ← Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
