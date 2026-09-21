'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Chat from '@/app/components/Chat'
import {
  MessageSquare,
  Users,
  UserCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ShieldCheck,
  Sparkles,
  ChevronRight
} from 'lucide-react'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Determine user type
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let type = ''
    let currentUserId = ''

    if (agent) {
      type = 'agent'
      currentUserId = agent.id
    } else {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (player) {
        type = 'player'
        currentUserId = player.id
      }
    }

    setUserType(type)
    setUserId(currentUserId)

    // Fetch conversations with engagement status
    let query = supabase
      .from('conversations')
      .select(`
        *,
        agent:agents(id, name, agency_name, profile_picture),
        player:players(id, name, position, profile_picture),
        engagement:engagements(status, restriction_level)
      `)
      .order('last_message_at', { ascending: false })

    if (type === 'agent') {
      query = query.eq('agent_id', currentUserId)
    } else if (type === 'player') {
      query = query.eq('player_id', currentUserId)
    }

    const { data } = await query

    if (data) {
      // Get last message for each conversation
      const convWithLastMsg = await Promise.all(
        data.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('message, created_at, sender_type')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...conv,
            last_message: lastMsg?.[0]?.message || 'No messages yet',
            last_message_time: lastMsg?.[0]?.created_at,
            last_message_sender: lastMsg?.[0]?.sender_type
          }
        })
      )

      setConversations(convWithLastMsg)
    }

    setLoading(false)
  }

  const getEngagementStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          text: 'Active',
          color:
            'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          icon: CheckCircle
        }

      case 'pending':
        return {
          text: 'Pending Admin Approval',
          color:
            'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
          icon: Clock
        }

      case 'rejected':
        return {
          text: 'Rejected',
          color:
            'bg-red-500/10 text-red-300 border-red-500/20',
          icon: XCircle
        }

      default:
        return {
          text: 'Unknown',
          color:
            'bg-white/[0.04] text-slate-400 border-white/10',
          icon: AlertCircle
        }
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const otherPerson =
      userType === 'agent' ? conv.player : conv.agent

    const search = searchTerm.toLowerCase().trim()

    if (!search) return true

    return (
      otherPerson?.name?.toLowerCase().includes(search) ||
      conv.agent?.agency_name?.toLowerCase().includes(search) ||
      otherPerson?.position?.toLowerCase().includes(search) ||
      conv.last_message?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b09] text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full bg-emerald-500/[0.08] blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-yellow-500/[0.04] blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <MessageSquare className="absolute inset-0 m-auto w-5 h-5 text-emerald-400" />
          </div>

          <p className="text-sm text-slate-400">
            Loading conversations...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b09] text-white relative overflow-hidden">

      {/* =========================================================
          AMBIENT BACKGROUND
      ========================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-72 left-1/4 w-[700px] h-[700px] rounded-full bg-emerald-500/[0.055] blur-3xl" />
        <div className="absolute top-1/3 -right-72 w-[600px] h-[600px] rounded-full bg-yellow-500/[0.025] blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* =========================================================
            PAGE HEADER
        ========================================================== */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b120f]/95 p-6 sm:p-8 mb-6">

          <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-yellow-500/5 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>

                <span className="text-xs uppercase tracking-[0.18em] font-bold text-emerald-400/80">
                  PlayerFynder Communication
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Messages
                </h1>

                <Sparkles className="hidden sm:block w-5 h-5 text-yellow-400/70" />
              </div>

              <p className="text-slate-400 mt-2 text-sm sm:text-base">
                Chat with your football connections and manage your conversations.
              </p>

              <div className="flex flex-wrap gap-3 mt-5">

                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.035] border border-white/10">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />

                  <span className="text-sm font-semibold text-white">
                    {conversations.length}
                  </span>

                  <span className="text-xs text-slate-500">
                    {conversations.length === 1
                      ? 'Conversation'
                      : 'Conversations'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.035] border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-yellow-400" />

                  <span className="text-xs text-slate-400">
                    Secure communication
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex w-20 h-20 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/10 items-center justify-center">
              <MessageSquare className="w-9 h-9 text-emerald-400/60" />
            </div>
          </div>
        </div>

        {/* =========================================================
            MAIN MESSAGING AREA
        ========================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">

          {/* =======================================================
              CONVERSATIONS SIDEBAR
          ======================================================== */}
          <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-[#0b120f]/95 overflow-hidden">

            {/* Sidebar header */}
            <div className="p-4 sm:p-5 border-b border-white/10">

              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Conversations
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    {conversations.length}{' '}
                    {conversations.length === 1
                      ? 'conversation'
                      : 'conversations'}
                  </p>
                </div>

                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* Conversation search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#08100d] border border-white/10 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="max-h-[600px] overflow-y-auto">

              {filteredConversations.length === 0 ? (
                <div className="p-8 sm:p-10 text-center">

                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.035] border border-white/10 flex items-center justify-center mb-4">
                    <MessageSquare className="w-7 h-7 text-slate-600" />
                  </div>

                  <h3 className="text-sm font-semibold text-slate-300 mb-1">
                    {conversations.length === 0
                      ? 'No conversations yet'
                      : 'No matches found'}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {conversations.length === 0
                      ? "When agents or players contact you, they'll appear here."
                      : 'Try a different search term.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const otherPerson =
                    userType === 'agent'
                      ? conv.player
                      : conv.agent

                  const statusBadge =
                    getEngagementStatusBadge(
                      conv.engagement?.status
                    )

                  const StatusIcon = statusBadge.icon

                  const isSelected =
                    selectedConversation?.id === conv.id

                  return (
                    <button
                      key={conv.id}
                      onClick={() =>
                        setSelectedConversation(conv)
                      }
                      className={`relative w-full p-4 text-left border-b border-white/[0.06] transition-all group ${
                        isSelected
                          ? 'bg-emerald-500/[0.08]'
                          : 'hover:bg-white/[0.025]'
                      }`}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400" />
                      )}

                      <div className="flex items-start gap-3">

                        {/* Avatar */}
                        <div className="relative shrink-0">

                          {otherPerson?.profile_picture ? (
                            <img
                              src={otherPerson.profile_picture}
                              alt={otherPerson.name}
                              className="w-11 h-11 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-950 to-[#111a15] border border-white/10 flex items-center justify-center">
                              {userType === 'agent' ? (
                                <Users className="w-5 h-5 text-emerald-400/70" />
                              ) : (
                                <UserCircle className="w-5 h-5 text-emerald-400/70" />
                              )}
                            </div>
                          )}

                          {conv.engagement?.status === 'approved' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0b120f]" />
                          )}
                        </div>

                        {/* Conversation details */}
                        <div className="flex-1 min-w-0">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-white truncate">
                                {otherPerson?.name || 'Unknown'}
                              </p>

                              {userType === 'agent' &&
                                otherPerson?.position && (
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {otherPerson.position}
                                  </p>
                                )}

                              {userType === 'player' &&
                                conv.agent?.agency_name && (
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {conv.agent.agency_name}
                                  </p>
                                )}
                            </div>

                            <span className="text-[9px] text-slate-600 whitespace-nowrap">
                              {conv.last_message_time
                                ? new Date(
                                    conv.last_message_time
                                  ).toLocaleDateString()
                                : ''}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
                            >
                              <StatusIcon className="w-2.5 h-2.5" />
                              {statusBadge.text}
                            </span>
                          </div>

                          {/* Last message */}
                          <p className="text-xs text-slate-500 truncate mt-2 leading-relaxed">
                            {conv.last_message_sender === userType
                              ? 'You: '
                              : ''}
                            {conv.last_message}
                          </p>
                        </div>

                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 mt-5 transition-all ${
                            isSelected
                              ? 'text-emerald-400'
                              : 'text-slate-700 group-hover:text-slate-500'
                          }`}
                        />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* =======================================================
              CHAT WINDOW
          ======================================================== */}
          <div className="lg:col-span-2 min-h-[550px]">

            {selectedConversation ? (
              <div className="h-full rounded-2xl border border-white/10 overflow-hidden bg-[#0b120f]/95">

                <Chat
                  conversationId={selectedConversation.id}
                  agentId={selectedConversation.agent_id}
                  playerId={selectedConversation.player_id}
                  currentUserId={userId}
                  userType={userType}
                  engagementStatus={
                    selectedConversation.engagement?.status
                  }
                  restrictionLevel={
                    selectedConversation.engagement?.restriction_level
                  }
                  onClose={() =>
                    setSelectedConversation(null)
                  }
                  onMessageSent={() =>
                    fetchConversations()
                  }
                />
              </div>
            ) : (
              <div className="relative h-full min-h-[550px] rounded-2xl border border-white/10 bg-[#0b120f]/95 overflow-hidden flex items-center justify-center">

                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />

                <div className="relative text-center px-6">

                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 rotate-6" />

                    <div className="relative w-24 h-24 rounded-3xl bg-[#0d1712] border border-white/10 flex items-center justify-center">
                      <MessageSquare className="w-10 h-10 text-emerald-400/60" />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2">
                    Your conversations
                  </h2>

                  <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Select a conversation from the list to view your
                    messages and continue the conversation.
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-5 text-[10px] uppercase tracking-[0.16em] font-semibold text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
                    PlayerFynder messaging
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}