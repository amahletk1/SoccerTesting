'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Users,
  MessageSquare,
  FileText,
  ShieldCheck,
  UserCheck,
  UserRound,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  BriefcaseBusiness,
  Award,
  CalendarDays,
  Activity,
  X,
  Check,
  ArrowUpRight,
  Sparkles,
  Shield,
} from 'lucide-react'

export default function AdminDashboard() {
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([])
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([])
  const [pendingEngagements, setPendingEngagements] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [scouts, setScouts] = useState<any[]>([])
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

  useEffect(() => {
    if (!showAgentDetailModal) {
      fetchPendingDocuments()
    }
  }, [showAgentDetailModal])

  const checkAdminAndFetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

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
      const { data: pending } = await supabase
        .from('players')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setPendingPlayers(pending || [])

      const { data: approved } = await supabase
        .from('players')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10)

      setApprovedPlayers(approved || [])

      const { data: agentList } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })

      setAgents(agentList || [])

      const { data: scoutList } = await supabase
        .from('scouts')
        .select('*')
        .order('created_at', { ascending: false })

      setScouts(scoutList || [])

      const { data: adminList } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false })

      setAdmins(adminList || [])

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
            player_age: player?.age || 'N/A',
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

  const handleApprovePlayer = async (playerId: string) => {
    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('name, email, user_id')
      .eq('id', playerId)
      .single()

    if (fetchError) {
      console.error('Error fetching player:', fetchError)
      alert('Error fetching player details: ' + fetchError.message)
      return
    }

    if (!player || !player.email) {
      console.error('Player or email not found:', player)
      alert('Player email not found')
      return
    }

    const { error } = await supabase
      .from('players')
      .update({ status: 'approved' })
      .eq('id', playerId)

    if (error) {
      alert('Error approving player: ' + error.message)
    } else {
      const { error: notifError } = await supabase
        .from('email_notifications')
        .insert({
          user_id: player.user_id,
          recipient_email: player.email,
          recipient_type: 'player',
          subject: 'Your Profile Has Been Approved! 🎉',
          message: `Dear ${player.name},\n\nCongratulations! Your profile has been approved by the admin.\n\nYou can now:\n✅ Complete your profile with statistics\n✅ Upload highlight videos\n✅ Get discovered by agents and scouts\n\nLogin to your dashboard to get started!\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString(),
        })

      if (notifError) {
        console.error('Notification error:', notifError)
        alert(
          'Player approved but notification failed to send: ' +
            notifError.message
        )
      } else {
        alert('Player approved! Notification sent.')
      }

      fetchData()
      setShowPlayerDetailModal(false)
    }
  }

  const handleRejectPlayer = async (playerId: string) => {
    const { data: player, error: fetchError } = await supabase
      .from('players')
      .select('name, email, user_id')
      .eq('id', playerId)
      .single()

    if (fetchError) {
      alert('Error fetching player: ' + fetchError.message)
      return
    }

    if (!player || !player.email) {
      alert('Player email not found')
      return
    }

    const rejectionReason = prompt('Enter reason for rejection (optional):')

    const { error } = await supabase
      .from('players')
      .update({ status: 'rejected' })
      .eq('id', playerId)

    if (error) {
      alert('Error rejecting player: ' + error.message)
    } else {
      await supabase.from('email_notifications').insert({
        user_id: player.user_id,
        recipient_email: player.email,
        recipient_type: 'player',
        subject: 'Profile Update Required',
        message: `Dear ${player.name},\n\nYour profile has been reviewed but requires changes.\n\n${
          rejectionReason ? `Reason: ${rejectionReason}\n\n` : ''
        }Please log in to update your profile and resubmit for approval.\n\nBest regards,\nPlayerFynder Team`,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

      alert('Player rejected! Notification sent.')
      fetchData()
      setShowPlayerDetailModal(false)
    }
  }

  const handleVerifyAgent = async (agentId: string, status: string) => {
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('name, email, user_id')
      .eq('id', agentId)
      .single()

    if (fetchError) {
      console.error('Error fetching agent:', fetchError)
      alert('Error fetching agent details: ' + fetchError.message)
      return
    }

    if (!agent || !agent.email) {
      alert('Agent email not found')
      return
    }

    const { error } = await supabase
      .from('agents')
      .update({ verification_status: status })
      .eq('id', agentId)

    if (error) {
      alert('Error updating agent verification: ' + error.message)
    } else {
      const { error: notifError } = await supabase
        .from('email_notifications')
        .insert({
          user_id: agent.user_id,
          recipient_email: agent.email,
          recipient_type: 'agent',
          subject:
            status === 'verified'
              ? 'Agent Verification Approved! 🎉'
              : 'Agent Verification Update',
          message:
            status === 'verified'
              ? `Dear ${agent.name},\n\nCongratulations! Your agent profile has been verified.\n\nYou can now fully use the platform to:\n✅ Discover and connect with players\n✅ Request engagements\n✅ Access all agent features\n\nBest regards,\nPlayerFynder Team`
              : `Dear ${agent.name},\n\nYour agent verification status has been updated to ${status.toUpperCase()}.\n\nIf you have any questions, please contact support.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString(),
        })

      if (notifError) {
        console.error('Notification error:', notifError)
        alert(
          `Agent ${
            status === 'verified' ? 'verified' : 'updated'
          }! But notification failed to send.`
        )
      } else {
        alert(
          `Agent ${
            status === 'verified' ? 'verified' : 'updated'
          }! Notification sent.`
        )
      }

      await fetchData()
      setAgentsTabKey((prev) => prev + 1)

      if (showAgentDetailModal) {
        setSelectedAgent({
          ...selectedAgent,
          verification_status: status,
        })
      }
    }
  }

  const handleVerifyScout = async (scoutId: string, status: string) => {
    console.log('Verifying scout:', scoutId, 'Status:', status)

    const { data: scout, error: fetchError } = await supabase
      .from('scouts')
      .select('name, email, user_id')
      .eq('id', scoutId)
      .single()

    if (fetchError) {
      console.error('Error fetching scout:', fetchError)
      alert('Error fetching scout details: ' + fetchError.message)
      return
    }

    console.log('Scout data:', scout)

    if (!scout) {
      alert('Scout not found')
      return
    }

    if (!scout.email) {
      console.error('Scout email is missing:', scout)
      alert('Scout email not found. Please update the scout record with an email.')
      return
    }

    const { error: updateError, data: updateData } = await supabase
      .from('scouts')
      .update({ verification_status: status })
      .eq('id', scoutId)
      .select()

    console.log('Update result:', { updateError, updateData })

    if (updateError) {
      alert('Error updating scout verification: ' + updateError.message)
      return
    }

    const notificationSubject =
      status === 'verified'
        ? 'Scout Account Verified! 🎉'
        : 'Scout Account Update'

    const notificationMessage =
      status === 'verified'
        ? `Dear ${scout.name},\n\nCongratulations! Your scout account has been verified.\n\nYou can now:\n✅ Browse and scout players\n✅ Create detailed scouting reports\n✅ Access all scout features\n\nBest regards,\nPlayerFynder Team`
        : `Dear ${scout.name},\n\nYour scout account status has been updated to ${status.toUpperCase()}.\n\nIf you have any questions, please contact support.\n\nBest regards,\nPlayerFynder Team`

    const { error: notifError, data: notifData } = await supabase
      .from('email_notifications')
      .insert({
        user_id: scout.user_id,
        recipient_email: scout.email,
        recipient_type: 'scout',
        subject: notificationSubject,
        message: notificationMessage,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()

    console.log('Notification result:', { notifError, notifData })

    if (notifError) {
      console.error('Notification error:', notifError)
      alert(
        `Scout ${
          status === 'verified' ? 'verified' : 'updated'
        }! But notification failed to send: ${notifError.message}`
      )
    } else {
      alert(
        `Scout ${
          status === 'verified' ? 'verified' : 'updated'
        }! Notification sent.`
      )
    }

    const { data: scoutList } = await supabase
      .from('scouts')
      .select('*')
      .order('created_at', { ascending: false })

    setScouts(scoutList || [])
  }

  const handleRejectEngagement = async () => {
    if (!selectedEngagement) return

    if (!rejectionReason) {
      alert('Please provide a rejection reason')
      return
    }

    const [agentRes, playerRes] = await Promise.all([
      supabase
        .from('agents')
        .select('name, email')
        .eq('id', selectedEngagement.agent_id)
        .single(),
      supabase
        .from('players')
        .select('name, email')
        .eq('id', selectedEngagement.player_id)
        .single(),
    ])

    const { error } = await supabase
      .from('engagements')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      })
      .eq('id', selectedEngagement.id)

    if (error) {
      alert('Error rejecting engagement: ' + error.message)
    } else {
      if (agentRes.data && agentRes.data.email) {
        await supabase.from('email_notifications').insert({
          user_id: selectedEngagement.agent_id,
          recipient_email: agentRes.data.email,
          recipient_type: 'agent',
          subject: 'Engagement Request Update',
          message: `Dear ${agentRes.data.name},\n\nYour engagement request with ${
            playerRes.data?.name || 'the player'
          } has been rejected.\n\nReason: ${rejectionReason}\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
      }

      if (playerRes.data && playerRes.data.email) {
        await supabase.from('email_notifications').insert({
          user_id: selectedEngagement.player_id,
          recipient_email: playerRes.data.email,
          recipient_type: 'player',
          subject: 'Engagement Request Update',
          message: `Dear ${playerRes.data.name},\n\nThe engagement request from ${
            agentRes.data?.name || 'the agent'
          } has been rejected.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString(),
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
      supabase
        .from('agents')
        .select('name, email')
        .eq('id', selectedEngagement.agent_id)
        .single(),
      supabase
        .from('players')
        .select('name, email')
        .eq('id', selectedEngagement.player_id)
        .single(),
    ])

    const { error } = await supabase
      .from('engagements')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes,
        restriction_level: restrictionLevel,
      })
      .eq('id', selectedEngagement.id)

    if (error) {
      alert('Error approving engagement: ' + error.message)
      return
    }

    if (agentRes.data && agentRes.data.email) {
      await supabase.from('email_notifications').insert({
        user_id: selectedEngagement.agent_id,
        recipient_email: agentRes.data.email,
        recipient_type: 'agent',
        subject: 'Engagement Request Approved!',
        message: `Dear ${agentRes.data.name},\n\nYour engagement request with ${
          playerRes.data?.name || 'the player'
        } has been approved!\n\nYou can now send messages from your Messages page.\n\nBest regards,\nPlayerFynder Team`,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    }

    if (playerRes.data && playerRes.data.email) {
      await supabase.from('email_notifications').insert({
        user_id: selectedEngagement.player_id,
        recipient_email: playerRes.data.email,
        recipient_type: 'player',
        subject: 'Engagement Request Approved!',
        message: `Dear ${playerRes.data.name},\n\nThe engagement request from ${
          agentRes.data?.name || 'the agent'
        } has been approved!\n\nYou can now send messages from your Messages page.\n\nBest regards,\nPlayerFynder Team`,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    }

    const { error: convError } = await supabase
      .from('conversations')
      .insert({
        agent_id: selectedEngagement.agent_id,
        player_id: selectedEngagement.player_id,
        is_active: true,
        created_at: new Date().toISOString(),
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

  const handleApproveDocument = async (
    documentId: string,
    agentId: string
  ) => {
    const [agentRes, docRes] = await Promise.all([
      supabase
        .from('agents')
        .select('name, email')
        .eq('id', agentId)
        .single(),
      supabase
        .from('agent_documents')
        .select('document_type')
        .eq('id', documentId)
        .single(),
    ])

    const { error } = await supabase
      .from('agent_documents')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (error) {
      alert('Error approving document: ' + error.message)
    } else if (agentRes.data && agentRes.data.email) {
      await supabase.from('email_notifications').insert({
        user_id: agentId,
        recipient_email: agentRes.data.email,
        recipient_type: 'agent',
        subject: 'Document Verified ✓',
        message: `Dear ${agentRes.data.name},\n\nYour ${
          docRes.data?.document_type || 'document'
        } has been verified successfully!\n\nBest regards,\nPlayerFynder Team`,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

      alert('Document approved! Notification sent.')
      await fetchPendingDocuments()
      await fetchData()
      setAgentsTabKey((prev) => prev + 1)
    }
  }

  const handleRejectDocument = async (
    documentId: string,
    agentId: string
  ) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    const [agentRes, docRes] = await Promise.all([
      supabase
        .from('agents')
        .select('name, email')
        .eq('id', agentId)
        .single(),
      supabase
        .from('agent_documents')
        .select('document_type')
        .eq('id', documentId)
        .single(),
    ])

    const { error } = await supabase
      .from('agent_documents')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        verified_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (error) {
      alert('Error rejecting document: ' + error.message)
    } else if (agentRes.data && agentRes.data.email) {
      await supabase.from('email_notifications').insert({
        user_id: agentId,
        recipient_email: agentRes.data.email,
        recipient_type: 'agent',
        subject: 'Document Requires Attention',
        message: `Dear ${agentRes.data.name},\n\nYour ${
          docRes.data?.document_type || 'document'
        } has been rejected.\n\nReason: ${reason}\n\nPlease upload a new copy.\n\nBest regards,\nPlayerFynder Team`,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

      alert('Document rejected. Notification sent.')
      await fetchPendingDocuments()
      setAgentsTabKey((prev) => prev + 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c0a] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-amber-400 animate-spin" />
            <div className="absolute inset-3 rounded-full bg-emerald-400/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <p className="mt-5 text-sm font-semibold text-white">
            Loading PlayerFynder Admin
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Preparing your control centre...
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const stats = [
    {
      label: 'Pending Players',
      value: pendingPlayers.length,
      icon: UserRound,
      accent: 'emerald',
      description: 'Awaiting review',
    },
    {
      label: 'Approved Players',
      value: approvedPlayers.length,
      icon: UserCheck,
      accent: 'gold',
      description: 'Recently approved',
    },
    {
      label: 'Total Agents',
      value: agents.length,
      icon: BriefcaseBusiness,
      accent: 'blue',
      description: 'Registered agents',
    },
    {
      label: 'Total Scouts',
      value: scouts.length,
      icon: ShieldCheck,
      accent: 'teal',
      description: 'Registered scouts',
    },
    {
      label: 'Engagements',
      value: pendingEngagements.length,
      icon: MessageSquare,
      accent: 'purple',
      description: 'Pending requests',
    },
  ]

  const tabs = [
    {
      key: 'engagements',
      label: 'Engagements',
      count: pendingEngagements.length,
      icon: MessageSquare,
    },
    {
      key: 'players',
      label: 'Players',
      count: pendingPlayers.length,
      icon: Users,
    },
    {
      key: 'agents',
      label: 'Agents',
      count: agents.length,
      icon: BriefcaseBusiness,
    },
    {
      key: 'scouts',
      label: 'Scouts',
      count: scouts.length,
      icon: ShieldCheck,
    },
    {
      key: 'admins',
      label: 'Admins',
      count: admins.length,
      icon: Shield,
    },
  ]

  const accentStyles: Record<string, string> = {
    emerald:
      'bg-emerald-400/10 text-emerald-400 border-emerald-400/15',
    gold:
      'bg-amber-400/10 text-amber-400 border-amber-400/15',
    blue:
      'bg-blue-400/10 text-blue-400 border-blue-400/15',
    teal:
      'bg-cyan-400/10 text-cyan-400 border-cyan-400/15',
    purple:
      'bg-purple-400/10 text-purple-400 border-purple-400/15',
  }

  return (
    <div className="min-h-screen bg-[#080c0a] text-white relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute top-[35%] -left-48 w-[450px] h-[450px] rounded-full bg-emerald-700/5 blur-[120px]" />
        <div className="absolute -bottom-48 right-[20%] w-[500px] h-[500px] rounded-full bg-amber-400/5 blur-[140px]" />
      </div>

      <main className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1410] shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(34,197,94,0.16),transparent_30%),radial-gradient(circle_at_70%_100%,rgba(212,175,55,0.08),transparent_28%)]" />

          <div className="absolute top-0 right-0 w-[360px] h-[360px] rounded-full border border-emerald-400/5 translate-x-1/3 -translate-y-1/3" />
          <div className="absolute top-8 right-12 w-[180px] h-[180px] rounded-full border border-amber-400/5" />

          <div className="relative px-5 sm:px-7 lg:px-9 py-7 md:py-9">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-7">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] sm:text-xs font-black tracking-[0.12em] text-emerald-300">
                    <Activity className="w-3.5 h-3.5" />
                    ADMIN CONTROL CENTRE
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                    SYSTEM ONLINE
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none">
                  PlayerFynder{' '}
                  <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 bg-clip-text text-transparent">
                    Admin
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm md:text-base leading-6 text-slate-400">
                  Manage players, agents, scouts and engagement requests from
                  your central scouting operations hub.
                </p>
              </div>

              <button
                onClick={fetchData}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-400/10 hover:border-emerald-400/20 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
                Refresh Data
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mt-5">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1410] p-4 md:p-5 hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-400/5 blur-2xl group-hover:bg-emerald-400/10 transition-colors" />

                <div className="relative flex items-start justify-between">
                  <div
                    className={`w-10 h-10 md:w-11 md:h-11 rounded-xl border flex items-center justify-center ${accentStyles[stat.accent]}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                </div>

                <p className="relative mt-5 text-[10px] md:text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                  {stat.label}
                </p>

                <p className="relative mt-1 text-2xl md:text-3xl font-black tracking-tight text-white">
                  {stat.value}
                </p>

                <p className="relative mt-1 text-[11px] text-slate-600">
                  {stat.description}
                </p>
              </div>
            )
          })}
        </section>

        {/* Navigation */}
        <section className="mt-5 rounded-2xl border border-white/[0.08] bg-[#0d1410] p-2 shadow-xl">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-400 text-[#06100a] shadow-lg shadow-emerald-400/10'
                      : 'text-slate-500 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}

                  <span
                    className={`min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-[#06100a]/15 text-[#06100a]'
                        : 'bg-white/[0.06] text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}

            <Link
              href="/dashboard/admin/conversations"
              className="shrink-0 ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-500 hover:text-white hover:bg-purple-400/10 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">
                Conversation Monitor
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Engagement Requests */}
        {activeTab === 'engagements' && (
          <div className="space-y-4 mt-5">
            {pendingEngagements.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1410] p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-400/10 border border-purple-400/10 flex items-center justify-center mb-5">
                  <MessageSquare className="w-7 h-7 text-purple-400" />
                </div>

                <h3 className="text-lg font-black text-white">
                  No pending engagement requests
                </h3>

                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-6">
                  When agents request to connect with players, their requests
                  will appear here for administrative review.
                </p>

                <button
                  onClick={fetchData}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-300 text-sm font-bold hover:bg-purple-500/20 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            ) : (
              pendingEngagements.map((engagement) => (
                <div
                  key={engagement.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1410] hover:border-purple-400/20 hover:shadow-2xl hover:shadow-purple-950/10 transition-all"
                >
                  <div className="h-px bg-gradient-to-r from-purple-500 via-fuchsia-400 to-emerald-400" />

                  <div className="p-5 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/15 text-[10px] font-black uppercase tracking-wide">
                            <Clock className="w-3 h-3" />
                            Awaiting Review
                          </span>

                          <span className="text-xs text-slate-600">
                            Requested{' '}
                            {new Date(
                              engagement.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 mb-3">
                              <BriefcaseBusiness className="w-3.5 h-3.5 text-blue-400" />
                              Agent
                            </div>

                            <p className="font-bold text-white">
                              {engagement.agent_name}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                              {engagement.agency_name}
                            </p>
                          </div>

                          <div className="rounded-xl bg-emerald-400/[0.035] border border-emerald-400/10 p-4">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-500 mb-3">
                              <UserRound className="w-3.5 h-3.5" />
                              Player
                            </div>

                            <p className="font-bold text-white">
                              {engagement.player_name}
                            </p>

                            <p className="text-sm text-slate-500 mt-1">
                              {engagement.player_position} • Age:{' '}
                              {engagement.player_age}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedEngagement(engagement)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#08100b] text-sm font-black hover:bg-emerald-300 transition-all shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        Review Request
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Players */}
        {activeTab === 'players' && (
          <div className="space-y-4 mt-5">
            {pendingPlayers.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1410] p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/10 flex items-center justify-center mb-5">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>

                <h3 className="text-lg font-black text-white">
                  All player applications are clear
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  There are currently no players waiting for approval.
                </p>
              </div>
            ) : (
              pendingPlayers.map((player) => (
                <div
                  key={player.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1410] hover:border-emerald-400/15 hover:shadow-xl transition-all"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-amber-400" />

                  <div className="p-5 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex items-center gap-4">
                        {player.profile_picture ? (
                          <img
                            src={player.profile_picture}
                            alt={player.name}
                            className="w-16 h-16 rounded-2xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-white/[0.05] rounded-2xl flex items-center justify-center border border-white/[0.06]">
                            <Users className="w-7 h-7 text-slate-600" />
                          </div>
                        )}

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-white">
                              {player.name}
                            </h3>

                            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/15 text-amber-300 text-[10px] font-black uppercase">
                              Pending
                            </span>
                          </div>

                          <p className="text-sm text-slate-500 mt-1">
                            {player.position} • Age: {player.age} •{' '}
                            {player.nationality || 'No nationality'}
                          </p>

                          <p className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Applied{' '}
                            {new Date(
                              player.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fetchPlayerDetails(player.id)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm font-bold hover:bg-white/[0.09] transition"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                          View Profile
                        </button>

                        <button
                          onClick={() => handleApprovePlayer(player.id)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#06100a] text-sm font-black hover:bg-emerald-400 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>

                        <button
                          onClick={() => handleRejectPlayer(player.id)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-400/15 text-red-300 text-sm font-bold hover:bg-red-500/20 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Agents */}
        {activeTab === 'agents' && (
          <div key={agentsTabKey} className="space-y-4 mt-5">
            <button
              onClick={() => {
                fetchPendingDocuments()
                setShowDocModal(true)
              }}
              className="w-full group relative overflow-hidden bg-amber-400/[0.04] border border-amber-400/15 rounded-2xl p-4 flex items-center justify-between hover:bg-amber-400/[0.07] hover:border-amber-400/25 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>

                <div className="text-left">
                  <p className="text-sm font-black text-amber-200">
                    Pending Document Verifications
                  </p>

                  <p className="text-xs text-amber-400/50 mt-0.5">
                    Review submitted agent documents
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="min-w-8 h-8 px-2 rounded-full bg-amber-400 text-[#171205] text-xs font-black flex items-center justify-center">
                  {pendingDocuments.length}
                </span>

                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {agents.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1410] p-12 text-center">
                <BriefcaseBusiness className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                <p className="font-semibold text-slate-400">
                  No agents registered
                </p>
              </div>
            ) : (
              agents.map((agent) => (
                <div
                  key={agent.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1410] hover:border-blue-400/15 hover:shadow-xl transition-all"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500" />

                  <div className="p-5 md:p-6">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-blue-400/10 border border-blue-400/10 flex items-center justify-center">
                            <BriefcaseBusiness className="w-5 h-5 text-blue-400" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-white">
                                {agent.name || 'Unnamed Agent'}
                              </h3>

                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  agent.verification_status === 'verified'
                                    ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/15'
                                    : agent.verification_status === 'rejected'
                                    ? 'bg-red-400/10 text-red-300 border border-red-400/15'
                                    : 'bg-amber-400/10 text-amber-300 border border-amber-400/15'
                                }`}
                              >
                                {agent.verification_status === 'verified' ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : agent.verification_status ===
                                  'rejected' ? (
                                  <XCircle className="w-3 h-3" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}

                                {agent.verification_status || 'pending'}
                              </span>
                            </div>

                            <p className="text-sm text-slate-500 mt-0.5">
                              {agent.agency || 'Independent Agent'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
                          {agent.email && (
                            <div className="flex items-center gap-2 rounded-lg bg-white/[0.025] border border-white/[0.05] px-3 py-2 text-xs text-slate-500 min-w-0">
                              <Mail className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              <span className="truncate">{agent.email}</span>
                            </div>
                          )}

                          {agent.phone && (
                            <div className="flex items-center gap-2 rounded-lg bg-white/[0.025] border border-white/[0.05] px-3 py-2 text-xs text-slate-500">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              <span>{agent.phone}</span>
                            </div>
                          )}

                          {agent.location && (
                            <div className="flex items-center gap-2 rounded-lg bg-white/[0.025] border border-white/[0.05] px-3 py-2 text-xs text-slate-500">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              <span>{agent.location}</span>
                            </div>
                          )}

                          {agent.license_number && (
                            <div className="flex items-center gap-2 rounded-lg bg-white/[0.025] border border-white/[0.05] px-3 py-2 text-xs text-slate-500">
                              <Award className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              <span className="truncate">
                                {agent.license_number}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="flex items-center gap-1.5 text-xs text-slate-600 mt-3">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Joined{' '}
                          {new Date(
                            agent.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button
                          onClick={async () => {
                            const { data: docs } = await supabase
                              .from('agent_documents')
                              .select('*')
                              .eq('agent_id', agent.id)
                              .order('uploaded_at', {
                                ascending: false,
                              })

                            setAgentDocuments(docs || [])
                            setSelectedAgent(agent)
                            setShowAgentDetailModal(true)
                          }}
                          className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.05] border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/[0.09] transition"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                          Details
                        </button>

                        {agent.verification_status !== 'verified' && (
                          <button
                            onClick={() =>
                              handleVerifyAgent(agent.id, 'verified')
                            }
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-500 text-[#06100a] rounded-xl text-sm font-black hover:bg-emerald-400 transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Verify
                          </button>
                        )}

                        <button
                          onClick={() => handleAddAdmin(agent.user_id)}
                          className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.05] border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/[0.09] transition"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
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

        {/* Scouts */}
        {activeTab === 'scouts' && (
          <div className="space-y-4 mt-5">
            {scouts.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1410] p-12 text-center">
                <ShieldCheck className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                <p className="font-semibold text-slate-400">
                  No scouts registered
                </p>
              </div>
            ) : (
              scouts.map((scout) => (
                <div
                  key={scout.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1410] hover:border-cyan-400/15 hover:shadow-xl transition-all"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-emerald-400" />

                  <div className="p-5 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/10 flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6 text-cyan-400" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-white">
                              {scout.name || 'Unnamed Scout'}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                scout.verification_status === 'verified'
                                  ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/15'
                                  : scout.verification_status === 'rejected'
                                  ? 'bg-red-400/10 text-red-300 border border-red-400/15'
                                  : 'bg-amber-400/10 text-amber-300 border border-amber-400/15'
                              }`}
                            >
                              {scout.verification_status === 'verified' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : scout.verification_status ===
                                'rejected' ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}

                              {scout.verification_status || 'pending'}
                            </span>
                          </div>

                          <p className="text-sm text-slate-500 mt-1">
                            {scout.club_name || 'Independent Scout'}
                          </p>

                          {scout.email && (
                            <p className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                              <Mail className="w-3.5 h-3.5" />
                              {scout.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="hidden md:flex items-center gap-1.5 text-xs text-slate-600">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {new Date(
                            scout.created_at
                          ).toLocaleDateString()}
                        </p>

                        {scout.verification_status !== 'verified' && (
                          <button
                            onClick={() =>
                              handleVerifyScout(scout.id, 'verified')
                            }
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-[#06100a] rounded-xl text-sm font-black hover:bg-emerald-400 transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Verify Scout
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Admins */}
        {activeTab === 'admins' && (
          <div className="space-y-4 mt-5">
            {admins.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1410] p-12 text-center">
                <Shield className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                <p className="font-semibold text-slate-400">No admins</p>
              </div>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1410]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-400 to-slate-700" />

                  <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
                        <Shield className="w-5 h-5 text-slate-300" />
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                          Admin ID
                        </p>

                        <p className="font-bold text-white">
                          {admin.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                          Role
                        </p>

                        <p className="text-sm font-semibold text-slate-300">
                          {admin.role}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                          Added
                        </p>

                        <p className="text-sm font-semibold text-slate-300">
                          {new Date(
                            admin.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/15 text-emerald-300 text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Engagement Review Modal */}
      {selectedEngagement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1410] border border-white/10 rounded-[28px] shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-[#0d1410]/95 backdrop-blur border-b border-white/[0.08] px-6 py-5">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.7)]" />

                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-purple-400">
                      Engagement Review
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-white">
                    Review Engagement Request
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedEngagement(null)}
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-500 flex items-center justify-center hover:bg-white/10 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-blue-400/[0.05] border border-blue-400/10 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-400/10 flex items-center justify-center">
                      <BriefcaseBusiness className="w-4 h-4 text-blue-400" />
                    </div>

                    <h3 className="font-bold text-white">Agent</h3>
                  </div>

                  <p className="text-[10px] text-blue-400/60 uppercase font-black tracking-wider">
                    Name
                  </p>

                  <p className="font-bold text-white mt-1">
                    {selectedEngagement.agent_name}
                  </p>

                  <p className="text-[10px] text-blue-400/60 uppercase font-black tracking-wider mt-4">
                    Agency
                  </p>

                  <p className="font-semibold text-slate-300 mt-1">
                    {selectedEngagement.agency_name}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-400/[0.05] border border-emerald-400/10 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                      <UserRound className="w-4 h-4 text-emerald-400" />
                    </div>

                    <h3 className="font-bold text-white">Player</h3>
                  </div>

                  <p className="text-[10px] text-emerald-400/60 uppercase font-black tracking-wider">
                    Name
                  </p>

                  <p className="font-bold text-white mt-1">
                    {selectedEngagement.player_name}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-[10px] text-emerald-400/60 uppercase font-black tracking-wider">
                        Position
                      </p>

                      <p className="font-semibold text-slate-300 mt-1">
                        {selectedEngagement.player_position}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-emerald-400/60 uppercase font-black tracking-wider">
                        Age
                      </p>

                      <p className="font-semibold text-slate-300 mt-1">
                        {selectedEngagement.player_age}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedEngagement.agent_message && (
                <div className="rounded-2xl bg-purple-400/[0.05] border border-purple-400/10 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-purple-400/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-bold text-white">
                        Agent&apos;s Message
                      </h4>

                      <p className="text-sm leading-6 text-slate-400 italic mt-2">
                        &quot;{selectedEngagement.agent_message}&quot;
                      </p>

                      <p className="text-[11px] text-slate-600 mt-3">
                        {selectedEngagement.message_character_count ||
                          selectedEngagement.agent_message.length}{' '}
                        characters
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Restriction Level
                  </label>

                  <select
                    value={restrictionLevel}
                    onChange={(e) =>
                      setRestrictionLevel(e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-medium text-slate-300 outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/30"
                  >
                    <option value="none" className="bg-[#0d1410]">
                      None - Full access
                    </option>

                    <option value="monitor" className="bg-[#0d1410]">
                      Monitor - Admin reviews messages
                    </option>

                    <option value="restricted" className="bg-[#0d1410]">
                      Restricted - No contact info sharing
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Admin Notes
                  </label>

                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/30 resize-none"
                    placeholder="Internal notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Rejection Reason
                  </label>

                  <textarea
                    value={rejectionReason}
                    onChange={(e) =>
                      setRejectionReason(e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400/30 resize-none"
                    placeholder="Required if rejecting"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-white/[0.08] bg-[#0a100d]/95 backdrop-blur px-6 py-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setSelectedEngagement(null)}
                className="px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 text-sm font-semibold hover:bg-white/[0.07] transition"
              >
                Cancel
              </button>

              <button
                onClick={handleRejectEngagement}
                className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-400/15 text-red-300 text-sm font-bold hover:bg-red-500/20 transition inline-flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>

              <button
                onClick={handleApproveEngagement}
                className="px-5 py-3 rounded-xl bg-emerald-500 text-[#06100a] text-sm font-black hover:bg-emerald-400 transition inline-flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {showPlayerDetailModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1410] border border-white/10 rounded-[28px] shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 z-20 bg-[#0d1410]/95 backdrop-blur border-b border-white/[0.08] px-6 py-5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-400">
                    Player Review
                  </span>

                  <h2 className="text-xl font-black text-white mt-1">
                    Player Details
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setShowPlayerDetailModal(false)
                  }
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-500 flex items-center justify-center hover:bg-white/10 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Player Identity */}
              <div className="relative overflow-hidden rounded-2xl bg-[#080d0a] border border-white/[0.08] p-6">
                <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-amber-400/5 blur-3xl" />

                <div className="relative flex items-center gap-4">
                  {selectedPlayer.profile_picture ? (
                    <img
                      src={selectedPlayer.profile_picture}
                      alt={selectedPlayer.name}
                      className="w-20 h-20 rounded-2xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <Users className="w-9 h-9 text-slate-600" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {selectedPlayer.name || 'N/A'}
                    </h3>

                    <p className="text-slate-500 mt-1">
                      {selectedPlayer.position || 'N/A'} •{' '}
                      {selectedPlayer.nationality || 'Nationality N/A'}
                    </p>

                    <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/15 text-amber-300 text-[10px] font-black uppercase">
                      <Clock className="w-3 h-3" />
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-blue-400/10 flex items-center justify-center">
                    <UserRound className="w-4 h-4 text-blue-400" />
                  </div>

                  <h3 className="font-bold text-white">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {[
                    ['Name', selectedPlayer.name],
                    ['Position', selectedPlayer.position],
                    ['Age', selectedPlayer.age],
                    ['Nationality', selectedPlayer.nationality],
                    ['Preferred Foot', selectedPlayer.preferred_foot],
                    ['Jersey Number', selectedPlayer.jersey_number],
                    [
                      'Height / Weight',
                      `${
                        selectedPlayer.height_cm
                          ? `${selectedPlayer.height_cm}cm`
                          : '—'
                      } / ${
                        selectedPlayer.weight_kg
                          ? `${selectedPlayer.weight_kg}kg`
                          : '—'
                      }`,
                    ],
                    ['Current Club', selectedPlayer.current_club],
                    [
                      'Market Value',
                      selectedPlayer.market_value
                        ? `€${(
                            selectedPlayer.market_value / 1000000
                          ).toFixed(1)}M`
                        : '—',
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] uppercase tracking-wider font-black text-slate-600">
                        {label}
                      </p>

                      <p className="font-semibold text-slate-300 mt-1">
                        {value || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance */}
              {selectedPlayer.performance_ratings && (
                <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-emerald-400" />
                    </div>

                    <h3 className="font-bold text-white">
                      Performance Ratings
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-5">
                    {Object.entries(
                      selectedPlayer.performance_ratings
                    ).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-semibold text-slate-300 capitalize">
                            {key}
                          </p>

                          <span className="text-xs font-black text-emerald-400">
                            {value}/100
                          </span>
                        </div>

                        <div className="h-1.5 bg-emerald-400/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-300 rounded-full transition-all"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {selectedPlayer.achievements &&
                selectedPlayer.achievements.length > 0 && (
                  <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.035] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
                        <Award className="w-4 h-4 text-amber-400" />
                      </div>

                      <h3 className="font-bold text-white">
                        Achievements
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedPlayer.achievements.map(
                        (achievement: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-white/[0.04] border border-amber-400/10 text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold"
                          >
                            {achievement}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Bio */}
              {selectedPlayer.bio && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-white">
                      Biography
                    </h3>
                  </div>

                  <p className="text-sm text-slate-400 leading-6">
                    {selectedPlayer.bio}
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    handleApprovePlayer(selectedPlayer.id)
                    setShowPlayerDetailModal(false)
                  }}
                  className="px-5 py-3 rounded-xl bg-emerald-500 text-[#06100a] font-black text-sm hover:bg-emerald-400 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Player
                </button>

                <button
                  onClick={() => {
                    handleRejectPlayer(selectedPlayer.id)
                    setShowPlayerDetailModal(false)
                  }}
                  className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-400/15 text-red-300 font-bold text-sm hover:bg-red-500/20 transition flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1410] border border-white/10 rounded-[28px] shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 z-20 bg-[#0d1410]/95 backdrop-blur border-b border-white/[0.08] px-6 py-5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-400">
                    Agent Verification
                  </span>

                  <h2 className="text-xl font-black text-white mt-1">
                    Agent Details
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setShowAgentDetailModal(false)
                  }
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-500 flex items-center justify-center hover:bg-white/10 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Agent header */}
              <div className="rounded-2xl bg-[#080d0a] border border-white/[0.08] p-6 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-400/10 border border-blue-400/15 flex items-center justify-center">
                      <BriefcaseBusiness className="w-7 h-7 text-blue-400" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">
                        {selectedAgent.name || 'N/A'}
                      </h3>

                      <p className="text-slate-500 mt-1">
                        {selectedAgent.agency || 'Independent'}
                      </p>
                    </div>
                  </div>

                  {selectedAgent.verification_status !== 'verified' && (
                    <button
                      onClick={() =>
                        handleVerifyAgent(
                          selectedAgent.id,
                          'verified'
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-[#06100a] text-sm font-black hover:bg-emerald-400 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify Agent
                    </button>
                  )}
                </div>
              </div>

              {/* Basic */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-400/10 flex items-center justify-center">
                      <UserRound className="w-4 h-4 text-blue-400" />
                    </div>

                    <h3 className="font-bold text-white">
                      Basic Information
                    </h3>
                  </div>

                  <select
                    value={
                      selectedAgent.verification_status || 'pending'
                    }
                    onChange={(e) =>
                      handleVerifyAgent(
                        selectedAgent.id,
                        e.target.value
                      )
                    }
                    className="px-3 py-2 border border-white/10 rounded-xl text-xs font-semibold bg-white/[0.04] text-slate-300 outline-none focus:ring-2 focus:ring-emerald-400/30"
                  >
                    <option value="pending" className="bg-[#0d1410]">
                      Pending
                    </option>

                    <option value="verified" className="bg-[#0d1410]">
                      Verified
                    </option>

                    <option value="rejected" className="bg-[#0d1410]">
                      Rejected
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-slate-600">
                      Name
                    </p>
                    <p className="font-semibold text-slate-300 mt-1">
                      {selectedAgent.name || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-slate-600">
                      Agency
                    </p>
                    <p className="font-semibold text-slate-300 mt-1">
                      {selectedAgent.agency || 'Independent'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-slate-600">
                      License
                    </p>
                    <p className="font-semibold text-slate-300 mt-1">
                      {selectedAgent.license_number || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-slate-600">
                      Experience
                    </p>
                    <p className="font-semibold text-slate-300 mt-1">
                      {selectedAgent.years_experience || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-slate-600">
                      Location
                    </p>
                    <p className="font-semibold text-slate-300 mt-1">
                      {selectedAgent.location || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-slate-600">
                      Status
                    </p>
                    <p className="font-semibold text-slate-300 mt-1 capitalize">
                      {selectedAgent.verification_status || 'pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>

                  <h3 className="font-bold text-white">
                    Contact Information
                  </h3>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-slate-600 font-black uppercase">
                      Email
                    </p>

                    <p className="font-semibold text-slate-300 mt-1 break-all">
                      {selectedAgent.email || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-600 font-black uppercase">
                      Phone
                    </p>

                    <p className="font-semibold text-slate-300 mt-1">
                      {selectedAgent.phone || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-600 font-black uppercase">
                      Website
                    </p>

                    <p className="font-semibold text-slate-300 mt-1 break-all">
                      {selectedAgent.website || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="rounded-2xl border border-purple-400/10 bg-purple-400/[0.035] p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-purple-400/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>

                  <h3 className="font-bold text-white">
                    Specializations & Languages
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-2">
                      Specializations
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedAgent.specializations?.length > 0 ? (
                        selectedAgent.specializations.map(
                          (spec: string) => (
                            <span
                              key={spec}
                              className="bg-white/[0.04] border border-purple-400/10 text-purple-300 px-2.5 py-1 rounded-full text-xs font-semibold"
                            >
                              {spec}
                            </span>
                          )
                        )
                      ) : (
                        <p className="text-slate-600">None</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-2">
                      Languages
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedAgent.languages?.length > 0 ? (
                        selectedAgent.languages.map(
                          (lang: string) => (
                            <span
                              key={lang}
                              className="bg-white/[0.04] border border-emerald-400/10 text-emerald-300 px-2.5 py-1 rounded-full text-xs font-semibold"
                            >
                              {lang}
                            </span>
                          )
                        )
                      ) : (
                        <p className="text-slate-600">None</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedAgent.bio && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-white">Bio</h3>
                  </div>

                  <p className="text-sm text-slate-400 leading-6">
                    {selectedAgent.bio}
                  </p>
                </div>
              )}

              {/* Documents */}
              <div className="rounded-2xl border border-orange-400/10 bg-orange-400/[0.035] p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-orange-400/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-400" />
                    </div>

                    <div>
                      <h3 className="font-bold text-white">
                        Verification Documents
                      </h3>

                      <p className="text-xs text-orange-400/50 mt-0.5">
                        Review submitted verification evidence
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-orange-400/10 text-orange-300 text-xs font-bold">
                    {agentDocuments.length}
                  </span>
                </div>

                {agentDocuments.length === 0 ? (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
                    <FileText className="w-8 h-8 mx-auto text-slate-700 mb-2" />

                    <p className="text-sm text-slate-500">
                      No documents uploaded
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agentDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                              <FileText className="w-4 h-4 text-slate-500" />
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-300 capitalize">
                                {doc.document_type}
                              </p>

                              <p className="text-xs text-slate-600 mt-1">
                                Uploaded{' '}
                                {new Date(
                                  doc.uploaded_at
                                ).toLocaleDateString()}
                              </p>

                              {doc.description && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {doc.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={doc.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-400/10 border border-blue-400/10 text-blue-300 text-xs font-bold hover:bg-blue-400/20 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </a>

                            {doc.status === 'pending' && (
                              <>
                                <button
                                  onClick={() =>
                                    handleApproveDocument(
                                      doc.id,
                                      selectedAgent.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-[#06100a] text-xs font-black hover:bg-emerald-400 transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Approve
                                </button>

                                <button
                                  onClick={() =>
                                    handleRejectDocument(
                                      doc.id,
                                      selectedAgent.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/15 text-red-300 text-xs font-bold hover:bg-red-500/20 transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </>
                            )}

                            <span
                              className={`text-[10px] px-2.5 py-1.5 rounded-full font-black uppercase ${
                                doc.status === 'verified'
                                  ? 'bg-emerald-400/10 text-emerald-300'
                                  : doc.status === 'rejected'
                                  ? 'bg-red-400/10 text-red-300'
                                  : 'bg-amber-400/10 text-amber-300'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
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

      {/* Pending Documents Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1410] border border-white/10 rounded-[28px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-20 bg-[#0d1410]/95 backdrop-blur border-b border-white/[0.08] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-400">
                    Verification Queue
                  </span>

                  <h2 className="text-xl font-black text-white mt-1">
                    Pending Documents
                  </h2>
                </div>

                <button
                  onClick={() => setShowDocModal(false)}
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-500 flex items-center justify-center hover:bg-white/10 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {pendingDocuments.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" />

                  <h3 className="font-bold text-white">
                    No pending documents
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    All submitted documents have been reviewed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-white/[0.08] bg-white/[0.02] rounded-2xl p-4 hover:border-amber-400/15 transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-400" />

                            <p className="font-bold text-white capitalize">
                              {doc.document_type}
                            </p>
                          </div>

                          <p className="text-sm text-slate-400 mt-1">
                            {doc.agent?.name || 'Unknown Agent'}
                          </p>

                          <p className="text-xs text-slate-600 mt-1">
                            {doc.agent?.agency || 'Independent Agent'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg bg-blue-400/10 border border-blue-400/10 text-blue-300 text-xs font-bold"
                          >
                            View
                          </a>

                          <button
                            onClick={() =>
                              handleApproveDocument(
                                doc.id,
                                doc.agent_id
                              )
                            }
                            className="px-3 py-2 rounded-lg bg-emerald-500 text-[#06100a] text-xs font-black"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleRejectDocument(
                                doc.id,
                                doc.agent_id
                              )
                            }
                            className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/15 text-red-300 text-xs font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}