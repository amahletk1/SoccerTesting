'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ScoutDashboard() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>
  }

  return (
    <div className="p-8">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        ✅ Scout Dashboard - Working!
      </div>
      <h1 className="text-3xl font-bold mb-4">Scout Dashboard</h1>
      <p>Welcome to your scouting dashboard!</p>
    </div>
  )
}