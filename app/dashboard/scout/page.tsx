'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ScoutDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
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

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Scout Dashboard</h1>
        <p className="text-white/80">Welcome, {profile?.name || 'Scout'}!</p>
        <p className="text-white/60 mt-1">Club: {profile?.club_name || 'Independent Scout'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-semibold mb-2">Browse Players</h2>
          <p className="text-gray-600">Find and evaluate football talent</p>
          <button 
            onClick={() => router.push('/dashboard/players')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Browse Players →
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold mb-2">My Reports</h2>
          <p className="text-gray-600">View your scouting reports</p>
          <button 
            onClick={() => router.push('/dashboard/reports')}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            View Reports →
          </button>
        </div>
      </div>
    </div>
  )
}