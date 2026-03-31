'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([])
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([])
  const [pendingEngagements, setPendingEngagements] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('players')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchData()
  }, [])

  const checkAdminAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!adminData) {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    await fetchData()
  }

  const fetchData = async () => {
    setLoading(true)

    const { data: pending } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (pending) setPendingPlayers(pending)

    const { data: approved } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (approved) setApprovedPlayers(approved)

    const { data: agentList } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (agentList) setAgents(agentList)

    const { data: adminList } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (adminList) setAdmins(adminList)

    const { data: engagements } = await supabase
      .from('engagements')
      .select('*')
      .eq('status', 'pending')
    
    if (engagements) setPendingEngagements(engagements)

    setLoading(false)
  }

  const handleApprovePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'approved' })
      .eq('id', playerId)

    if (error) {
      alert('Error approving player: ' + error.message)
    } else {
      alert('Player approved!')
      fetchData()
    }
  }

  const handleRejectPlayer = async (playerId: string) => {
    const { error } = await supabase
      .from('players')
      .update({ status: 'rejected' })
      .eq('id', playerId)

    if (error) {
      alert('Error rejecting player: ' + error.message)
    } else {
      alert('Player rejected')
      fetchData()
    }
  }

  const handleApproveEngagement = async (engagementId: string) => {
    const { error } = await supabase
      .from('engagements')
      .update({ status: 'approved' })
      .eq('id', engagementId)

    if (error) {
      alert('Error approving engagement: ' + error.message)
    } else {
      alert('Engagement approved!')
      fetchData()
    }
  }

  const handleRejectEngagement = async (engagementId: string) => {
    const { error } = await supabase
      .from('engagements')
      .update({ status: 'rejected' })
      .eq('id', engagementId)

    if (error) {
      alert('Error rejecting engagement: ' + error.message)
    } else {
      alert('Engagement rejected')
      fetchData()
    }
  }

  const handleAddAdmin = async (userId: string) => {
    const { error } = await supabase
      .from('admins')
      .insert({ user_id: userId, role: 'admin' })

    if (error) {
      alert('Error adding admin: ' + error.message)
    } else {
      alert('Admin added!')
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Manage players, agents, and engagements</p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Pending Players</p>
          <p className="text-3xl font-bold text-red-600">{pendingPlayers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Approved Players</p>
          <p className="text-3xl font-bold text-green-600">{approvedPlayers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Total Agents</p>
          <p className="text-3xl font-bold text-blue-600">{agents.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm">Pending Engagements</p>
          <p className="text-3xl font-bold text-purple-600">{pendingEngagements.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-black">
          <p className="text-gray-500 text-sm">Admins</p>
          <p className="text-3xl font-bold text-black">{admins.length}</p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8 flex-wrap">
          <button
            onClick={() => setActiveTab('players')}
            className={`pb-3 px-1 font-medium transition ${
              activeTab === 'players'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-500 hover:text-red-600'
            }`}
          >
            Pending Players ({pendingPlayers.length})
          </button>
          <button
            onClick={() => setActiveTab('engagements')}
            className={`pb-3 px-1 font-medium transition ${
              activeTab === 'engagements'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            Engagement Requests ({pendingEngagements.length})
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`pb-3 px-1 font-medium transition ${
              activeTab === 'agents'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            Agents List ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`pb-3 px-1 font-medium transition ${
              activeTab === 'admins'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Admins ({admins.length})
          </button>
        </nav>
      </div>

      {activeTab === 'players' && (
        <div className="space-y-4">
          {pendingPlayers.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No pending players to review
            </div>
          ) : (
            pendingPlayers.map((player) => (
              <div key={player.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{player.name}</h3>
                    <p className="text-gray-600 mt-1">
                      {player.position} • Age: {player.age} • {player.nationality || 'No nationality'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Applied: {new Date(player.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprovePlayer(player.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectPlayer(player.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'engagements' && (
        <div className="space-y-4">
          {pendingEngagements.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No pending engagement requests
            </div>
          ) : (
            pendingEngagements.map((engagement) => (
              <div key={engagement.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Engagement Request</h3>
                    <p className="text-gray-600 mt-1">
                      Agent ID: {engagement.agent_id.slice(0, 8)}...<br />
                      Player ID: {engagement.player_id.slice(0, 8)}...
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Requested: {new Date(engagement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveEngagement(engagement.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectEngagement(engagement.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="space-y-4">
          {agents.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No agents registered
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-gray-600 mt-1">{agent.agency || 'Independent Agent'}</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Joined: {new Date(agent.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddAdmin(agent.user_id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Make Admin
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'admins' && (
        <div className="space-y-4">
          {admins.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No admins
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-black">
                <h3 className="text-xl font-semibold text-gray-900">
                  Admin ID: {admin.user_id.slice(0, 8)}...
                </h3>
                <p className="text-gray-600 mt-1">Role: {admin.role}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Added: {new Date(admin.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}