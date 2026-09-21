'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Chat from '@/app/components/Chat'
import {
  MessageSquare,
  UserCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

export default function PlayerMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [playerId, setPlayerId] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchPlayerAndConversations()
  }, [])

  const fetchPlayerAndConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setCurrentUserId(user.id)

    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!player) {
      router.push('/dashboard')
      return
    }

    setPlayerId(player.id)
    await fetchConversations(player.id)
  }

  const fetchConversations = async (playerId: string) => {
    setLoading(true)

    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        agent:agents(id, name, agency, profile_picture),
        engagement:engagements(status, restriction_level)
      `)
      .eq('player_id', playerId)
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
            last_message:
              lastMsg?.[0]?.message || 'No messages yet',
            last_message_time: lastMsg?.[0]?.created_at,
          }
        })
      )

      setConversations(convWithLastMsg)
    }

    setLoading(false)
  }

  const getEngagementBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          text: 'Active',
          color:
            'border-emerald-400/20 bg-emerald-400/10 text-emerald-400',
          icon: CheckCircle,
        }

      case 'pending':
        return {
          text: 'Pending',
          color:
            'border-yellow-400/20 bg-yellow-400/10 text-yellow-400',
          icon: Clock,
        }

      case 'rejected':
        return {
          text: 'Rejected',
          color:
            'border-red-400/20 bg-red-400/10 text-red-400',
          icon: XCircle,
        }

      default:
        return {
          text: 'Unknown',
          color:
            'border-white/10 bg-white/[0.04] text-zinc-500',
          icon: AlertCircle,
        }
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.agent?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#070b09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <MessageSquare className="absolute inset-0 m-auto h-5 w-5 text-emerald-400" />
          </div>

          <p className="text-sm text-zinc-500">
            Loading your messages...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] min-h-[600px] bg-[#070b09] text-white">
      <div className="mx-auto h-full max-w-[1600px] px-3 sm:px-5 lg:px-6">

        <div className="relative flex h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f0c] shadow-2xl shadow-black/30">

          {/* =====================================================
              SIDEBAR
          ====================================================== */}
          <aside className="flex w-full max-w-[380px] flex-col border-r border-white/[0.07] bg-[#090e0b]">

            {/* Header */}
            <div className="border-b border-white/[0.07] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                      <MessageSquare className="h-4 w-4 text-emerald-400" />
                    </div>

                    <div>
                      <h1 className="text-lg font-semibold text-white">
                        Messages
                      </h1>

                      <p className="text-[11px] text-zinc-600">
                        Player communication
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    playerId && fetchConversations(playerId)
                  }
                  title="Refresh conversations"
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-zinc-500 transition-all hover:border-emerald-400/20 hover:bg-emerald-400/10 hover:text-emerald-400"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-zinc-600">
                  {conversations.length}{' '}
                  {conversations.length === 1
                    ? 'conversation'
                    : 'conversations'}
                </span>

                {conversations.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Connected
                  </span>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-white/[0.07] p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

                <input
                  type="text"
                  placeholder="Search by agent name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.035] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-700 transition-all focus:border-emerald-400/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <MessageSquare className="h-7 w-7 text-zinc-700" />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-zinc-400">
                    {searchTerm
                      ? 'No matching conversations'
                      : 'No conversations yet'}
                  </h3>

                  <p className="mt-1 max-w-[220px] text-xs leading-5 text-zinc-700">
                    {searchTerm
                      ? 'Try searching for a different agent.'
                      : 'Your conversations with agents will appear here.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const badge = getEngagementBadge(
                    conv.engagement?.status
                  )

                  const BadgeIcon = badge.icon

                  const isSelected =
                    selectedConversation?.id === conv.id

                  return (
                    <button
                      key={conv.id}
                      onClick={() =>
                        setSelectedConversation(conv)
                      }
                      className={`group relative w-full border-b border-white/[0.05] px-4 py-4 text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-400/[0.07]'
                          : 'hover:bg-white/[0.025]'
                      }`}
                    >
                      {/* Active indicator */}
                      {isSelected && (
                        <div className="absolute bottom-0 left-0 top-0 w-0.5 bg-emerald-400" />
                      )}

                      <div className="flex items-start gap-3">

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {conv.agent?.profile_picture ? (
                            <img
                              src={conv.agent.profile_picture}
                              alt={conv.agent.name}
                              className={`h-11 w-11 rounded-xl object-cover ring-1 ${
                                isSelected
                                  ? 'ring-emerald-400/30'
                                  : 'ring-white/10'
                              }`}
                            />
                          ) : (
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                                isSelected
                                  ? 'border-emerald-400/20 bg-emerald-400/10'
                                  : 'border-white/10 bg-white/[0.04]'
                              }`}
                            >
                              <UserCircle
                                className={`h-5 w-5 ${
                                  isSelected
                                    ? 'text-emerald-400'
                                    : 'text-zinc-600'
                                }`}
                              />
                            </div>
                          )}

                          {conv.engagement?.status ===
                            'approved' && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#090e0b] bg-emerald-500">
                              <CheckCircle className="h-2.5 w-2.5 text-black" />
                            </span>
                          )}
                        </div>

                        {/* Conversation details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              className={`truncate text-sm font-semibold ${
                                isSelected
                                  ? 'text-white'
                                  : 'text-zinc-300'
                              }`}
                            >
                              {conv.agent?.name}
                            </h3>

                            {conv.last_message_time && (
                              <span className="shrink-0 text-[10px] text-zinc-700">
                                {new Date(
                                  conv.last_message_time
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                            {conv.agent?.agency ||
                              'Independent Agent'}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p
                              className={`truncate text-xs ${
                                isSelected
                                  ? 'text-zinc-400'
                                  : 'text-zinc-600'
                              }`}
                            >
                              {conv.last_message}
                            </p>

                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${badge.color}`}
                            >
                              <BadgeIcon className="h-2.5 w-2.5" />
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
          </aside>

          {/* =====================================================
              CHAT AREA
          ====================================================== */}
          <main className="relative flex min-w-0 flex-1 flex-col bg-[#080d0a]">

            {selectedConversation ? (
              <Chat
                conversationId={selectedConversation.id}
                agentId={selectedConversation.agent_id}
                playerId={playerId}
                currentUserId={currentUserId}
                userType="player"
                engagementStatus={
                  selectedConversation.engagement?.status
                }
                restrictionLevel={
                  selectedConversation.engagement?.restriction_level
                }
                onClose={() =>
                  setSelectedConversation(null)
                }
              />
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="max-w-md text-center">

                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                    <div className="absolute inset-0 rounded-3xl bg-emerald-400/10 blur-2xl" />

                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/15 bg-white/[0.035]">
                      <MessageSquare className="h-9 w-9 text-emerald-400/70" />
                    </div>
                  </div>

                  <div className="mt-7 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />

                    <h3 className="text-lg font-semibold text-white">
                      Your conversations
                    </h3>
                  </div>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-600">
                    Select an agent conversation from the left to
                    view your messages and continue the discussion.
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-xs text-zinc-600">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" />
                    Secure PlayerFynder messaging
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}