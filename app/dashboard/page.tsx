'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShieldCheck, ArrowRight, Users, Star, UserCircle, Clock, CheckCircle,
  Activity, Bell, Video, Eye, Edit3, Upload
} from 'lucide-react'

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string>('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [engagementRequests, setEngagementRequests] = useState<any[]>([])
  const [recentMedia, setRecentMedia] = useState<any[]>([])
  const [profileViews, setProfileViews] = useState(0)
  const [shortlistCount, setShortlistCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('1. Getting user...')
        const { data: { user } } = await supabase.auth.getUser()
        console.log('2. User:', user)
        
        if (!user) {
          router.push('/login')
          return
        }

        // CHECK ADMIN FIRST
        console.log('3. Checking admin...')
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (adminData) {
          console.log('Admin detected!')
          setUserRole('admin')
          setLoading(false)
          return
        }

        // CHECK SCOUT SECOND
        console.log('4. Checking scout...')
        const { data: scout } = await supabase
          .from('scouts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (scout) {
          console.log('Scout detected!')
          window.location.href = '/dashboard/scout'
          return
        }

        // CHECK PLAYER THIRD
        console.log('5. Checking player...')
        const { data: player } = await supabase
          .from('players')
          .select('*, player_stats(*)')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (player) {
          console.log('Player detected!')
          setUserRole('player')
          setProfile(player)
          
          // Fetch player specific data
          await fetchPlayerData(player.id)
          setLoading(false)
          return
        }

        // CHECK AGENT FOURTH
        console.log('6. Checking agent...')
        const { data: agent } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (agent) {
          console.log('Agent detected!')
          setUserRole('agent')
          setProfile(agent)
          setLoading(false)
          return
        }

        console.log('7. No role found, redirecting to complete-profile')
        router.push('/complete-profile')
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const fetchPlayerData = async (playerId: string) => {
    // Fetch engagement requests
    const { data: engagements } = await supabase
      .from('engagements')
      .select('*, agents(name, agency)')
      .eq('player_id', playerId)
      .eq('status', 'pending')
    
    if (engagements) setEngagementRequests(engagements)

    // Fetch recent media
    const { data: media } = await supabase
      .from('media')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (media) setRecentMedia(media)

    // Count shortlists
    const { count } = await supabase
      .from('shortlists')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', playerId)
    
    if (count) setShortlistCount(count)

    // Simulate profile views
    setProfileViews(Math.floor(Math.random() * 50) + 10)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // ========== ADMIN DASHBOARD ==========
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
            <p className="text-gray-600">Approve players, manage engagements, and more</p>
            <div className="mt-4 flex items-center text-red-600">
              <span className="text-sm">Go to Admin Panel</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      </div>
    )
  }

  // ========== PLAYER DASHBOARD ==========
  if (userRole === 'player') {
    const currentStats = {
      matches_played: profile?.player_stats?.[0]?.matches_played || 0,
      goals: profile?.player_stats?.[0]?.goals || 0,
      assists: profile?.player_stats?.[0]?.assists || 0,
    }

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-6">
            {profile?.profile_picture ? (
              <img 
                src={profile.profile_picture} 
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white">
                <UserCircle className="w-10 h-10 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {profile?.name?.split(' ')[0] || 'Player'}! 👋</h1>
              <p className="text-white/80 mt-1">Manage your football profile</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.position}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Age: {profile?.age}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.nationality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
            <p className="text-gray-500 text-sm">Profile Views</p>
            <p className="text-2xl font-bold text-red-600">{profileViews}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Shortlisted By</p>
            <p className="text-2xl font-bold text-blue-600">{shortlistCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Engagement Requests</p>
            <p className="text-2xl font-bold text-green-600">{engagementRequests.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Media Uploads</p>
            <p className="text-2xl font-bold text-purple-600">{recentMedia.length}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/profile" className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold">Edit Profile</p>
              <p className="text-xs text-gray-500">Update your info</p>
            </div>
          </Link>
          <Link href="/dashboard/profile?tab=media" className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">Upload Media</p>
              <p className="text-xs text-gray-500">Add highlights</p>
            </div>
          </Link>
        </div>

        {/* Performance Statistics */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Performance Statistics</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-4">
              <p className="text-2xl font-bold text-red-600">{currentStats.matches_played}</p>
              <p className="text-gray-500 text-sm">Matches</p>
            </div>
            <div className="bg-gradient-to-br from-black/5 to-white rounded-lg p-4">
              <p className="text-2xl font-bold text-black">{currentStats.goals}</p>
              <p className="text-gray-500 text-sm">Goals</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">{currentStats.assists}</p>
              <p className="text-gray-500 text-sm">Assists</p>
            </div>
          </div>
        </div>

        {/* Engagement Requests */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Engagement Requests
            {engagementRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {engagementRequests.length} new
              </span>
            )}
          </h2>
          {engagementRequests.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No engagement requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {engagementRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{request.agents?.name}</p>
                      <p className="text-sm text-gray-500">{request.agents?.agency || 'Independent Agent'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg">Accept</button>
                      <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg">Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========== AGENT DASHBOARD ==========
  if (userRole === 'agent') {
    return (
      <div>
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
          <p className="text-white/80">Discover and connect with talent</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/players" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-red-500">
            <Users className="w-12 h-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Browse Players</h2>
            <p className="text-gray-600">Search and discover elite football talent</p>
            <div className="mt-4 flex items-center text-red-600">
              <span className="text-sm">Browse Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
          <Link href="/dashboard/shortlist" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-yellow-500">
            <Star className="w-12 h-12 text-yellow-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">My Shortlist</h2>
            <p className="text-gray-600">View your saved players</p>
            <div className="mt-4 flex items-center text-yellow-600">
              <span className="text-sm">View Shortlist</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      </div>
    )
  }

  return null
}