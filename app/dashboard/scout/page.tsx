'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ScoutDashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: scout } = await supabase
        .from('scouts')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!scout) {
        router.push('/dashboard')
        return
      }
      setProfile(scout)
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Scout Dashboard</h1>
      <p>Welcome, {profile?.name}!</p>
      <p>Club: {profile?.club_name || 'Independent'}</p>
    </div>
  )
}