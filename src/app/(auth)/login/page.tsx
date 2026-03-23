import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg,#0d1a5c 0%,#142680 45%,#1e3aaa 75%,#2B35FF 100%)'}}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-16 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{background:'radial-gradient(circle,#89e3fd,transparent)',transform:'translate(30%,-30%)'}} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{background:'radial-gradient(circle,#2B35FF,transparent)',transform:'translate(-30%,30%)'}} />
        <div className="relative z-10 text-white text-center">
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-6xl font-black tracking-tight" style={{letterSpacing:'-2px'}}>
                <span className="text-white">S</span>
                <span style={{color:'#89e3fd'}}>0</span>
                <span className="text-white">L</span>
              </span>
            </div>
            <p className="text-blue-200 text-lg font-light tracking-widest uppercase">لحلول الأعمال</p>
            <p className="text-blue-300 text-sm font-medium tracking-widest uppercase mt-1">For Business Solutions</p>
          </div>
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {['Course Management', 'GPS Check-in', 'Real-time Flags', 'Digital Certificates'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:'#89e3fd'}} />
                <span className="text-blue-100 text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-2" style={{background:'linear-gradient(90deg,#142680,#2B35FF)'}} />
            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 lg:hidden">
                  <span className="text-2xl font-black" style={{color:'#142680',letterSpacing:'-1px'}}>SOL</span>
                </div>
                <h1 className="text-2xl font-bold" style={{color:'#10120f'}}>Welcome back</h1>
                <p className="text-gray-400 text-sm mt-1">Sign in to your operations dashboard</p>
              </div>
              <LoginForm />
            </div>
          </div>
          <p className="text-center text-blue-200 text-xs mt-6 opacity-70">
            SOL For Business Solutions · Operations Platform
          </p>
        </div>
      </div>
    </div>
  )
}
