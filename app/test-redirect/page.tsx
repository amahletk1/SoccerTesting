'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    console.log('Test page loaded successfully!')
  }, [])

  return (
    <div className="p-8">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        ✅ TEST PAGE - REDIRECT WORKED!
      </div>
      <h1 className="text-3xl font-bold mb-4">This is a test page</h1>
      <p>If you can see this, the redirect from complete-profile is working.</p>
      <button 
        onClick={() => router.push('/dashboard/scout')}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Go to Scout Dashboard
      </button>
    </div>
  )
}