'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Search,
  MessageSquare,
  UserCircle,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Activity,
  Users,
  Lock,
  Circle,
  ChevronRight,
} from 'lucide-react'

interface Conversation {
  id: string
  agent_id: string
  player_id: string
  is_active: boolean
  last_message: string
  last_message_at: string
  created_at: string
  agent?: {
    id: string
    name: string
    agency: string
    email: string
    profile_picture: string
  }
  player?: {
    id: string
    name: string
    position: string
    profile_picture: string
  }
  engagement?: {
    status: string
    restriction_level: string
  }
  unread_count?: number
}

interface Message {
  id: string
  conversation_id: string
  sender_type: string
  sender_id: string
  message: string
  is_read: boolean
  created_at: string
  sender_name?: string
}

export default function ConversationMonitorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [adminNoteInput, setAdminNoteInput] = useState('')
  const [savedAdminNote, setSavedAdminNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchConversations()
  }, [])

  const checkAdminAndFetchConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!admin) {
      router.push('/dashboard')
      return
    }

    await fetchAllConversations()
  }

  const fetchAllConversations = async () => {
    setLoading(true)

    const { data: conversationsData, error } = await supabase
      .from('conversations')
      .select(`
        *,
        agent:agents(id, name, agency, email, profile_picture),
        player:players(id, name, position, profile_picture),
        engagement:engagements(status, restriction_level)
      `)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
      setLoading(false)
      return
    }

    if (conversationsData && conversationsData.length > 0) {
      const convWithDetails = await Promise.all(
        conversationsData.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('message, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)

          return {
            ...conv,
            last_message: lastMsg?.[0]?.message || 'No messages yet',
            last_message_at: lastMsg?.[0]?.created_at || conv.created_at,
            unread_count: unreadCount || 0,
          }
        })
      )

      setConversations(convWithDetails)
    } else {
      setConversations([])
    }

    setLoading(false)
  }

  const fetchConversationMessages = async (conversationId: string) => {
    setMessagesLoading(true)

    try {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('agent_id, player_id')
        .eq('id', conversationId)
        .single()

      if (convError || !conversation) {
        console.error('Error fetching conversation:', convError)
        setMessages([])
        setMessagesLoading(false)
        return
      }

      const [{ data: agent }, { data: player }] = await Promise.all([
        supabase
          .from('agents')
          .select('name')
          .eq('id', conversation.agent_id)
          .single(),
        supabase
          .from('players')
          .select('name')
          .eq('id', conversation.player_id)
          .single(),
      ])

      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('Error fetching messages:', msgError)
        setMessages([])
      } else {
        const messagesWithNames = (messagesData || []).map((msg) => ({
          ...msg,
          sender_name:
            msg.sender_type === 'agent'
              ? agent?.name || 'Unknown Agent'
              : player?.name || 'Unknown Player',
        }))

        setMessages(messagesWithNames)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages([])
    }

    setMessagesLoading(false)
  }

  const handleSelectConversation = async (
    conversation: Conversation
  ) => {
    setSelectedConversation(conversation)

    await fetchConversationMessages(conversation.id)

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation.id)
      .eq('is_read', false)

    if (!error) {
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === conversation.id
            ? { ...conv, unread_count: 0 }
            : conv
        )
      )
    }

    const { data: engagement } = await supabase
      .from('engagements')
      .select('admin_notes')
      .eq('agent_id', conversation.agent_id)
      .eq('player_id', conversation.player_id)
      .single()

    const existingNote = engagement?.admin_notes || ''

    setSavedAdminNote(existingNote)
    setAdminNoteInput('')
  }

  const saveAdminNote = async () => {
    if (!selectedConversation) return

    if (!adminNoteInput.trim()) {
      alert('Please enter a note before saving')
      return
    }

    setSavingNote(true)

    const { error } = await supabase
      .from('engagements')
      .update({
        admin_notes: adminNoteInput.trim(),
      })
      .eq('agent_id', selectedConversation.agent_id)
      .eq('player_id', selectedConversation.player_id)

    if (error) {
      console.error('Error saving admin note:', error)
      alert('Failed to save admin note: ' + error.message)
    } else {
      setSavedAdminNote(adminNoteInput.trim())
      setAdminNoteInput('')
      alert('Admin note saved successfully')
    }

    setSavingNote(false)
  }

  const clearAdminNote = async () => {
    if (!selectedConversation) return

    setSavingNote(true)

    const { error } = await supabase
      .from('engagements')
      .update({ admin_notes: null })
      .eq('agent_id', selectedConversation.agent_id)
      .eq('player_id', selectedConversation.player_id)

    if (error) {
      console.error('Error clearing admin note:', error)
      alert('Failed to clear admin note: ' + error.message)
    } else {
      setSavedAdminNote('')
      setAdminNoteInput('')
      alert('Admin note cleared')
    }

    setSavingNote(false)
  }

  const filteredConversations = conversations.filter((conv) => {
    const agentName = conv.agent?.name?.toLowerCase() || ''
    const playerName = conv.player?.name?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()

    return (
      agentName.includes(search) ||
      playerName.includes(search)
    )
  })

  const unreadTotal = conversations.reduce(
    (total, conversation) =>
      total + (conversation.unread_count || 0),
    0
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b09] text-white flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div className="absolute w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative w-16 h-16 rounded-2xl border border-emerald-400/20 bg-[#0d1511] flex items-center justify-center shadow-[0_0_40px_rgba(25,230,107,0.08)]">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
          </div>

          <p className="mt-5 text-sm font-semibold text-white">
            Initialising command centre
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Loading communications...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#070b09] text-white pb-8 relative overflow-hidden">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.055] blur-[120px]" />
        <div className="absolute top-[35%] right-[-180px] w-[450px] h-[450px] rounded-full bg-yellow-500/[0.035] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      <div className="relative max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* =====================================================
            COMMAND CENTRE HEADER
        ====================================================== */}
        <div className="mb-6">

          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3 mb-3">

                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-[0_0_25px_rgba(25,230,107,0.16)]">
                  <MessageSquare className="w-5 h-5 text-[#061009]" />

                  <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-[#070b09]" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-400">
                    PlayerFynder Operations
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Communications & moderation
                  </p>
                </div>

              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.035em]">
                Conversation
                <span className="text-emerald-400"> Monitor</span>
              </h1>

              <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                Monitor agent-player communications, identify activity,
                and maintain platform oversight from one central workspace.
              </p>

            </div>

            <div className="flex items-center gap-3">

              <div className="hidden sm:flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-400/15 bg-[#0d1511]/90 backdrop-blur-xl">

                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
                  <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider font-black text-gray-600">
                    System status
                  </p>

                  <p className="text-xs font-bold text-emerald-400">
                    Live monitoring
                  </p>
                </div>

              </div>

              <button
                onClick={fetchAllConversations}
                className="group inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-400 text-[#061009] text-sm font-black shadow-[0_8px_30px_rgba(25,230,107,0.12)] hover:bg-emerald-300 transition-all"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Refresh
              </button>

            </div>

          </div>

          {/* Command line */}
          <div className="mt-6 h-px bg-gradient-to-r from-emerald-400/30 via-white/[0.06] to-transparent" />

        </div>

        {/* =====================================================
            STATS
        ====================================================== */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">

          {/* Active */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1511]/90 p-5 backdrop-blur-xl group hover:border-emerald-400/20 transition-all">

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-400/70 to-transparent" />

            <div className="flex items-start justify-between">

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
                  Active threads
                </p>

                <p className="text-3xl font-black text-white mt-2">
                  {conversations.length}
                </p>

                <p className="text-[11px] text-gray-600 mt-1">
                  Currently monitored
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
              </div>

            </div>
          </div>

          {/* Unread */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1511]/90 p-5 backdrop-blur-xl group hover:border-red-400/20 transition-all">

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-400/80 to-transparent" />

            <div className="flex items-start justify-between">

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
                  Unread
                </p>

                <p className={`text-3xl font-black mt-2 ${
                  unreadTotal > 0
                    ? 'text-red-400'
                    : 'text-white'
                }`}>
                  {unreadTotal}
                </p>

                <p className="text-[11px] text-gray-600 mt-1">
                  Requires attention
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-red-400/10 border border-red-400/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>

            </div>
          </div>

          {/* Search result */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1511]/90 p-5 backdrop-blur-xl group hover:border-yellow-400/20 transition-all">

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-yellow-400/70 to-transparent" />

            <div className="flex items-start justify-between">

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
                  Visible threads
                </p>

                <p className="text-3xl font-black text-white mt-2">
                  {filteredConversations.length}
                </p>

                <p className="text-[11px] text-gray-600 mt-1">
                  Matching current search
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-yellow-400" />
              </div>

            </div>
          </div>

          {/* Security */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1511]/90 p-5 backdrop-blur-xl group hover:border-emerald-400/20 transition-all">

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-400/70 to-transparent" />

            <div className="flex items-start justify-between">

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
                  Security
                </p>

                <p className="text-lg font-black text-emerald-400 mt-3">
                  Protected
                </p>

                <p className="text-[11px] text-gray-600 mt-1">
                  Administrator access
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>

            </div>
          </div>

        </div>

        {/* =====================================================
            MAIN COMMUNICATIONS CONSOLE
        ====================================================== */}
        <div className="flex flex-col lg:flex-row h-[calc(100vh-330px)] min-h-[650px] rounded-2xl border border-white/[0.08] bg-[#0b100d]/95 shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden backdrop-blur-xl">

          {/* ===================================================
              SIDEBAR
          ==================================================== */}
          <div className="w-full lg:w-[350px] xl:w-[390px] border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col bg-[#0a0f0c]">

            {/* Sidebar heading */}
            <div className="p-5 border-b border-white/[0.07]">

              <div className="flex items-center justify-between mb-4">

                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />

                    <h2 className="font-black text-white">
                      Conversations
                    </h2>
                  </div>

                  <p className="text-[11px] text-gray-600 mt-1">
                    Select a thread to monitor
                  </p>
                </div>

                <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-xs font-black text-gray-400">
                  {conversations.length}
                </div>

              </div>

              {/* Search */}
              <div className="relative">

                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />

                <input
                  type="text"
                  placeholder="Search agent or player..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#111813] border border-white/[0.07] text-sm text-white placeholder:text-gray-600 outline-none focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/[0.05] transition-all"
                />

              </div>

            </div>

            {/* Sidebar status */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05] bg-[#0d1511]">

              <div className="flex items-center gap-2">

                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
                  <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  {filteredConversations.length} active threads
                </span>

              </div>

              <button
                onClick={fetchAllConversations}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">

              {filteredConversations.length === 0 ? (

                <div className="h-full flex items-center justify-center px-8">

                  <div className="text-center">

                    <div className="w-16 h-16 rounded-2xl bg-white/[0.035] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-7 h-7 text-gray-700" />
                    </div>

                    <h3 className="font-bold text-gray-400">
                      No conversations found
                    </h3>

                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      Try adjusting your search or refresh the conversation list.
                    </p>

                  </div>

                </div>

              ) : (

                filteredConversations.map((conv) => {

                  const unreadCount = conv.unread_count || 0
                  const isSelected =
                    selectedConversation?.id === conv.id

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left px-4 py-4 border-b border-white/[0.045] transition-all relative group ${
                        isSelected
                          ? 'bg-emerald-400/[0.07]'
                          : 'bg-transparent hover:bg-white/[0.025]'
                      }`}
                    >

                      {/* Selected marker */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_12px_rgba(25,230,107,0.7)]" />
                      )}

                      <div className="flex items-start gap-3">

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">

                          {conv.player?.profile_picture ? (
                            <img
                              src={conv.player.profile_picture}
                              alt={conv.player?.name}
                              className={`w-11 h-11 rounded-xl object-cover shadow-lg ${
                                isSelected
                                  ? 'ring-2 ring-emerald-400/40'
                                  : 'ring-1 ring-white/10'
                              }`}
                            />
                          ) : (
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                              isSelected
                                ? 'bg-emerald-400/10'
                                : 'bg-white/[0.05]'
                            }`}>
                              <UserCircle className={`w-6 h-6 ${
                                isSelected
                                  ? 'text-emerald-400'
                                  : 'text-gray-600'
                              }`} />
                            </div>
                          )}

                          <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a0f0c]" />

                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-start justify-between gap-2">

                            <h3 className={`font-bold text-sm truncate ${
                              isSelected
                                ? 'text-white'
                                : 'text-gray-300'
                            }`}>
                              {conv.player?.name || 'Unknown Player'}
                            </h3>

                            {conv.last_message_at && (
                              <span className="text-[9px] text-gray-600 flex-shrink-0">
                                {new Date(
                                  conv.last_message_at
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}

                          </div>

                          <div className="flex items-center gap-1 mt-1">

                            <span className="text-[10px] font-semibold text-gray-500 truncate">
                              {conv.player?.position || 'Player'}
                            </span>

                            <span className="text-gray-700">
                              •
                            </span>

                            <span className="text-[10px] text-gray-600 truncate">
                              {conv.agent?.name || 'Unknown Agent'}
                            </span>

                          </div>

                          <p className={`text-xs truncate mt-2 ${
                            unreadCount > 0
                              ? 'font-semibold text-gray-300'
                              : 'text-gray-600'
                          }`}>
                            {conv.last_message}
                          </p>

                          <div className="flex items-center gap-2 mt-2">

                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-emerald-400">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>

                            {conv.engagement?.restriction_level &&
                              conv.engagement.restriction_level !== 'none' && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-yellow-400">
                                  <Shield className="w-3 h-3" />
                                  Restricted
                                </span>
                              )}

                          </div>

                        </div>

                        {/* Unread */}
                        {unreadCount > 0 && (
                          <div className="absolute right-3 bottom-4 min-w-[21px] h-5 px-1.5 rounded-full bg-emerald-400 text-[#061009] text-[9px] font-black flex items-center justify-center shadow-[0_0_15px_rgba(25,230,107,0.25)]">
                            {unreadCount > 99
                              ? '99+'
                              : unreadCount}
                          </div>
                        )}

                      </div>

                    </button>
                  )
                })

              )}

            </div>
          </div>

          {/* ===================================================
              CHAT AREA
          ==================================================== */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#080d0a]">

            {selectedConversation ? (
              <>

                {/* =================================================
                    CONVERSATION HEADER
                ================================================== */}
                <div className="px-5 md:px-7 py-4 bg-[#0c130f] border-b border-white/[0.07] flex-shrink-0">

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3 min-w-0">

                      {selectedConversation.player?.profile_picture ? (
                        <img
                          src={selectedConversation.player.profile_picture}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 shadow-lg"
                          alt={selectedConversation.player?.name}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/10 flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                      )}

                      <div className="min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <h3 className="font-black text-white truncate">
                            {selectedConversation.player?.name ||
                              'Unknown Player'}
                          </h3>

                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/15 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>

                        </div>

                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {selectedConversation.player?.position ||
                            'Player'}
                          {' • '}
                          Agent:{' '}
                          {selectedConversation.agent?.name ||
                            'Unknown Agent'}
                          {' • '}
                          {selectedConversation.agent?.agency ||
                            'Independent Agent'}
                        </p>

                      </div>

                    </div>

                    <div className="hidden md:flex items-center gap-2">

                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-400/[0.05] border border-emerald-400/10">

                        <Lock className="w-3.5 h-3.5 text-emerald-400" />

                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Admin monitoring
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    MESSAGE AREA
                ================================================== */}
                <div
                  className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-5"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 50% 0%, rgba(25,230,107,0.035), transparent 35%)',
                  }}
                >

                  {messagesLoading ? (

                    <div className="h-full flex items-center justify-center">

                      <div className="flex flex-col items-center gap-3">

                        <div className="relative w-11 h-11 rounded-xl bg-emerald-400/10 border border-emerald-400/15 flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                        </div>

                        <span className="text-xs font-semibold text-gray-600">
                          Loading messages...
                        </span>

                      </div>

                    </div>

                  ) : messages.length === 0 ? (

                    <div className="h-full flex items-center justify-center">

                      <div className="text-center max-w-sm">

                        <div className="relative mx-auto w-20 h-20">

                          <div className="absolute inset-0 rounded-3xl bg-emerald-400/5 rotate-6" />

                          <div className="relative w-20 h-20 rounded-3xl bg-[#0e1611] border border-white/[0.07] flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-emerald-400/50" />
                          </div>

                        </div>

                        <h3 className="font-bold text-gray-300 mt-5">
                          No messages yet
                        </h3>

                        <p className="text-xs text-gray-600 mt-2">
                          This conversation has not received any messages.
                        </p>

                      </div>

                    </div>

                  ) : (

                    messages.map((msg, idx) => {

                      const isAgent = msg.sender_type === 'agent'

                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex ${
                            isAgent
                              ? 'justify-start'
                              : 'justify-end'
                          }`}
                        >

                          <div
                            className={`max-w-[72%] ${
                              isAgent
                                ? 'items-start'
                                : 'items-end'
                            } flex flex-col`}
                          >

                            {/* Sender */}
                            <div
                              className={`flex items-center gap-2 mb-1.5 px-1 ${
                                isAgent
                                  ? 'justify-start'
                                  : 'justify-end'
                              }`}
                            >

                              <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                                isAgent
                                  ? 'text-emerald-400'
                                  : 'text-yellow-400'
                              }`}>
                                {isAgent ? 'Agent' : 'Player'}
                              </span>

                              <span className="text-[10px] text-gray-600">
                                {msg.sender_name ||
                                  (isAgent
                                    ? 'Unknown Agent'
                                    : 'Unknown Player')}
                              </span>

                            </div>

                            {/* Message */}
                            <div
                              className={`relative px-4 py-3.5 rounded-2xl shadow-lg ${
                                isAgent
                                  ? 'bg-[#111913] border border-white/[0.07] text-gray-200 rounded-tl-md'
                                  : 'bg-emerald-400 text-[#061009] rounded-tr-md shadow-[0_8px_25px_rgba(25,230,107,0.08)]'
                              }`}
                            >

                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                {msg.message}
                              </p>

                              <div
                                className={`flex items-center gap-1.5 mt-2.5 ${
                                  isAgent
                                    ? 'justify-start'
                                    : 'justify-end'
                                }`}
                              >

                                <Clock
                                  className={`w-3 h-3 ${
                                    isAgent
                                      ? 'text-gray-600'
                                      : 'text-emerald-950/50'
                                  }`}
                                />

                                <span
                                  className={`text-[9px] ${
                                    isAgent
                                      ? 'text-gray-600'
                                      : 'text-emerald-950/60'
                                  }`}
                                >
                                  {new Date(
                                    msg.created_at
                                  ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>

                              </div>

                            </div>

                          </div>

                        </div>
                      )
                    })

                  )}

                </div>

                {/* =================================================
                    SAVED ADMIN NOTE
                ================================================== */}
                {savedAdminNote &&
                  savedAdminNote.trim() !== '' && (
                    <div className="flex-shrink-0 px-5 md:px-8 pb-3">

                      <div className="relative overflow-hidden rounded-2xl border border-yellow-400/15 bg-[#17140a] p-4">

                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-400 shadow-[0_0_12px_rgba(242,201,76,0.5)]" />

                        <div className="flex items-start gap-3 pl-1">

                          <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-yellow-400" />
                          </div>

                          <div className="flex-1 min-w-0">

                            <div className="flex items-center gap-2 flex-wrap">

                              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.15em]">
                                Private Admin Note
                              </p>

                              <span className="text-[8px] font-black text-yellow-500/70 bg-yellow-400/10 border border-yellow-400/10 px-1.5 py-0.5 rounded">
                                CONFIDENTIAL
                              </span>

                            </div>

                            <p className="text-sm text-yellow-100/80 mt-2 leading-relaxed">
                              {savedAdminNote}
                            </p>

                            <p className="text-[9px] text-yellow-500/50 mt-2">
                              Visible only to platform administrators
                            </p>

                          </div>

                          <button
                            onClick={clearAdminNote}
                            disabled={savingNote}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-yellow-500/50 hover:text-yellow-300 hover:bg-yellow-400/10 transition disabled:opacity-50"
                            title="Clear note"
                          >
                            ×
                          </button>

                        </div>

                      </div>

                    </div>
                  )}

                {/* =================================================
                    ADMIN NOTE INPUT
                ================================================== */}
                <div className="flex-shrink-0 p-4 md:px-8 md:py-5 bg-[#0c130f] border-t border-white/[0.07]">

                  <div className="flex gap-3">

                    <div className="flex-1 relative">

                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />

                      <input
                        type="text"
                        value={adminNoteInput}
                        onChange={(e) =>
                          setAdminNoteInput(e.target.value)
                        }
                        placeholder="Add private admin note..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#111913] border border-white/[0.07] text-sm text-white placeholder:text-gray-600 outline-none focus:border-yellow-400/30 focus:ring-4 focus:ring-yellow-400/[0.04] transition-all"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveAdminNote()
                          }
                        }}
                        disabled={savingNote}
                      />

                    </div>

                    <button
                      onClick={saveAdminNote}
                      disabled={
                        savingNote ||
                        !adminNoteInput.trim()
                      }
                      className="px-5 py-3 rounded-xl bg-yellow-400 text-[#161105] text-sm font-black shadow-[0_8px_25px_rgba(242,201,76,0.08)] hover:bg-yellow-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {savingNote ? 'Saving...' : 'Save Note'}
                    </button>

                  </div>

                  <div className="flex items-center gap-2 mt-2 px-1">

                    <Lock className="w-3 h-3 text-gray-700" />

                    <p className="text-[9px] text-gray-600">
                      Private moderation note • Only visible to administrators
                    </p>

                  </div>

                </div>

              </>

            ) : (

              /* =================================================
                 EMPTY STATE
              ================================================== */
              <div className="flex-1 flex items-center justify-center p-8">

                <div className="max-w-md text-center">

                  <div className="relative mx-auto w-28 h-28 mb-7">

                    <div className="absolute inset-0 rounded-[2rem] bg-emerald-400/[0.035] rotate-6 border border-emerald-400/[0.04]" />

                    <div className="absolute inset-2 rounded-[1.7rem] bg-yellow-400/[0.02] -rotate-3" />

                    <div className="relative w-28 h-28 rounded-[2rem] bg-[#0e1611] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex items-center justify-center">
                      <MessageSquare className="w-11 h-11 text-emerald-400/70" />

                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(242,201,76,0.6)]" />
                    </div>

                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400/70">
                    Communications command centre
                  </p>

                  <h3 className="text-2xl font-black text-white mt-2">
                    Select a conversation
                  </h3>

                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    Choose a thread from the communications queue to inspect
                    agent-player messages and manage private administrator notes.
                  </p>

                  <div className="mt-7 flex items-center justify-center gap-2">

                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.035] border border-white/[0.07]">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />

                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                        Admin view only
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.035] border border-white/[0.07]">
                      <Shield className="w-3.5 h-3.5 text-yellow-400" />

                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                        Protected
                      </span>
                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>
        </div>

        {/* Footer status */}
        <div className="mt-3 flex items-center justify-between px-1">

          <div className="flex items-center gap-2">
            <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />

            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-700">
              PlayerFynder communications online
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[9px] font-semibold text-gray-700">
            <Activity className="w-3 h-3" />
            Real-time moderation workspace
          </div>

        </div>

      </div>
    </div>
  )
}