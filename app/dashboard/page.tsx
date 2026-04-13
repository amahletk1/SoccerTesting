'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, UserCheck, TrendingUp, Calendar, Activity, 
  Star, Eye, Award, Bell, ArrowRight, BarChart3, 
  ShieldCheck, UserCircle, Video, Image, Target, CheckCircle,
  XCircle, MessageSquare, Upload, Clock, Search, Edit3
} from 'lucide-react'
import StatsEditor from '@/app/components/StatsEditor'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [engagementRequests, setEngagementRequests] = useState<any[]>([])
  const [recentMedia, setRecentMedia] = useState<any[]>([])
  const [profileViews, setProfileViews] = useState(0)
  const [shortlistCount, setShortlistCount] = useState(0)
  const [showStatsEditor, setShowStatsEditor] = useState(false)
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalAgents: 0,
    pendingPlayers: 0,
    approvedPlayers: 0,
    pendingEngagements: 0,
    approvedEngagements: 0,
    totalMedia: 0
  })
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

        // Check if admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (adminData) {
          setUserRole('admin')
          await fetchAdminStats()
          setLoading(false)
          return
        }

        // Check if player
        const { data: player } = await supabase
          .from('players')
          .select('*, player_stats(*)')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (player) {
          setUserRole('player')
          setProfile(player)
          await fetchPlayerData(player.id)
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
          setProfile(agent)
          await fetchAgentData(agent.id)
          setLoading(false)
          return
        }

        // Check if scout
        const { data: scout } = await supabase
          .from('scouts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (scout) {
          router.push('/dashboard/scout')
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

  const fetchAdminStats = async () => {
    const { count: totalPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalAgents } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
    
    const { count: pendingPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    const { count: approvedPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
    
    const { data: engagements } = await supabase
      .from('engagements')
      .select('status')
    
    const { count: totalMedia } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })
    
    setStats({
      totalPlayers: totalPlayers || 0,
      totalAgents: totalAgents || 0,
      pendingPlayers: pendingPlayers || 0,
      approvedPlayers: approvedPlayers || 0,
      pendingEngagements: engagements?.filter(e => e.status === 'pending').length || 0,
      approvedEngagements: engagements?.filter(e => e.status === 'approved').length || 0,
      totalMedia: totalMedia || 0,
    })
  }

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

    // Simulate profile views (could be tracked in a real table)
    setProfileViews(Math.floor(Math.random() * 50) + 10)
  }

  const fetchAgentData = async (agentId: string) => {
    // Fetch shortlisted players
    const { data: shortlist } = await supabase
      .from('shortlists')
      .select('*, players(name, position, nationality, age)')
      .eq('agent_id', agentId)
      .limit(5)
    
    if (shortlist) setRecentActivity(shortlist)

    // Fetch pending engagement requests
    const { data: engagements } = await supabase
      .from('engagements')
      .select('*, players(name, position)')
      .eq('agent_id', agentId)
      .eq('status', 'pending')
    
    if (engagements) setEngagementRequests(engagements)
  }

  const refreshPlayerData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: player } = await supabase
        .from('players')
        .select('*, player_stats(*)')
        .eq('user_id', user.id)
        .single()
      if (player) setProfile(player)
    }
  }

  const handleAcceptEngagement = async (engagementId: string) => {
    const { error } = await supabase
      .from('engagements')
      .update({ status: 'approved' })
      .eq('id', engagementId)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Engagement accepted! You can now connect with the agent.')
      setEngagementRequests(engagementRequests.filter(e => e.id !== engagementId))
    }
  }

  const handleRejectEngagement = async (engagementId: string) => {
    const { error } = await supabase
      .from('engagements')
      .update({ status: 'rejected' })
      .eq('id', engagementId)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Engagement declined')
      setEngagementRequests(engagementRequests.filter(e => e.id !== engagementId))
    }
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
    const approvalRate = stats.totalPlayers > 0 
      ? Math.round((stats.approvedPlayers / stats.totalPlayers) * 100) 
      : 0

    return (
      <div>
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Admin! 👋</h1>
          <p className="text-white/80">Manage players, agents, and platform analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Players</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalPlayers}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.pendingPlayers} pending approval</p>
              </div>
              <Users className="w-8 h-8 text-red-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Agents</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalAgents}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Engagements</p>
                <p className="text-2xl font-bold text-green-600">{stats.pendingEngagements + stats.approvedEngagements}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.pendingEngagements} pending</p>
              </div>
              <Activity className="w-8 h-8 text-green-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Media Uploads</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalMedia}</p>
              </div>
              <Video className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/overview" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-red-500">
            <BarChart3 className="w-12 h-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analytics Overview</h2>
            <p className="text-gray-600">View platform performance, charts, and insights</p>
            <div className="mt-4 flex items-center text-red-600">
              <span className="text-sm">View Analytics</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link href="/dashboard/admin" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500">
            <ShieldCheck className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin Panel</h2>
            <p className="text-gray-600">Approve players, manage engagements, and more</p>
            <div className="mt-4 flex items-center text-blue-600">
              <span className="text-sm">Go to Admin Panel</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-gradient-to-r from-red-50 to-blue-50 rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-red-600">{approvalRate}%</p>
              <p className="text-xs text-gray-500">Approval Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.approvedEngagements}</p>
              <p className="text-xs text-gray-500">Successful Connections</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalAgents}</p>
              <p className="text-xs text-gray-500">Active Scouts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.totalMedia}</p>
              <p className="text-xs text-gray-500">Media Items</p>
            </div>
          </div>
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
      clean_sheets: profile?.player_stats?.[0]?.clean_sheets || 0,
      yellow_cards: profile?.player_stats?.[0]?.yellow_cards || 0,
      red_cards: profile?.player_stats?.[0]?.red_cards || 0
    }

    return (
      <div>
        {/* Welcome Header with Profile Picture */}
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-center gap-6">
            {profile?.profile_picture ? (
              <img 
                src={profile.profile_picture} 
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white">
                <UserCircle className="w-12 h-12 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-white/80 mt-1">Manage your football profile and connect with agents</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.position}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Age: {profile?.age}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.nationality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Profile Views</p>
                <p className="text-2xl font-bold text-red-600">{profileViews}</p>
              </div>
              <Eye className="w-8 h-8 text-red-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Shortlisted By</p>
                <p className="text-2xl font-bold text-blue-600">{shortlistCount}</p>
              </div>
              <Star className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Engagement Requests</p>
                <p className="text-2xl font-bold text-green-600">{engagementRequests.length}</p>
              </div>
              <Activity className="w-8 h-8 text-green-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Media Uploads</p>
                <p className="text-2xl font-bold text-purple-600">{recentMedia.length}</p>
              </div>
              <Video className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition group"
          >
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition">
              <UserCircle className="w-5 h-5 text-red-600 group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Edit Profile</p>
              <p className="text-xs text-gray-500">Update your info</p>
            </div>
          </Link>

          <Link
            href="/dashboard/profile?tab=media"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition">
              <Upload className="w-5 h-5 text-blue-600 group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Upload Media</p>
              <p className="text-xs text-gray-500">Add highlights</p>
            </div>
          </Link>

          <Link
            href="/dashboard/notifications"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition group"
          >
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-600 transition">
              <Bell className="w-5 h-5 text-yellow-600 group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">Check updates</p>
            </div>
          </Link>

          <Link
            href="/dashboard/players"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-lg transition group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition">
              <Users className="w-5 h-5 text-green-600 group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Find Scouts</p>
              <p className="text-xs text-gray-500">Discover agents</p>
            </div>
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Profile Overview */}
          <div className="space-y-8">
            {/* Profile Status */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Profile Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Name</span>
                  <span className="font-semibold">{profile?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Position</span>
                  <span className="font-semibold">{profile?.position}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Age</span>
                  <span className="font-semibold">{profile?.age}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Nationality</span>
                  <span className="font-semibold">{profile?.nationality || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-500">Height/Weight</span>
                  <span className="font-semibold">
                    {profile?.height_cm ? `${profile.height_cm}cm` : '—'} / 
                    {profile?.weight_kg ? `${profile.weight_kg}kg` : '—'}
                  </span>
                </div>
                <div className="mt-4 pt-2">
                  <p className="text-gray-500 text-sm">Status</p>
                  {profile?.status === 'pending' && (
                    <p className="text-yellow-600 font-semibold flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      Pending Admin Approval
                    </p>
                  )}
                  {profile?.status === 'approved' && (
                    <p className="text-green-600 font-semibold flex items-center gap-2 mt-1">
                      <CheckCircle className="w-4 h-4" />
                      Approved - You can now connect with agents
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Statistics with Editor */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-600">Performance Statistics</h2>
                <button
                  onClick={() => setShowStatsEditor(!showStatsEditor)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  {showStatsEditor ? 'Hide Editor' : 'Edit Stats'}
                </button>
              </div>

              {showStatsEditor ? (
                <StatsEditor
                  playerId={profile.id}
                  currentStats={currentStats}
                  onUpdate={refreshPlayerData}
                  onClose={() => setShowStatsEditor(false)}
                />
              ) : (
                <>
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
                  
                  {/* Advanced Stats */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-500">Clean Sheets</p>
                        <p className="text-lg font-semibold text-gray-700">{currentStats.clean_sheets}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Yellow Cards</p>
                        <p className="text-lg font-semibold text-gray-700">{currentStats.yellow_cards}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Red Cards</p>
                        <p className="text-lg font-semibold text-gray-700">{currentStats.red_cards}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Engagement & Media */}
          <div className="space-y-8">
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
                  <p className="text-xs text-gray-400 mt-1">Agents will reach out when interested</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {engagementRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{request.agents?.name}</p>
                          <p className="text-sm text-gray-500">{request.agents?.agency || 'Independent Agent'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Requested: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptEngagement(request.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectEngagement(request.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Media */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                Recent Media
              </h2>
              {recentMedia.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No media uploaded yet</p>
                  <Link
                    href="/dashboard/profile"
                    className="inline-block mt-2 text-red-600 text-sm hover:underline"
                  >
                    Upload your first highlight →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {recentMedia.map((item) => (
                    <div key={item.id} className="relative group">
                      {item.type === 'video' ? (
                        <video
                          src={item.url}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt="Highlight"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {recentMedia.length > 0 && (
                <Link
                  href="/dashboard/profile?tab=media"
                  className="mt-4 block text-center text-sm text-purple-600 hover:underline"
                >
                  View All Media →
                </Link>
              )}
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-2">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Complete your profile to attract more agents
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Upload highlight videos to showcase your skills
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Update your stats regularly to stay relevant
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Respond quickly to engagement requests
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== AGENT DASHBOARD ==========
  if (userRole === 'agent') {
    return (
      <div>
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <UserCheck className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-white/80 mt-1">Discover and connect with elite football talent</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.agency || 'Independent Agent'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Players Discovered</p>
                <p className="text-2xl font-bold text-red-600">{recentActivity.length}</p>
              </div>
              <Users className="w-8 h-8 text-red-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Shortlist</p>
                <p className="text-2xl font-bold text-yellow-600">{recentActivity.length}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-200" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Requests</p>
                <p className="text-2xl font-bold text-green-600">{engagementRequests.length}</p>
              </div>
              <Activity className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/scouting" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-red-500">
            <Search className="w-12 h-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Scouting</h2>
            <p className="text-gray-600">Advanced search and talent evaluation</p>
            <div className="mt-4 flex items-center text-red-600">
              <span className="text-sm">Start Scouting</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link href="/dashboard/players" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-blue-500">
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Browse Players</h2>
            <p className="text-gray-600">Search and discover elite football talent</p>
            <div className="mt-4 flex items-center text-blue-600">
              <span className="text-sm">Browse Now</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          <Link href="/dashboard/shortlist" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-purple-500">
            <Star className="w-12 h-12 text-purple-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">My Shortlist</h2>
            <p className="text-gray-600">View your saved players</p>
            <div className="mt-4 flex items-center text-purple-600">
              <span className="text-sm">View Shortlist</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>

        {/* Shortlist Preview */}
        {recentActivity.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Recently Shortlisted
            </h2>
            <div className="space-y-3">
              {recentActivity.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{item.players?.name}</p>
                    <p className="text-sm text-gray-500">{item.players?.position} • Age {item.players?.age}</p>
                  </div>
                  <Link
                    href={`/dashboard/players/${item.player_id}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips Card */}
        <div className="mt-8 bg-gradient-to-r from-red-50 to-blue-50 rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-2">💡 Scout Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Use filters to find players matching your criteria
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Watch player highlight videos before reaching out
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Shortlist promising players for future reference
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Request engagement to start a conversation
            </li>
          </ul>
        </div>
      </div>
    )
  }

  return null
}