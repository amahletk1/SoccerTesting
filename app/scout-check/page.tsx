'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ScoutTestPage() {
  const [isScout, setIsScout] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function test() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsScout(false)
          setError('Not logged in')
          return
        }

        const { data, error } = await supabase
          .from('scouts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          setError(error.message)
          setIsScout(false)
        } else {
          setIsScout(!!data)
        }
      } catch (err: any) {
        setError(err.message)
        setIsScout(false)
      }
    }
    test()
  }, [])

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
        <pre className="bg-red-50 p-4 rounded">{error}</pre>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Scout Detection Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        {isScout === null ? 'Loading...' : isScout ? '✅ You are a scout!' : '❌ You are NOT a scout'}
      </div>
    </div>
  )
}