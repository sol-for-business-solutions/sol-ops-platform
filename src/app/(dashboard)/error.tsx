'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center">
      <p className="text-3xl font-semibold text-gray-200 mb-3">!</p>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-5 max-w-sm">{error.message || 'An unexpected error occurred'}</p>
      <div className="flex gap-3">
        <button onClick={reset} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Try again
        </button>
        <Link href="/dashboard" className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Dashboard
        </Link>
      </div>
    </div>
  )
}
