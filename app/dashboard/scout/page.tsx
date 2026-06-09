'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Target, FileText, Star, Clock, TrendingUp, Award, 
  Users, CheckCircle, Calendar, BarChart3, Eye, Zap, Trophy,
  Send, Building2, X
} from 'lucide-react'

export default function ScoutDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myReports, setMyReports] = useState<any[]>([])
  const [playersCount, setPlayersCount] = useState(0)
  const [scoutId, setScoutId] = useState<string>('')
  const [showRecommendModal, setShowRecommendModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [recommendMessage, setRecommendMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState({
    playersScouted: 0,
    reportsWritten: 0,
    averageRating: 0,
    thisMonthReports: 0,
    topRating: 0,
    topPlayer: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Get scout profile
        const { data: scout, error: scoutError } = await supabase
          .from('scouts')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (scoutError || !scout) {
          router.push('/dashboard')
          return
        }

        setProfile(scout)
        setScoutId(scout.id)

        // Get scout's reports
        const { data: reportsData } = await supabase
          .from('scouting_reports')
          .select(`
            *,
            player:players(id, name, position, age, nationality, profile_picture)
          `)
          .eq('scout_id', scout.id)
          .order('created_at', { ascending: false })

        if (reportsData) {
          setMyReports(reportsData)
          
          const thisMonth = new Date().getMonth()
          const thisMonthReports = reportsData.filter(r => 
            r.created_at && new Date(r.created_at).getMonth() === thisMonth
          )
          
          const avgRating = reportsData.length > 0 
            ? reportsData.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / reportsData.length
            : 0
          
          const topRated = reportsData.length > 0 
            ? reportsData.reduce((max, r) => 
                (r.overall_rating > (max.overall_rating || 0)) ? r : max, {})
            : { overall_rating: 0, player: null }
          
          setStats({
            playersScouted: reportsData.length,
            reportsWritten: reportsData.length,
            averageRating: Math.round(avgRating * 10) / 10,
            thisMonthReports: thisMonthReports.length,
            topRating: topRated.overall_rating || 0,
            topPlayer: topRated.player?.name || '',
          })
        }

        // Get total players count
        const { count: playersTotal } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')

        setPlayersCount(playersTotal || 0)

      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboard()
  }, [])

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('agents')
      .select('id, name, agency, specializations')
      .eq('verification_status', 'verified')
      .limit(30)
    if (data) setAgents(data)
  }

  const sendRecommendations = async () => {
    if (!selectedReport || selectedAgents.length === 0) return
    
    setSending(true)
    
    let successCount = 0
    for (const agentId of selectedAgents) {
      const { error } = await supabase
        .from('scout_recommendations')
        .insert({
          scout_id: scoutId,
          agent_id: agentId,
          player_id: selectedReport.player_id,
          report_id: selectedReport.id,
          message: recommendMessage,
          status: 'pending'
        })
      
      if (!error) successCount++
    }
    
    alert(`Recommended to ${successCount} agent(s)!`)
    setShowRecommendModal(false)
    setSelectedAgents([])
    setRecommendMessage('')
    setSending(false)
  }

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId))
    } else {
      setSelectedAgents([...selectedAgents, agentId])
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-green-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Target className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Scout Dashboard</h1>
            <p className="text-white/80 mt-1">Welcome back, {profile?.name?.split(' ')[0] || 'Scout'}!</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {profile?.club_name || 'Independent Scout'}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Players Scouted</p>
          <p className="text-2xl font-bold text-green-600">{stats.playersScouted}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Reports Written</p>
          <p className="text-2xl font-bold text-blue-600">{stats.reportsWritten}</p>
          <p className="text-xs text-blue-600 mt-1">+{stats.thisMonthReports} this month</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">Avg. Rating Given</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}/10</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm">Available Players</p>
          <p className="text-2xl font-bold text-purple-600">{playersCount}</p>
        </div>
      </div>

      {/* Top Performer Card */}
      {stats.topPlayer && stats.topRating > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold">🏆 Top Rated Discovery</h2>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.topPlayer}</p>
              <p className="text-sm text-gray-500">Your highest rated player</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{stats.topRating}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">/10 rating</p>
            </div>
          </div>
        </div>
      )}

      {/* My Recent Reports */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">My Scouting Reports</h2>
          </div>
          <Link href="/dashboard/scouting/reports" className="text-sm text-green-600 hover:underline">
            View all ({stats.reportsWritten}) →
          </Link>
        </div>
        
        {myReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No reports written yet</p>
            <Link href="/dashboard/scouting" className="text-sm text-green-600 hover:underline mt-2 inline-block">
              Start scouting →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myReports.slice(0, 5).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-semibold text-gray-900">{report.player?.name || 'Unknown Player'}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{report.player?.position || 'Position N/A'}</span>
                    <span>•</span>
                    <span>Age {report.player?.age || '?'}</span>
                    <span>•</span>
                    <span>{report.player?.nationality || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{report.overall_rating || '?'}/10</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReport(report)
                      fetchAgents()
                      setShowRecommendModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Recommend
                  </button>
                  <Link
                    href={`/dashboard/players/${report.player_id}`}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/scouting"
          className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow p-6 text-white hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <Target className="w-8 h-8 mb-2" />
              <h3 className="text-lg font-semibold">Find Players</h3>
              <p className="text-white/80 text-sm mt-1">Discover new talent</p>
            </div>
            <span className="text-3xl">→</span>
          </div>
        </Link>
        
        <Link
          href="/dashboard/scouting/reports"
          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow p-6 text-white hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <FileText className="w-8 h-8 mb-2" />
              <h3 className="text-lg font-semibold">My Reports</h3>
              <p className="text-white/80 text-sm mt-1">Manage your evaluations</p>
            </div>
            <span className="text-3xl">→</span>
          </div>
        </Link>
      </div>

      {/* Recommend Modal */}
      {showRecommendModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Recommend Player to Agents</h2>
                <button 
                  onClick={() => setShowRecommendModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Player</p>
                <p className="font-semibold text-lg">{selectedReport.player?.name}</p>
                <p className="text-sm text-gray-500">{selectedReport.player?.position} • Age {selectedReport.player?.age}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">Rating: {selectedReport.overall_rating}/10</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message to Agents (Optional)</label>
                <textarea
                  value={recommendMessage}
                  onChange={(e) => setRecommendMessage(e.target.value)}
                  placeholder="Add a personal note about why this player is worth considering..."
                  className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Agents ({selectedAgents.length} selected)
                </label>
                <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
                  {agents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Loading agents...</div>
                  ) : (
                    agents.map((agent) => (
                      <label key={agent.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => toggleAgent(agent.id)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          <p className="text-sm text-gray-500">{agent.agency || 'Independent Agent'}</p>
                        </div>
                        {agent.specializations && agent.specializations.length > 0 && (
                          <div className="flex gap-1">
                            {agent.specializations.slice(0, 2).map((spec: string) => (
                              <span key={spec} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowRecommendModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={sendRecommendations}
                disabled={selectedAgents.length === 0 || sending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : `Send to ${selectedAgents.length} Agent(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}