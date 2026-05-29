'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, XCircle, Clock, Eye, 
  RefreshCw, Users, MessageSquare, FileText
} from 'lucide-react'

export default function AdminDashboard() {
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([])
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([])
  const [pendingEngagements, setPendingEngagements] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('engagements')
  const [selectedEngagement, setSelectedEngagement] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [restrictionLevel, setRestrictionLevel] = useState('none')
  
  // Agent management states
  const [showAgentDetailModal, setShowAgentDetailModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [agentDocuments, setAgentDocuments] = useState<any[]>([])
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([])
  const [showDocModal, setShowDocModal] = useState(false)
  const [agentsTabKey, setAgentsTabKey] = useState(0)
  
  // Player modal states
  const [showPlayerDetailModal, setShowPlayerDetailModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchData()
  }, [])

  // Refresh pending documents when modal closes
  useEffect(() => {
    if (!showAgentDetailModal) {
      fetchPendingDocuments()
    }
  }, [showAgentDetailModal])

  const checkAdminAndFetchData = async () => {
    try {
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
      await fetchPendingDocuments()
    } catch (err) {
      console.error('Error checking admin:', err)
      setLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)

    try {
      // Fetch pending players
      const { data: pending } = await supabase
        .from('players')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      setPendingPlayers(pending || [])

      // Fetch approved players
      const { data: approved } = await supabase
        .from('players')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10)
      setApprovedPlayers(approved || [])

      // Fetch agents with full details
      const { data: agentList } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })
      setAgents(agentList || [])

      // Fetch admins
      const { data: adminList } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false })
      setAdmins(adminList || [])

      // Fetch pending engagements
      const { data: engagements, error } = await supabase
        .from('engagements')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching engagements:', error)
        setPendingEngagements([])
      } else if (engagements && engagements.length > 0) {
        const engagementsWithDetails = []
        
        for (const engagement of engagements) {
          const { data: agent } = await supabase
            .from('agents')
            .select('name, agency')
            .eq('id', engagement.agent_id)
            .single()
          
          const { data: player } = await supabase
            .from('players')
            .select('name, position, age')
            .eq('id', engagement.player_id)
            .single()
          
          engagementsWithDetails.push({
            ...engagement,
            agent_name: agent?.name || 'Unknown Agent',
            agency_name: agent?.agency || 'Independent',
            player_name: player?.name || 'Unknown Player',
            player_position: player?.position || 'N/A',
            player_age: player?.age || 'N/A'
          })
        }
        
        setPendingEngagements(engagementsWithDetails)
      } else {
        setPendingEngagements([])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    }

    setLoading(false)
  }

  const fetchPlayerDetails = async (playerId: string) => {
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()
    
    if (player) {
      setSelectedPlayer(player)
      setShowPlayerDetailModal(true)
    }
  }

  const fetchPendingDocuments = async () => {
    const { data } = await supabase
      .from('agent_documents')
      .select(`
        *,
        agent:agents(id, name, agency, email, phone, verification_status)
      `)
      .eq('status', 'pending')
      .order('uploaded_at', { ascending: false })
    
    if (data) setPendingDocuments(data)
  }

  // ========== PLAYER APPROVAL WITH NOTIFICATION ==========
  const handleApprovePlayer = async (playerId: string) => {
    const { data: player } = await supabase
      .from('players')
      .select('name, email, user_id')
      .eq('id', playerId)
      .single()

    const { error } = await supabase
      .from('players')
      .update({ status: 'approved' })
      .eq('id', playerId)

    if (error) {
      alert('Error approving player: ' + error.message)
    } else if (player) {
      await supabase
        .from('email_notifications')
        .insert({
          user_id: player.user_id,
          recipient_email: player.email,
          recipient_type: 'player',
          subject: 'Your Profile Has Been Approved! 🎉',
          message: `Dear ${player.name},\n\nCongratulations! Your profile has been approved by the admin.\n\nYou can now:\n✅ Complete your profile with statistics\n✅ Upload highlight videos\n✅ Get discovered by agents and scouts\n\nLogin to your dashboard to get started!\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      
      alert('Player approved! Notification sent.')
      fetchData()
      setShowPlayerDetailModal(false)
    }
  }

  // ========== PLAYER REJECTION WITH NOTIFICATION ==========
  const handleRejectPlayer = async (playerId: string) => {
    const { data: player } = await supabase
      .from('players')
      .select('name, email, user_id')
      .eq('id', playerId)
      .single()

    const rejectionReason = prompt('Enter reason for rejection (optional):')

    const { error } = await supabase
      .from('players')
      .update({ status: 'rejected' })
      .eq('id', playerId)

    if (error) {
      alert('Error rejecting player: ' + error.message)
    } else if (player) {
      await supabase
        .from('email_notifications')
        .insert({
          user_id: player.user_id,
          recipient_email: player.email,
          recipient_type: 'player',
          subject: 'Profile Update Required',
          message: `Dear ${player.name},\n\nYour profile has been reviewed but requires changes.\n\n${rejectionReason ? `Reason: ${rejectionReason}\n\n` : ''}Please log in to update your profile and resubmit for approval.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      
      alert('Player rejected! Notification sent.')
      fetchData()
      setShowPlayerDetailModal(false)
    }
  }

  const handleRejectEngagement = async () => {
    if (!selectedEngagement) return

    if (!rejectionReason) {
      alert('Please provide a rejection reason')
      return
    }

    const [agentRes, playerRes] = await Promise.all([
      supabase.from('agents').select('name, email').eq('id', selectedEngagement.agent_id).single(),
      supabase.from('players').select('name, email').eq('id', selectedEngagement.player_id).single()
    ])

    const { error } = await supabase
      .from('engagements')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        admin_notes: adminNotes
      })
      .eq('id', selectedEngagement.id)

    if (error) {
      alert('Error rejecting engagement: ' + error.message)
    } else {
      if (agentRes.data) {
        await supabase
          .from('email_notifications')
          .insert({
            user_id: selectedEngagement.agent_id,
            recipient_email: agentRes.data.email,
            recipient_type: 'agent',
            subject: 'Engagement Request Update',
            message: `Dear ${agentRes.data.name},\n\nYour engagement request with ${playerRes.data?.name || 'the player'} has been rejected.\n\nReason: ${rejectionReason}\n\nBest regards,\nPlayerFynder Team`,
            status: 'pending',
            created_at: new Date().toISOString()
          })
      }
      if (playerRes.data) {
        await supabase
          .from('email_notifications')
          .insert({
            user_id: selectedEngagement.player_id,
            recipient_email: playerRes.data.email,
            recipient_type: 'player',
            subject: 'Engagement Request Update',
            message: `Dear ${playerRes.data.name},\n\nThe engagement request from ${agentRes.data?.name || 'the agent'} has been rejected.\n\nBest regards,\nPlayerFynder Team`,
            status: 'pending',
            created_at: new Date().toISOString()
          })
      }

      alert('Engagement rejected. Notifications sent.')
      setSelectedEngagement(null)
      setRejectionReason('')
      setAdminNotes('')
      fetchData()
    }
  }

  const handleApproveEngagement = async () => {
    if (!selectedEngagement) return

    const [agentRes, playerRes] = await Promise.all([
      supabase.from('agents').select('name, email').eq('id', selectedEngagement.agent_id).single(),
      supabase.from('players').select('name, email').eq('id', selectedEngagement.player_id).single()
    ])

    const { error } = await supabase
      .from('engagements')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes,
        restriction_level: restrictionLevel
      })
      .eq('id', selectedEngagement.id)

    if (error) {
      alert('Error approving engagement: ' + error.message)
      return
    }

    if (agentRes.data) {
      await supabase
        .from('email_notifications')
        .insert({
          user_id: selectedEngagement.agent_id,
          recipient_email: agentRes.data.email,
          recipient_type: 'agent',
          subject: 'Engagement Request Approved!',
          message: `Dear ${agentRes.data.name},\n\nYour engagement request with ${playerRes.data?.name || 'the player'} has been approved!\n\nYou can now send messages from your Messages page.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })
    }
    if (playerRes.data) {
      await supabase
        .from('email_notifications')
        .insert({
          user_id: selectedEngagement.player_id,
          recipient_email: playerRes.data.email,
          recipient_type: 'player',
          subject: 'Engagement Request Approved!',
          message: `Dear ${playerRes.data.name},\n\nThe engagement request from ${agentRes.data?.name || 'the agent'} has been approved!\n\nYou can now send messages from your Messages page.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })
    }

    const { error: convError } = await supabase
      .from('conversations')
      .insert({
        agent_id: selectedEngagement.agent_id,
        player_id: selectedEngagement.player_id,
        is_active: true,
        created_at: new Date().toISOString()
      })

    if (convError) {
      console.error('Error creating conversation:', convError)
      alert('Engagement approved! However, conversation creation failed.')
    } else {
      alert('Engagement approved! Notifications sent.')
    }

    setSelectedEngagement(null)
    setAdminNotes('')
    setRejectionReason('')
    fetchData()
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

  const handleApproveDocument = async (documentId: string, agentId: string) => {
    const [agentRes, docRes] = await Promise.all([
      supabase.from('agents').select('name, email').eq('id', agentId).single(),
      supabase.from('agent_documents').select('document_type').eq('id', documentId).single()
    ])

    const { error } = await supabase
      .from('agent_documents')
      .update({ status: 'verified', verified_at: new Date().toISOString() })
      .eq('id', documentId)

    if (error) {
      alert('Error approving document: ' + error.message)
    } else if (agentRes.data) {
      await supabase
        .from('email_notifications')
        .insert({
          user_id: agentId,
          recipient_email: agentRes.data.email,
          recipient_type: 'agent',
          subject: 'Document Verified ✓',
          message: `Dear ${agentRes.data.name},\n\nYour ${docRes.data?.document_type || 'document'} has been verified successfully!\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      
      alert('Document approved! Notification sent.')
      await fetchPendingDocuments()
      await fetchData()
      setAgentsTabKey(prev => prev + 1)
    }
  }

  const handleRejectDocument = async (documentId: string, agentId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    const [agentRes, docRes] = await Promise.all([
      supabase.from('agents').select('name, email').eq('id', agentId).single(),
      supabase.from('agent_documents').select('document_type').eq('id', documentId).single()
    ])

    const { error } = await supabase
      .from('agent_documents')
      .update({ status: 'rejected', rejection_reason: reason, verified_at: new Date().toISOString() })
      .eq('id', documentId)

    if (error) {
      alert('Error rejecting document: ' + error.message)
    } else if (agentRes.data) {
      await supabase
        .from('email_notifications')
        .insert({
          user_id: agentId,
          recipient_email: agentRes.data.email,
          recipient_type: 'agent',
          subject: 'Document Requires Attention',
          message: `Dear ${agentRes.data.name},\n\nYour ${docRes.data?.document_type || 'document'} has been rejected.\n\nReason: ${reason}\n\nPlease upload a new copy.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      
      alert('Document rejected. Notification sent.')
      await fetchPendingDocuments()
      setAgentsTabKey(prev => prev + 1)
    }
  }

  const handleVerifyAgent = async (agentId: string, status: string) => {
    const { error } = await supabase
      .from('agents')
      .update({ verification_status: status })
      .eq('id', agentId)

    if (error) {
      alert('Error updating agent verification: ' + error.message)
    } else {
      alert(`Agent ${status === 'verified' ? 'verified!' : 'updated.'}`)
      await fetchData()
      setAgentsTabKey(prev => prev + 1)
      if (showAgentDetailModal) {
        setSelectedAgent({ ...selectedAgent, verification_status: status })
      }
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
      <p className="text-gray-600 mb-8">Manage players, agents, and engagement requests</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8 flex-wrap">
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
          <Link
            href="/dashboard/admin/conversations"
            className="pb-3 px-1 font-medium transition text-gray-500 hover:text-purple-600"
          >
            Conversation Monitor
          </Link>
        </nav>
      </div>

      {/* Engagement Requests Tab */}
      {activeTab === 'engagements' && (
        <div className="space-y-4">
          {pendingEngagements.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No pending engagement requests</p>
              <p className="text-sm mt-2">When agents request to connect with players, they'll appear here.</p>
              <button 
                onClick={fetchData}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Refresh
              </button>
            </div>
          ) : (
            pendingEngagements.map((engagement) => (
              <div key={engagement.id} className="bg-white rounded-xl shadow overflow-hidden border-l-4 border-purple-500">
                <div className="p-6">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Agent</h4>
                          <p className="font-medium">{engagement.agent_name}</p>
                          <p className="text-sm text-gray-500">{engagement.agency_name}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Player</h4>
                          <p className="font-medium">{engagement.player_name}</p>
                          <p className="text-sm text-gray-500">{engagement.player_position} • Age: {engagement.player_age}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t text-sm text-gray-500">
                        Requested: {new Date(engagement.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEngagement(engagement)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Players Tab - With Popup Modal */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          {pendingPlayers.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No pending players to review
            </div>
          ) : (
            pendingPlayers.map((player) => (
              <div key={player.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {player.profile_picture ? (
                        <img src={player.profile_picture} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{player.name}</h3>
                        <p className="text-gray-600">{player.position} • Age: {player.age} • {player.nationality || 'No nationality'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      <span>Applied: {new Date(player.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => fetchPlayerDetails(player.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </button>
                    <button
                      onClick={() => handleApprovePlayer(player.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectPlayer(player.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div key={agentsTabKey} className="space-y-4">
          <button
            onClick={() => {
              fetchPendingDocuments()
              setShowDocModal(true)
            }}
            className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between hover:bg-yellow-100 transition"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Pending Document Verifications</span>
            </div>
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {pendingDocuments.length}
            </span>
          </button>

          {agents.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No agents registered
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl shadow overflow-hidden border-l-4 border-blue-500">
                <div className="p-6">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-semibold text-gray-900">{agent.name || 'Unnamed Agent'}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          agent.verification_status === 'verified' 
                            ? 'bg-green-100 text-green-700' 
                            : agent.verification_status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {agent.verification_status === 'verified' && <CheckCircle className="w-3 h-3" />}
                          {agent.verification_status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {agent.verification_status === 'pending' && <Clock className="w-3 h-3" />}
                          {agent.verification_status || 'pending'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{agent.agency || 'Independent Agent'}</p>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {agent.email && <p className="text-gray-500 truncate">📧 {agent.email}</p>}
                        {agent.phone && <p className="text-gray-500">📞 {agent.phone}</p>}
                        {agent.location && <p className="text-gray-500">📍 {agent.location}</p>}
                        {agent.license_number && <p className="text-gray-500">🔑 License: {agent.license_number}</p>}
                      </div>
                      <p className="text-gray-500 text-sm mt-2">
                        Joined: {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const { data: docs } = await supabase
                            .from('agent_documents')
                            .select('*')
                            .eq('agent_id', agent.id)
                            .order('uploaded_at', { ascending: false })
                          setAgentDocuments(docs || [])
                          setSelectedAgent(agent)
                          setShowAgentDetailModal(true)
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                      
                      {agent.verification_status !== 'verified' && (
                        <button
                          onClick={() => handleVerifyAgent(agent.id, 'verified')}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Verify
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleAddAdmin(agent.user_id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                      >
                        Make Admin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          {admins.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No admins
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="bg-white rounded-xl shadow p-6 border-l-4 border-black">
                <p>Admin ID: {admin.user_id.slice(0, 8)}...</p>
                <p>Role: {admin.role}</p>
                <p className="text-sm text-gray-500">Added: {new Date(admin.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Engagement Review Modal */}
      {selectedEngagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Review Engagement Request</h2>
                <button onClick={() => setSelectedEngagement(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Agent</h3>
                <p><strong>Name:</strong> {selectedEngagement.agent_name}</p>
                <p><strong>Agency:</strong> {selectedEngagement.agency_name}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Player</h3>
                <p><strong>Name:</strong> {selectedEngagement.player_name}</p>
                <p><strong>Position:</strong> {selectedEngagement.player_position}</p>
                <p><strong>Age:</strong> {selectedEngagement.player_age}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Restriction Level</label>
                <select value={restrictionLevel} onChange={(e) => setRestrictionLevel(e.target.value)} className="w-full p-2 border rounded">
                  <option value="none">None - Full access</option>
                  <option value="monitor">Monitor - Admin reviews messages</option>
                  <option value="restricted">Restricted - No contact info sharing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Admin Notes</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="w-full p-2 border rounded" placeholder="Internal notes..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Rejection Reason</label>
                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={2} className="w-full p-2 border rounded" placeholder="Required if rejecting" />
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setSelectedEngagement(null)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleRejectEngagement} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
              <button onClick={handleApproveEngagement} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {showPlayerDetailModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Player Details</h2>
                <button onClick={() => setShowPlayerDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Name</p><p className="font-medium">{selectedPlayer.name || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Position</p><p className="font-medium">{selectedPlayer.position || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Age</p><p className="font-medium">{selectedPlayer.age || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Nationality</p><p className="font-medium">{selectedPlayer.nationality || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Preferred Foot</p><p className="font-medium">{selectedPlayer.preferred_foot || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Jersey Number</p><p className="font-medium">{selectedPlayer.jersey_number || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Height / Weight</p><p className="font-medium">
                    {selectedPlayer.height_cm ? `${selectedPlayer.height_cm}cm` : '—'} / {selectedPlayer.weight_kg ? `${selectedPlayer.weight_kg}kg` : '—'}
                  </p></div>
                  <div><p className="text-gray-500">Current Club</p><p className="font-medium">{selectedPlayer.current_club || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Market Value</p><p className="font-medium">
                    {selectedPlayer.market_value ? `€${(selectedPlayer.market_value / 1000000).toFixed(1)}M` : '—'}
                  </p></div>
                </div>
              </div>

              {/* Performance Ratings */}
              {selectedPlayer.performance_ratings && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-green-900 mb-3">Performance Ratings</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(selectedPlayer.performance_ratings).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <p className="text-gray-500 capitalize">{key}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
                          </div>
                          <span className="text-xs font-semibold">{value}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {selectedPlayer.achievements && selectedPlayer.achievements.length > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <h3 className="font-semibold text-yellow-800 mb-3">🏆 Achievements</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlayer.achievements.map((achievement: string, idx: number) => (
                      <span key={idx} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                        {achievement}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedPlayer.bio && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Biography</h3>
                  <p className="text-sm text-gray-600">{selectedPlayer.bio}</p>
                </div>
              )}

              {/* Action Buttons inside modal */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleApprovePlayer(selectedPlayer.id)
                    setShowPlayerDetailModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Player
                </button>
                <button
                  onClick={() => {
                    handleRejectPlayer(selectedPlayer.id)
                    setShowPlayerDetailModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Detail Modal */}
      {showAgentDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Agent Details</h2>
                <button onClick={() => setShowAgentDetailModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-900">Basic Information</h3>
                  {selectedAgent.verification_status !== 'verified' && (
                    <button
                      onClick={() => handleVerifyAgent(selectedAgent.id, 'verified')}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Verify Agent
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Name</p><p className="font-medium">{selectedAgent.name || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Agency</p><p className="font-medium">{selectedAgent.agency || 'Independent'}</p></div>
                  <div><p className="text-gray-500">License Number</p><p className="font-medium">{selectedAgent.license_number || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Years Experience</p><p className="font-medium">{selectedAgent.years_experience || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Location</p><p className="font-medium">{selectedAgent.location || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Verification Status</p>
                    <select 
                      value={selectedAgent.verification_status || 'pending'}
                      onChange={(e) => handleVerifyAgent(selectedAgent.id, e.target.value)}
                      className="mt-1 px-2 py-1 border rounded text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-green-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedAgent.email || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Phone</p><p className="font-medium">{selectedAgent.phone || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Website</p><p className="font-medium">{selectedAgent.website || 'N/A'}</p></div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-purple-900 mb-3">Specializations & Languages</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Specializations</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.specializations?.length > 0 ? (
                        selectedAgent.specializations.map((spec: string) => (
                          <span key={spec} className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs">{spec}</span>
                        ))
                      ) : <p className="text-gray-400">None</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Languages</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAgent.languages?.length > 0 ? (
                        selectedAgent.languages.map((lang: string) => (
                          <span key={lang} className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">{lang}</span>
                        ))
                      ) : <p className="text-gray-400">None</p>}
                    </div>
                  </div>
                </div>
              </div>

              {selectedAgent.bio && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Bio</h3>
                  <p className="text-sm text-gray-600">{selectedAgent.bio}</p>
                </div>
              )}

              <div className="bg-orange-50 rounded-xl p-4">
                <h3 className="font-semibold text-orange-800 mb-3">Verification Documents</h3>
                {agentDocuments.length === 0 ? (
                  <p className="text-sm text-gray-500">No documents uploaded</p>
                ) : (
                  <div className="space-y-2">
                    {agentDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <div>
                          <p className="text-sm font-medium capitalize">{doc.document_type}</p>
                          <p className="text-xs text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                          {doc.description && <p className="text-xs text-gray-400">{doc.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View</a>
                          {doc.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveDocument(doc.id, selectedAgent.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Approve</button>
                              <button onClick={() => handleRejectDocument(doc.id, selectedAgent.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Reject</button>
                            </>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            doc.status === 'verified' ? 'bg-green-100 text-green-700' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}