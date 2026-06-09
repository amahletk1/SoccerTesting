'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, UserCheck, TrendingUp, Calendar, Activity, 
  Star, Eye, Award, Bell, ArrowRight, BarChart3, 
  ShieldCheck, UserCircle, Video, Target, CheckCircle,
  XCircle, MessageSquare, Upload, Clock, Search, Edit3,
  Heart, Trophy, Briefcase, DollarSign, Zap, Flame, UserPlus,
  Mail, FileText
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [engagementRequests, setEngagementRequests] = useState<any[]>([])
  const [recentMedia, setRecentMedia] = useState<any[]>([])
  const [profileViews, setProfileViews] = useState(0)
  const [shortlistCount, setShortlistCount] = useState(0)
  const [myAgent, setMyAgent] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  
  // Agent specific state
  const [agentStats, setAgentStats] = useState({
    shortlistedCount: 0,
    pendingEngagements: 0,
    successfulDeals: 0,
    profileViews: 0
  })
  const [recentPlayers, setRecentPlayers] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalEngagements: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    successRate: 0,
    monthlyData: [] as { month: string; count: number }[],
    topPlayers: [] as any[]
  })
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  
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

        // CHECK ADMIN FIRST
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

        // CHECK SCOUT SECOND
        const { data: scout } = await supabase
          .from('scouts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (scout) {
          window.location.href = '/dashboard/scout'
          return
        }

        // CHECK PLAYER THIRD
        const { data: player } = await supabase
          .from('players')
          .select('*, player_stats(*)')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (player) {
          setUserRole('player')
          setProfile(player)
          await fetchPlayerData(player.id)
          await fetchMyAgent(player.agent_id)
          setLoading(false)
          return
        }

        // CHECK AGENT FOURTH
        const { data: agent } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (agent) {
          setUserRole('agent')
          setProfile(agent)
          await fetchAgentData(agent.id)
          await fetchAnalyticsData(agent.id)
          await fetchRecommendations(agent.id)
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

  const fetchRecommendations = async (agentId: string) => {
    const { data: recsData } = await supabase
      .from('scout_recommendations')
      .select(`
        *,
        scout:scouts(id, name, club_name),
        player:players(id, name, position, age, nationality, profile_picture),
        report:scouting_reports(overall_rating, recommendation)
      `)
      .eq('agent_id', agentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    console.log('Recommendations fetched:', recsData)
    setRecommendations(recsData || [])
  }

  const handleAcceptRecommendation = async (recommendationId: string, playerId: string) => {
    await supabase
      .from('scout_recommendations')
      .update({ status: 'accepted', read_at: new Date().toISOString() })
      .eq('id', recommendationId)
    
    router.push(`/dashboard/players/${playerId}?engage=true`)
  }

  const handleDeclineRecommendation = async (recommendationId: string) => {
    await supabase
      .from('scout_recommendations')
      .update({ status: 'declined', read_at: new Date().toISOString() })
      .eq('id', recommendationId)
    
    setRecommendations(recommendations.filter(r => r.id !== recommendationId))
  }

  const fetchMyAgent = async (agentId: string) => {
    if (!agentId) return
    
    const { data: agent } = await supabase
      .from('agents')
      .select('id, name, agency, phone, email, location, years_experience, profile_picture, verification_status, specializations, languages, bio')
      .eq('id', agentId)
      .single()
    
    if (agent) setMyAgent(agent)
  }

  const fetchAnalyticsData = async (agentId: string) => {
    setLoadingAnalytics(true)
    
    // Get all engagements for this agent
    const { data: engagements } = await supabase
      .from('engagements')
      .select('*')
      .eq('agent_id', agentId)
    
    if (engagements && engagements.length > 0) {
      const approved = engagements.filter(e => e.status === 'approved').length
      const rejected = engagements.filter(e => e.status === 'rejected').length
      const pending = engagements.filter(e => e.status === 'pending').length
      const total = engagements.length
      
      const successRate = total > 0 ? Math.round((approved / total) * 100) : 0
      
      // Group by month for chart
      const monthlyMap = new Map<string, number>()
      engagements.forEach(e => {
        const month = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1)
      })
      
      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, count]) => ({ month, count }))
        .slice(-6)
      
      setAnalytics({
        totalEngagements: total,
        approvedCount: approved,
        rejectedCount: rejected,
        pendingCount: pending,
        successRate,
        monthlyData,
        topPlayers: []
      })
    } else {
      setAnalytics({
        totalEngagements: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        successRate: 0,
        monthlyData: [],
        topPlayers: []
      })
    }
    
    setLoadingAnalytics(false)
  }

  const fetchPlayerData = async (playerId: string) => {
    // Fetch engagement requests
    const { data: engagements } = await supabase
  .from('engagements')
  .select('*')  // ← Remove the join
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

  const fetchAgentData = async (agentId: string) => {
    // Get shortlist count
    const { count: shortlistCount } = await supabase
      .from('shortlists')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
    
    setAgentStats(prev => ({ ...prev, shortlistedCount: shortlistCount || 0 }))

    // Get pending engagements
    const { data: engagements, count: pendingCount } = await supabase
      .from('engagements')
      .select('*, players(name, position, profile_picture)')
      .eq('agent_id', agentId)
      .eq('status', 'pending')
    
    if (engagements) {
      setPendingRequests(engagements)
      setAgentStats(prev => ({ ...prev, pendingEngagements: pendingCount || 0 }))
    }

    // Get recent players (last 5 shortlisted)
    const { data: shortlisted } = await supabase
      .from('shortlists')
      .select('players(id, name, position, profile_picture, player_stats(goals, assists))')
      .eq('agent_id', agentId)
      .limit(5)
      .order('created_at', { ascending: false })
    
    if (shortlisted) {
      setRecentPlayers(shortlisted.map(s => s.players))
    }

    // Get successful deals count
    const { count: dealsCount } = await supabase
      .from('engagements')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'accepted')
    
    setAgentStats(prev => ({ ...prev, successfulDeals: dealsCount || 0, profileViews: Math.floor(Math.random() * 50) + 10 }))
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

  // ========== ENHANCED AGENT DASHBOARD WITH ANALYTICS ==========
  if (userRole === 'agent') {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 via-black to-red-600 rounded-2xl shadow-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
          <p className="text-white/80">Discover, evaluate, and connect with elite football talent</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center border-b-4 border-blue-500">
            <Star className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{agentStats.shortlistedCount}</p>
            <p className="text-xs text-gray-500">Players Shortlisted</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border-b-4 border-yellow-500">
            <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{agentStats.pendingEngagements}</p>
            <p className="text-xs text-gray-500">Pending Requests</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border-b-4 border-green-500">
            <Trophy className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{agentStats.successfulDeals}</p>
            <p className="text-xs text-gray-500">Successful Deals</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center border-b-4 border-purple-500">
            <Eye className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{agentStats.profileViews}</p>
            <p className="text-xs text-gray-500">Profile Views</p>
          </div>
        </div>

        {/* Scout Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Scout Recommendations</h2>
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {recommendations.length} new
              </span>
            </div>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {rec.player?.profile_picture ? (
                          <img src={rec.player.profile_picture} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-lg">{rec.player?.name || 'Unknown Player'}</h3>
                          <p className="text-sm text-gray-500">
                            {rec.player?.position || 'Unknown'} • Age {rec.player?.age || '?'} • {rec.player?.nationality || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Scouted by: {rec.scout?.name || 'Unknown Scout'} ({rec.scout?.club_name || 'Independent Scout'})
                      </p>
                      {rec.report?.recommendation && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          "{rec.report.recommendation}"
                        </p>
                      )}
                      {rec.message && (
                        <p className="text-xs text-blue-600 mt-1">
                          Scout note: {rec.message}
                        </p>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-yellow-700">
                          {rec.report?.overall_rating || '?'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4 pt-3 border-t">
                    <Link
                      href={`/dashboard/players/${rec.player_id}`}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View Player
                    </Link>
                    {rec.report_id && (
                      <Link
                        href={`/dashboard/scouting/reports/${rec.report_id}`}
                        className="text-sm text-green-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Full Report
                      </Link>
                    )}
                    <button
                      onClick={() => handleAcceptRecommendation(rec.id, rec.player_id)}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Request Engagement
                    </button>
                    <button
                      onClick={() => handleDeclineRecommendation(rec.id)}
                      className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If no recommendations */}
        {recommendations.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No scout recommendations yet</p>
            <p className="text-sm text-gray-400 mt-1">When scouts recommend players, they'll appear here</p>
          </div>
        )}

        {/* Analytics Row - Engagement Trend & Success Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Trend Chart */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Engagement Trend
              </h2>
              <span className="text-xs text-gray-400">Last 6 months</span>
            </div>
            
            {loadingAnalytics ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : analytics.monthlyData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No engagement data yet</p>
                <p className="text-xs mt-1">Start requesting engagements to see trends</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.monthlyData.map((item, idx) => {
                  const maxCount = Math.max(...analytics.monthlyData.map(d => d.count), 1)
                  const percentage = (item.count / maxCount) * 100
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.month}</span>
                        <span className="font-semibold text-blue-600">{item.count} requests</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Success Rate Donut */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              Success Rate
            </h2>
            
            {loadingAnalytics ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : analytics.totalEngagements === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No engagement data yet</p>
                <p className="text-xs mt-1">Complete engagements to see your success rate</p>
              </div>
            ) : (
              <div>
                {/* Donut Chart */}
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke="#22c55e" 
                      strokeWidth="12"
                      strokeDasharray={`${(analytics.successRate / 100) * 251.2} 251.2`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analytics.successRate}%</p>
                      <p className="text-xs text-gray-500">Success</p>
                    </div>
                  </div>
                </div>
                
                {/* Stats Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center pt-4 border-t">
                  <div>
                    <p className="text-xl font-bold text-green-600">{analytics.approvedCount}</p>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600">{analytics.rejectedCount}</p>
                    <p className="text-xs text-gray-500">Rejected</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-yellow-600">{analytics.pendingCount}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Players */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recently Added to Shortlist</h2>
              <Link href="/dashboard/shortlist" className="text-sm text-blue-600 hover:underline">
                View All →
              </Link>
            </div>
            {recentPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No players shortlisted yet</p>
                <Link href="/dashboard/players" className="text-blue-600 text-sm mt-2 inline-block">
                  Browse Players →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPlayers.map((player) => (
                  <Link key={player.id} href={`/dashboard/players/${player.id}`} className="block">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      {player.profile_picture ? (
                        <img src={player.profile_picture} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{player.name}</p>
                        <p className="text-sm text-gray-500">{player.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{player.player_stats?.[0]?.goals || 0} Goals</p>
                        <p className="text-xs text-gray-400">{player.player_stats?.[0]?.assists || 0} Assists</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Engagement Requests */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Pending Engagement Requests</h2>
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                {agentStats.pendingEngagements} pending
              </span>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No pending requests</p>
                <p className="text-xs text-gray-400 mt-1">Requests will appear here once sent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    {request.players?.profile_picture ? (
                      <img src={request.players.profile_picture} alt={request.players.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{request.players?.name}</p>
                      <p className="text-sm text-gray-500">{request.players?.position}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                        Awaiting Review
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/players" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow p-4 text-white hover:from-blue-600 hover:to-blue-700 transition">
            <Users className="w-8 h-8 mb-2 opacity-80" />
            <h3 className="font-semibold">Browse Players</h3>
            <p className="text-sm opacity-80">Discover new talent</p>
          </Link>
          <Link href="/dashboard/shortlist" className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow p-4 text-white hover:from-yellow-600 hover:to-yellow-700 transition">
            <Star className="w-8 h-8 mb-2 opacity-80" />
            <h3 className="font-semibold">View Shortlist</h3>
            <p className="text-sm opacity-80">Review saved players</p>
          </Link>
          <Link href="/dashboard/agent/profile" className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow p-4 text-white hover:from-purple-600 hover:to-purple-700 transition">
            <UserCircle className="w-8 h-8 mb-2 opacity-80" />
            <h3 className="font-semibold">Complete Profile</h3>
            <p className="text-sm opacity-80">Update your agency info</p>
          </Link>
        </div>
      </div>
    )
  }

  // ========== ENHANCED PLAYER DASHBOARD ==========
  if (userRole === 'player') {
    const currentStats = {
      matches_played: profile?.player_stats?.[0]?.matches_played || 0,
      goals: profile?.player_stats?.[0]?.goals || 0,
      assists: profile?.player_stats?.[0]?.assists || 0,
      clean_sheets: profile?.player_stats?.[0]?.clean_sheets || 0,
    }

    const profileFields = [
      profile?.name, profile?.age, profile?.position, 
      profile?.nationality, profile?.height_cm, profile?.weight_kg,
      profile?.profile_picture
    ]
    const completionPercentage = Math.round((profileFields.filter(f => f).length / 7) * 100)

    const recentActivity = [
      { id: 1, type: 'view', message: 'Your profile was viewed by 5 agents', time: '2 hours ago', icon: '👁️' },
      { id: 2, type: 'shortlist', message: 'Added to scout shortlist', time: '1 day ago', icon: '⭐' },
      { id: 3, type: 'engagement', message: 'New engagement request from ProScout', time: '3 days ago', icon: '💬' },
    ]

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
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
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {profile?.name?.split(' ')[0] || 'Player'}! 👋</h1>
              <p className="text-white/80 mt-1">Your football journey continues here</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.position || 'Position not set'}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Age: {profile?.age || '?'}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.nationality || 'Nationality not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-md p-4 text-center hover:shadow-lg transition group">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-red-600 transition">
              <TrendingUp className="w-6 h-6 text-red-600 group-hover:text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{currentStats.matches_played}</p>
            <p className="text-xs text-gray-500">Matches Played</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 text-center hover:shadow-lg transition group">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-yellow-600 transition">
              <Trophy className="w-6 h-6 text-yellow-600 group-hover:text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{currentStats.goals}</p>
            <p className="text-xs text-gray-500">Goals Scored</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 text-center hover:shadow-lg transition group">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
              <Heart className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{currentStats.assists}</p>
            <p className="text-xs text-gray-500">Assists</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-4 text-center hover:shadow-lg transition group">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 transition">
              <Eye className="w-6 h-6 text-purple-600 group-hover:text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{profileViews || 0}</p>
            <p className="text-xs text-gray-500">Profile Views</p>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-semibold text-gray-800">Profile Strength</h3>
              <p className="text-sm text-gray-500">Complete your profile to attract more scouts</p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-1">
                <span>{completionPercentage}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-red-500 to-blue-500 h-2.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
              </div>
            </div>
            <Link href="/dashboard/profile" className="text-sm text-red-600 hover:underline">
              Complete Profile →
            </Link>
          </div>
        </div>

        {/* My Agent Section */}
        {myAgent && (
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                My Agent
              </h2>
              <Link href={`/dashboard/agent/view/${myAgent.id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                View Full Profile
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-start gap-4">
              {myAgent.profile_picture ? (
                <img src={myAgent.profile_picture} alt={myAgent.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{myAgent.name}</h3>
                <p className="text-sm text-gray-500">{myAgent.agency || 'Independent Agent'}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-sm">
                  {myAgent.years_experience && <span className="text-gray-600">⭐ {myAgent.years_experience}+ years</span>}
                  {myAgent.location && <span className="text-gray-600">📍 {myAgent.location}</span>}
                  {myAgent.verification_status === 'verified' && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified Agent
                    </span>
                  )}
                </div>
                {myAgent.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {myAgent.specializations.slice(0, 3).map((spec: string) => (
                      <span key={spec} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{spec}</span>
                    ))}
                    {myAgent.specializations.length > 3 && (
                      <span className="text-xs text-gray-400">+{myAgent.specializations.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
              <Link href={`/dashboard/player/messages?agent=${myAgent.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message Agent
              </Link>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Performance Overview</h2>
                <Link href="/dashboard/profile?tab=stats" className="text-sm text-red-600 hover:underline">View Details →</Link>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{currentStats.matches_played}</p>
                  <p className="text-xs text-gray-500">Matches</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{currentStats.goals}</p>
                  <p className="text-xs text-gray-500">Goals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{currentStats.assists}</p>
                  <p className="text-xs text-gray-500">Assists</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Goal Contribution</p>
                    <p className="text-lg font-semibold text-gray-800">{currentStats.goals + currentStats.assists}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Clean Sheets</p>
                    <p className="text-lg font-semibold text-gray-800">{currentStats.clean_sheets}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{activity.message}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition group">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Edit Profile</p>
                    <p className="text-xs text-gray-500">Update your information</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition" />
                </Link>
                <Link href="/dashboard/profile?tab=media" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition group">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Upload Media</p>
                    <p className="text-xs text-gray-500">Add highlight videos</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition" />
                </Link>
                <Link href="/dashboard/player-view" className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition group">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">View Public Profile</p>
                    <p className="text-xs text-gray-500">See how scouts see you</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </div>

            {engagementRequests.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Engagement Requests</h2>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{engagementRequests.length} new</span>
                </div>
                <div className="space-y-3">
                  {engagementRequests.slice(0, 2).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800">{request.agents?.name}</p>
                        <p className="text-xs text-gray-500">{request.agents?.agency || 'Independent Agent'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">Accept</button>
                        <button className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-md p-6 border border-amber-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span> Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Complete your profile for more visibility</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Upload highlight videos to showcase skills</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Update stats after each match</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Respond quickly to engagement requests</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}