'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [scout, setScout] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const debug = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: scoutData } = await supabase
          .from('scouts')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setScout(scoutData)
      }
      setLoading(false)
    }
    debug()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-semibold">User:</h2>
        <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold">Scout Profile:</h2>
        <pre className="text-sm">{JSON.stringify(scout, null, 2)}</pre>
      </div>
      <div className="mt-4">
        {scout ? (
          <p className="text-green-600">✓ Scout profile found! Should redirect to /dashboard/scout</p>
        ) : (
          <p className="text-red-600">✗ No scout profile found! Need to create one.</p>
        )}
      </div>
    </div>
  )
}
