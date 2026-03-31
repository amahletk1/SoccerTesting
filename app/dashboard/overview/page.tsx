'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, Users, UserCheck, Activity, BarChart3, 
  Award, Calendar, Download, Eye, Star, Trophy 
} from 'lucide-react'

export default function OverviewPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalAgents: 0,
    totalEngagements: 0,
    approvedEngagements: 0,
    totalMedia: 0,
    pendingPlayers: 0,
    approvedPlayers: 0,
    rejectedPlayers: 0,
  })
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [pendingEngagements, setPendingEngagements] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    // Fetch counts
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
    
    const { count: approvedPlayersCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
    
    const { count: rejectedPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')
    
    const { data: engagements } = await supabase
      .from('engagements')
      .select('status')
    
    const { count: totalMedia } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })
    
    // Fetch approved players for list
    const { data: approved } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (approved) setApprovedPlayers(approved)

    // Fetch agents
    const { data: agentList } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (agentList) setAgents(agentList)

    // Fetch pending engagements
    const { data: engagementsList } = await supabase
      .from('engagements')
      .select('*')
      .eq('status', 'pending')
    
    if (engagementsList) setPendingEngagements(engagementsList)

    setStats({
      totalPlayers: totalPlayers || 0,
      totalAgents: totalAgents || 0,
      totalEngagements: engagements?.length || 0,
      approvedEngagements: engagements?.filter(e => e.status === 'approved').length || 0,
      totalMedia: totalMedia || 0,
      pendingPlayers: pendingPlayers || 0,
      approvedPlayers: approvedPlayersCount || 0,
      rejectedPlayers: rejectedPlayers || 0,
    })

    setLoading(false)
  }

  const handleExportData = async () => {
    const players = await supabase.from('players').select('*')
    const agents = await supabase.from('agents').select('*')
    const engagements = await supabase.from('engagements').select('*')
    
    const exportData = {
      players: players.data,
      agents: agents.data,
      engagements: engagements.data,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `playerfynder_analytics_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const approvalRate = stats.totalPlayers > 0 
    ? Math.round((stats.approvedPlayers / stats.totalPlayers) * 100) 
    : 0

  const engagementSuccessRate = stats.totalEngagements > 0
    ? Math.round((stats.approvedEngagements / stats.totalEngagements) * 100)
    : 0

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            Analytics Overview
          </h1>
          <p className="text-gray-600 mt-1">Platform performance and insights</p>
        </div>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
        <p className="text-white/80">Here's how your platform is performing.</p>
        <div className="mt-4">
          <div className="bg-white/20 rounded-lg px-3 py-1 inline-block">
            <span className="text-sm">📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Players</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalPlayers}</p>
            </div>
            <Users className="w-10 h-10 text-red-200" />
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-green-600">✓ {stats.approvedPlayers} approved</span>
            <span className="text-yellow-600">⏳ {stats.pendingPlayers} pending</span>
            <span className="text-red-600">✗ {stats.rejectedPlayers} rejected</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Agents</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAgents}</p>
            </div>
            <UserCheck className="w-10 h-10 text-blue-200" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Active scouting professionals
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Engagements</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalEngagements}</p>
            </div>
            <Activity className="w-10 h-10 text-green-200" />
          </div>
          <div className="mt-2 text-xs">
            <span className="text-green-600">✓ {stats.approvedEngagements} successful</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Media Uploads</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalMedia}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-200" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Player highlights & reels
          </div>
        </div>
      </div>

      {/* Growth & Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Player Growth Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            Player Approval Rate
          </h3>
          <div className="relative pt-4">
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="#dc2626" 
                    strokeWidth="12"
                    strokeDasharray={`${(approvalRate / 100) * 251.2} 251.2`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{approvalRate}%</p>
                    <p className="text-xs text-gray-500">Approval Rate</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Approved Players</span>
                  <span className="font-semibold text-green-600">{stats.approvedPlayers}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 rounded-full h-2" style={{ width: `${(stats.approvedPlayers / stats.totalPlayers) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pending Approval</span>
                  <span className="font-semibold text-yellow-600">{stats.pendingPlayers}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 rounded-full h-2" style={{ width: `${(stats.pendingPlayers / stats.totalPlayers) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Success Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Engagement Success Rate
          </h3>
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="12"
                  strokeDasharray={`${(engagementSuccessRate / 100) * 251.2} 251.2`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{engagementSuccessRate}%</p>
                  <p className="text-xs text-gray-500">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-around text-center pt-4 border-t">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEngagements}</p>
              <p className="text-xs text-gray-500">Total Requests</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.approvedEngagements}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{pendingEngagements.length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Players */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-600" />
            Recent Approved Players
          </h3>
          <div className="space-y-3">
            {approvedPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {player.profile_picture ? (
                    <img src={player.profile_picture} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{player.name}</p>
                    <p className="text-xs text-gray-500">{player.position} • Age {player.age}</p>
                  </div>
                </div>
                <span className="text-xs text-green-600">{new Date(player.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {approvedPlayers.length === 0 && (
              <p className="text-gray-500 text-center py-4">No approved players yet</p>
            )}
          </div>
        </div>

        {/* Top Agents */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            Recent Agents
          </h3>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.agency || 'Independent Agent'}</p>
                </div>
                <span className="text-xs text-blue-600">{new Date(agent.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-gray-500 text-center py-4">No agents yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-8 bg-gradient-to-r from-red-50 via-white to-blue-50 rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Platform Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-600">{stats.totalPlayers}</p>
            <p className="text-xs text-gray-500">Total Players</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalAgents}</p>
            <p className="text-xs text-gray-500">Total Agents</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.totalEngagements}</p>
            <p className="text-xs text-gray-500">Connections Made</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{stats.totalMedia}</p>
            <p className="text-xs text-gray-500">Media Uploads</p>
          </div>
        </div>
      </div>
    </div>
  )
}