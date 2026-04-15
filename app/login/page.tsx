'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
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

      // Check if user is a scout
      const { data: scout } = await supabase
        .from('scouts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (scout) {
        router.push('/dashboard/scout')
        return
      }

      // Check if player
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (player) {
        router.push('/dashboard')
        return
      }

      // Check if agent
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (agent) {
        router.push('/dashboard')
        return
      }

      // No profile found
      router.push('/complete-profile')
    }

    checkUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return null
}