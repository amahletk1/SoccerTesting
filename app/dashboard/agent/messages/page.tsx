'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Chat from '@/app/components/Chat'
import {
  MessageSquare,
  UserCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Users,
  ChevronRight,
  Inbox,
  Radio,
  RefreshCw,
  Shield,
  Sparkles,
} from 'lucide-react'

export default function AgentMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAgentAndConversations()
  }, [])

  // Subscribe to new messages for real-time unread updates
  useEffect(() => {
    if (!agentId) return

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new

          // If message is not from current user and belongs to one of our conversations
          if (newMessage.sender_id !== currentUserId) {
            // Increment unread count for that conversation
            setUnreadCounts((prev) => ({
              ...prev,
              [newMessage.conversation_id]:
                (prev[newMessage.conversation_id] || 0) + 1,
            }))

            // Refresh conversations to update last message
            if (agentId) fetchConversations(agentId)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [agentId, currentUserId])

  const fetchAgentAndConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setCurrentUserId(user.id)

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!agent) {
      router.push('/dashboard')
      return
    }

    setAgentId(agent.id)
    await fetchConversations(agent.id)
    await fetchUnreadCounts(agent.id)
  }

  const fetchConversations = async (agentId: string) => {
    setLoading(true)

    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        player:players(id, name, position, profile_picture),
        engagement:engagements(status, restriction_level)
      `)
      .eq('agent_id', agentId)
      .order('last_message_at', { ascending: false })

    if (data) {
      const convWithLastMsg = await Promise.all(
        data.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('message, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...conv,
            last_message: lastMsg?.[0]?.message || 'No messages yet',
            last_message_time: lastMsg?.[0]?.created_at,
          }
        })
      )

      setConversations(convWithLastMsg)
    }

    setLoading(false)
  }

  const fetchUnreadCounts = async (agentId: string) => {
    // Get all conversations for this agent
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('agent_id', agentId)

    if (!convs) return

    const counts: Record<string, number> = {}

    for (const conv of convs) {
      // Count unread messages where sender is player (not agent)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .neq('sender_id', currentUserId)

      if (count && count > 0) {
        counts[conv.id] = count
      }
    }

    setUnreadCounts(counts)
  }

  const markConversationAsRead = async (conversationId: string) => {
    // Mark all messages in this conversation as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false)

    // Update local unread count
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: 0,
    }))
  }

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation)
    await markConversationAsRead(conversation.id)
  }

  const getEngagementBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          text: 'Active',
          color:
            'bg-emerald-400/[0.08] text-emerald-300 border-emerald-400/15',
          icon: CheckCircle,
        }
      case 'pending':
        return {
          text: 'Pending',
          color:
            'bg-amber-400/[0.08] text-amber-300 border-amber-400/15',
          icon: Clock,
        }
      case 'rejected':
        return {
          text: 'Rejected',
          color: 'bg-red-400/[0.08] text-red-300 border-red-400/15',
          icon: XCircle,
        }
      default:
        return {
          text: 'Unknown',
          color:
            'bg-slate-400/[0.08] text-slate-400 border-white/[0.08]',
          icon: AlertCircle,
        }
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.player?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalUnread = Object.values(unreadCounts).reduce(
    (a, b) => a + b,
    0
  )

  if (loading) {
    return (
      <div className="min-h-[70vh] -m-4 md:-m-6 flex items-center justify-center bg-[#050907] text-white">
        <div className="relative flex flex-col items-center">
          <div className="absolute -inset-20 rounded-full bg-emerald-500/[0.07] blur-[70px]" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/15 bg-[#0b110e] shadow-[0_0_45px_rgba(16,185,129,0.08)]">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
          </div>

          <p className="relative mt-5 text-sm font-bold text-white">
            Loading your messages
          </p>

          <p className="relative mt-1 text-xs text-slate-600">
            Connecting to your communication hub...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] min-h-[620px] -m-4 md:-m-6 overflow-hidden bg-[#050907] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
        <div className="absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-yellow-500/[0.025] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative h-full w-full max-w-[1700px] mx-auto p-3 md:p-5 lg:p-6">
        <div className="flex h-full overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#080d0a] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">

          {/* =====================================================
              CONVERSATION SIDEBAR
          ===================================================== */}
          <aside className="flex w-[330px] shrink-0 flex-col border-r border-white/[0.06] bg-[#080d0a] lg:w-[380px]">

            {/* Sidebar Header */}
            <div className="relative overflow-hidden border-b border-white/[0.06] bg-[#0b110e] px-5 py-5">
              <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-emerald-400/[0.06] blur-3xl" />
              <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-yellow-400/[0.025] blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/[0.08]">
                      <MessageSquare className="h-5 w-5 text-emerald-400" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-base font-black text-white">
                        Messages
                      </h2>

                      <p className="mt-0.5 truncate text-[10px] font-medium text-slate-600">
                        Agent communication hub
                      </p>
                    </div>
                  </div>

                  {totalUnread > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.10] px-2.5 py-1.5 text-[10px] font-black text-emerald-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      {totalUnread} new
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <Users className="h-3.5 w-3.5 text-slate-500" />

                  <span>
                    {conversations.length} conversation
                    {conversations.length === 1 ? '' : 's'}
                  </span>

                  <span className="h-1 w-1 rounded-full bg-slate-700" />

                  <span className="flex items-center gap-1.5 text-emerald-400/80">
                    <Radio className="h-3 w-3" />
                    Live
                  </span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-white/[0.06] bg-[#080d0a] p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-emerald-400/25 focus:bg-white/[0.035] focus:ring-4 focus:ring-emerald-400/[0.04]"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                    <Inbox className="h-6 w-6 text-slate-700" />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-white">
                    No conversations yet
                  </h3>

                  <p className="mt-1.5 max-w-[230px] text-xs leading-5 text-slate-600">
                    {searchTerm
                      ? 'No players match your search.'
                      : 'Your player conversations will appear here.'}
                  </p>

                  {!searchTerm && (
                    <Link
                      href="/dashboard/players"
                      className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.05] px-3 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-400/[0.10]"
                    >
                      Browse Players
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-5 text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const badge = getEngagementBadge(
                    conv.engagement?.status
                  )
                  const BadgeIcon = badge.icon
                  const unreadCount = unreadCounts[conv.id] || 0
                  const isSelected =
                    selectedConversation?.id === conv.id

                  return (
                    <button
                      key={conv.id}
                      onClick={() =>
                        handleSelectConversation(conv)
                      }
                      className={`group relative w-full border-b border-white/[0.045] px-4 py-4 text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-emerald-400/[0.055]'
                          : 'hover:bg-white/[0.025]'
                      }`}
                    >
                      {/* Selected indicator */}
                      <div
                        className={`absolute bottom-0 left-0 top-0 w-[2px] bg-emerald-400 transition-opacity ${
                          isSelected
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                      />

                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {conv.player?.profile_picture ? (
                            <img
                              src={conv.player.profile_picture}
                              alt={
                                conv.player?.name || 'Player'
                              }
                              className={`h-11 w-11 rounded-xl object-cover transition ${
                                isSelected
                                  ? 'ring-2 ring-emerald-400/20'
                                  : 'ring-1 ring-white/[0.07] group-hover:ring-white/[0.12]'
                              }`}
                            />
                          ) : (
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                                isSelected
                                  ? 'border-emerald-400/15 bg-emerald-400/[0.08]'
                                  : 'border-white/[0.07] bg-white/[0.035]'
                              }`}
                            >
                              <UserCircle
                                className={`h-6 w-6 ${
                                  isSelected
                                    ? 'text-emerald-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            </div>
                          )}

                          {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#080d0a] bg-emerald-400 px-1 text-[9px] font-black text-[#031008]">
                              {unreadCount > 9
                                ? '9+'
                                : unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Conversation content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className={`truncate text-sm ${
                                unreadCount > 0
                                  ? 'font-black text-white'
                                  : 'font-semibold text-slate-300'
                              }`}
                            >
                              {conv.player?.name}
                            </h3>

                            {conv.last_message_time && (
                              <span className="shrink-0 text-[9px] font-medium text-slate-700">
                                {new Date(
                                  conv.last_message_time
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {conv.player?.position || 'Player'}
                          </p>

                          <p
                            className={`mt-2 truncate text-xs ${
                              unreadCount > 0
                                ? 'font-semibold text-slate-300'
                                : 'text-slate-600'
                            }`}
                          >
                            {conv.last_message}
                          </p>

                          <div className="mt-2.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-wider ${badge.color}`}
                            >
                              <BadgeIcon className="h-3 w-3" />
                              {badge.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Sidebar footer */}
            <div className="border-t border-white/[0.06] bg-black/10 px-4 py-3">
              <div className="flex items-center gap-2 text-[9px] font-medium text-slate-700">
                <Shield className="h-3 w-3 text-emerald-400/50" />
                PlayerFynder secure messaging
              </div>
            </div>
          </aside>

          {/* =====================================================
              CHAT AREA
          ===================================================== */}
          <main className="min-w-0 flex-1 bg-[#070b09]">
            {selectedConversation ? (
              <Chat
                conversationId={selectedConversation.id}
                agentId={agentId}
                playerId={selectedConversation.player_id}
                currentUserId={currentUserId}
                userType="agent"
                engagementStatus={
                  selectedConversation.engagement?.status
                }
                restrictionLevel={
                  selectedConversation.engagement
                    ?.restriction_level
                }
                onClose={() => setSelectedConversation(null)}
                onMessageRead={() => {
                  // Refresh unread counts when messages are read
                  fetchUnreadCounts(agentId)
                  fetchConversations(agentId)
                }}
              />
            ) : (
              <div className="relative flex h-full items-center justify-center overflow-hidden p-8">
                {/* Background glow */}
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.025] blur-[100px]" />

                <div className="relative max-w-md text-center">
                  {/* Illustration */}
                  <div className="relative mb-7 inline-flex">
                    <div className="absolute inset-[-20px] rounded-[32px] bg-emerald-400/[0.035] blur-2xl" />

                    <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/[0.08] bg-[#0b110e] shadow-2xl">
                      <MessageSquare className="h-10 w-10 text-slate-700" />
                    </div>

                    <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-4 border-[#070b09] bg-emerald-400">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#031008]" />
                    </div>
                  </div>

                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-2.5 py-1">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-400/80">
                      Communication Hub
                    </span>
                  </div>

                  <h3 className="text-2xl font-black tracking-tight text-white">
                    Select a conversation
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Choose a player from your conversations to
                    view messages and continue your scouting
                    communication.
                  </p>

                  {conversations.length === 0 && (
                    <Link
                      href="/dashboard/players"
                      className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-xs font-black text-[#031008] transition-all hover:bg-emerald-300 hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]"
                    >
                      Browse Players
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}