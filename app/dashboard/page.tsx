'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, UserCheck, Activity, Bell, ArrowRight, BarChart3, 
  ShieldCheck, UserCircle, Video, CheckCircle, Clock, Search, Star
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Check if scout FIRST
        const { data: scout } = await supabase
          .from('scouts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (scout) {
          window.location.href = '/dashboard/scout'
          return
        }

        // Check if admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (adminData) {
          setUserRole('admin')
          setLoading(false)
          return
        }

        // Check if player
        const { data: player } = await supabase
          .from('players')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (player) {
          setUserRole('player')
          setLoading(false)
          return
        }

        // Check if agent
        const { data: agent } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (agent) {
          setUserRole('agent')
          setLoading(false)
          return
        }

        router.push('/complete-profile')
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }
    getUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Admin Dashboard
  if (userRole === 'admin') {
    return (
      <div>
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-white/80">Manage players, agents, and platform analytics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/admin" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-red-500">
            <ShieldCheck className="w-12 h-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin Panel</h2>
            <p className="text-gray-600">Approve players, manage engagements</p>
          </Link>
        </div>
      </div>
    )
  }

  // Player Dashboard
  if (userRole === 'player') {
    return (
      <div>
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <h1 className="text-3xl font-bold">Player Dashboard</h1>
          <p className="text-white/80">Manage your football profile</p>
        </div>
        <Link href="/dashboard/profile" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-red-500">
          <UserCircle className="w-12 h-12 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">My Profile</h2>
          <p className="text-gray-600">Update your info and stats</p>
        </Link>
      </div>
    )
  }

  // Agent Dashboard
  if (userRole === 'agent') {
    return (
      <div>
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-white/80">Discover and connect with talent</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/players" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500">
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Browse Players</h2>
            <p className="text-gray-600">Search for talent</p>
          </Link>
          <Link href="/dashboard/shortlist" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-yellow-500">
            <Star className="w-12 h-12 text-yellow-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Shortlist</h2>
            <p className="text-gray-600">View saved players</p>
          </Link>
        </div>
      </div>
    )
  }

  return null
}