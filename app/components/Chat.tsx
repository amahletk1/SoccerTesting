'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Send,
  UserCircle,
  MessageSquare,
  CheckCheck,
  AlertCircle,
  Shield,
  Clock,
  XCircle,
  ArrowLeft,
  Lock,
  Circle,
} from 'lucide-react'

interface Message {
  id: string
  conversation_id: string
  sender_type: string
  sender_id: string
  message: string
  is_read: boolean
  created_at: string
}

interface ChatProps {
  conversationId?: string
  agentId?: string
  playerId?: string
  currentUserId?: string
  userType?: string
  engagementStatus?: string
  restrictionLevel?: string
  onClose?: () => void
  onMessageSent?: () => void
  onMessageRead?: () => void
}

// Simple content filter without external dependency
const detectRestrictedContent = (message: string) => {
  const phonePattern =
    /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?)[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g

  const emailPattern =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

  const types: string[] = []

  if (phonePattern.test(message)) types.push('phone')
  if (emailPattern.test(message)) types.push('email')

  return {
    hasRestricted: types.length > 0,
    types,
  }
}

const getRestrictedTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    phone: 'phone numbers',
    email: 'email addresses',
  }

  return labels[type] || type
}

export default function Chat({
  conversationId,
  agentId,
  playerId,
  currentUserId: propCurrentUserId,
  userType: propUserType,
  engagementStatus: propEngagementStatus,
  restrictionLevel: propRestrictionLevel,
  onClose,
  onMessageSent,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [currentUserId, setCurrentUserId] = useState<string>(
    propCurrentUserId || ''
  )

  const [userType, setUserType] = useState<'agent' | 'player' | null>(
    propUserType as any || null
  )

  const [engagementStatus, setEngagementStatus] = useState<string>(
    propEngagementStatus || 'pending'
  )

  const [restrictionLevel, setRestrictionLevel] = useState<string>(
    propRestrictionLevel || 'none'
  )

  const [otherPerson, setOtherPerson] = useState<any>(null)

  const [actualConversationId, setActualConversationId] = useState<
    string | null
  >(conversationId || null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Initialize component
  useEffect(() => {
    const init = async () => {
      if (!propCurrentUserId) {
        await fetchCurrentUser()
      }

      if (!propEngagementStatus && agentId && playerId) {
        await fetchEngagementStatus()
      }

      if (actualConversationId || (agentId && playerId)) {
        await fetchMessages()
        subscribeToMessages()
      }

      await fetchOtherPerson()
    }

    init()
  }, [])

  useEffect(() => {
    if (
      currentUserId &&
      (actualConversationId || (agentId && playerId))
    ) {
      fetchMessages()
      fetchOtherPerson()
    }
  }, [currentUserId, actualConversationId, agentId, playerId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      setCurrentUserId(user.id)

      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (agent) {
        setUserType('agent')
      } else {
        const { data: player } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (player) {
          setUserType('player')
        }
      }
    }
  }

  const fetchOtherPerson = async () => {
    if (userType === 'agent' && playerId) {
      const { data } = await supabase
        .from('players')
        .select('id, name, position, profile_picture')
        .eq('id', playerId)
        .single()

      if (data) setOtherPerson(data)
    } else if (userType === 'player' && agentId) {
      const { data } = await supabase
        .from('agents')
        .select('id, name, agency, profile_picture')
        .eq('id', agentId)
        .single()

      if (data) setOtherPerson(data)
    }
  }

  const fetchEngagementStatus = async () => {
    if (!propEngagementStatus && agentId && playerId) {
      const { data } = await supabase
        .from('engagements')
        .select('status, restriction_level')
        .eq('agent_id', agentId)
        .eq('player_id', playerId)
        .single()

      if (data) {
        setEngagementStatus(data.status)
        setRestrictionLevel(data.restriction_level || 'none')
      }
    }
  }

  const fetchMessages = async () => {
    setLoading(true)

    let convId = actualConversationId

    if (!convId && agentId && playerId) {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('agent_id', agentId)
        .eq('player_id', playerId)
        .single()

      if (existing) {
        convId = existing.id
        setActualConversationId(convId)
      }
    }

    if (convId) {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', currentUserId)
    }

    setLoading(false)
  }

  const subscribeToMessages = () => {
    if (!actualConversationId) return

    const subscription = supabase
      .channel(`chat-${actualConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${actualConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message

          setMessages((prev) => [...prev, newMsg])

          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) {
      return
    }

    if (engagementStatus !== 'approved') {
      alert(
        engagementStatus === 'pending'
          ? 'Waiting for admin approval before you can send messages...'
          : 'This engagement was rejected. Cannot send messages.'
      )
      return
    }

    const detection = detectRestrictedContent(newMessage)

    if (detection.hasRestricted) {
      alert(
        `Message blocked: Cannot share ${detection.types
          .map((t) => getRestrictedTypeLabel(t))
          .join(', ')}`
      )
      return
    }

    setSending(true)

    let convId = actualConversationId

    if (!convId && agentId && playerId) {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('agent_id', agentId)
        .eq('player_id', playerId)
        .single()

      if (existing) {
        convId = existing.id
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            agent_id: agentId,
            player_id: playerId,
            is_active: true,
          })
          .select()
          .single()

        if (newConv) {
          convId = newConv.id
        }
      }

      setActualConversationId(convId)
    }

    if (convId) {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_type: userType,
          sender_id: currentUserId,
          message: newMessage.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        })

      if (!error) {
        await supabase
          .from('conversations')
          .update({
            last_message: newMessage.trim(),
            last_message_at: new Date().toISOString(),
          })
          .eq('id', convId)

        setNewMessage('')

        if (onMessageSent) onMessageSent()

        await fetchMessages()
      } else {
        console.error('Error sending message:', error)
        alert('Failed to send message: ' + error.message)
      }
    } else {
      alert('Could not create or find conversation')
    }

    setSending(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  const getStatusBadge = () => {
    switch (engagementStatus) {
      case 'approved':
        return {
          text: 'Active',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: null,
        }

      case 'pending':
        return {
          text: 'Pending approval',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: Clock,
        }

      case 'rejected':
        return {
          text: 'Rejected',
          color: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: XCircle,
        }

      default:
        return {
          text: 'Unknown',
          color: 'bg-white/5 text-white/50 border-white/10',
          icon: AlertCircle,
        }
    }
  }

  const statusBadge = getStatusBadge()

  const displayName =
    otherPerson?.name ||
    (userType === 'agent' ? 'Player' : 'Agent')

  const displaySubtitle =
    userType === 'agent'
      ? otherPerson?.position || 'Player'
      : otherPerson?.agency || 'Agent'

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f0d] shadow-2xl shadow-black/30">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#101612]">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-amber-400/5 blur-3xl" />

        <div className="relative flex items-center justify-between px-5 py-4">

          <div className="flex min-w-0 items-center gap-3">

            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close chat"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            <div className="relative shrink-0">
              {otherPerson?.profile_picture ? (
                <img
                  src={otherPerson.profile_picture}
                  alt=""
                  className="h-11 w-11 rounded-xl border border-emerald-400/20 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
                  <UserCircle className="h-6 w-6 text-emerald-400" />
                </div>
              )}

              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#101612] bg-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-900" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-bold text-white">
                  {displayName}
                </h3>

                {engagementStatus && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadge.color}`}
                  >
                    {statusBadge.icon && (
                      <statusBadge.icon className="h-3 w-3" />
                    )}
                    {statusBadge.text}
                  </span>
                )}
              </div>

              <p className="mt-0.5 truncate text-xs text-white/40">
                {displaySubtitle}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-medium text-white/50">
                Protected chat
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          STATUS NOTICE
      ========================================================= */}
      {engagementStatus !== 'approved' && (
        <div
          className={`flex items-center gap-2 border-b px-4 py-3 text-xs ${
            engagementStatus === 'pending'
              ? 'border-amber-500/10 bg-amber-500/[0.06] text-amber-300'
              : 'border-red-500/10 bg-red-500/[0.06] text-red-300'
          }`}
        >
          {engagementStatus === 'pending' ? (
            <Clock className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}

          <span>
            {engagementStatus === 'pending'
              ? 'Pending admin approval. Messaging is currently disabled.'
              : 'This engagement was rejected.'}
          </span>
        </div>
      )}

      {engagementStatus === 'approved' &&
        restrictionLevel === 'restricted' && (
          <div className="flex items-center gap-2 border-b border-red-500/10 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300">
            <Shield className="h-4 w-4 shrink-0" />
            <span>
              Restricted: No phone numbers, emails, or social media sharing.
            </span>
          </div>
        )}

      {/* =========================================================
          MESSAGES
      ========================================================= */}
      <div className="relative flex-1 overflow-hidden bg-[#090d0b]">

        {/* Subtle background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative flex h-full min-h-[300px] max-h-[440px] flex-col gap-4 overflow-y-auto p-4 sm:p-5">

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
                </div>
                <span className="text-xs text-white/30">
                  Loading conversation...
                </span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-xs text-center">

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-500/[0.07]">
                  <MessageSquare className="h-7 w-7 text-emerald-400/70" />
                </div>

                <h4 className="text-sm font-bold text-white">
                  No messages yet
                </h4>

                <p className="mt-1.5 text-xs leading-5 text-white/35">
                  {engagementStatus === 'approved'
                    ? 'Start the conversation and connect directly through PlayerFynder.'
                    : 'Messages will become available once the engagement is approved.'}
                </p>

                {engagementStatus === 'approved' && (
                  <div className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full border border-amber-400/10 bg-amber-400/[0.04] px-3 py-1.5">
                    <Circle className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-medium text-amber-300/70">
                      Conversation ready
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/25">
                  Secure conversation
                </span>
              </div>

              {messages.map((msg, idx) => {
                const isCurrentUser =
                  msg.sender_id === currentUserId

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex ${
                      isCurrentUser
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex max-w-[82%] flex-col sm:max-w-[70%] ${
                        isCurrentUser
                          ? 'items-end'
                          : 'items-start'
                      }`}
                    >
                      <div
                        className={`mb-1 flex items-center gap-1.5 px-1 ${
                          isCurrentUser
                            ? 'flex-row-reverse'
                            : ''
                        }`}
                      >
                        <UserCircle
                          className={`h-3.5 w-3.5 ${
                            isCurrentUser
                              ? 'text-emerald-400'
                              : 'text-white/25'
                          }`}
                        />

                        <span className="text-[10px] font-semibold text-white/35">
                          {isCurrentUser
                            ? 'You'
                            : otherPerson?.name ||
                              (userType === 'agent'
                                ? 'Player'
                                : 'Agent')}
                        </span>
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isCurrentUser
                            ? 'rounded-br-md border border-emerald-400/20 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-950/20'
                            : 'rounded-bl-md border border-white/10 bg-[#151b17] text-white/90'
                        }`}
                      >
                        <p className="break-words text-sm leading-5">
                          {msg.message}
                        </p>

                        <div
                          className={`mt-2 flex items-center justify-end gap-1.5 ${
                            isCurrentUser
                              ? 'text-white/60'
                              : 'text-white/25'
                          }`}
                        >
                          <span className="text-[9px]">
                            {new Date(
                              msg.created_at
                            ).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {isCurrentUser && (
                            <CheckCheck
                              className={`h-3.5 w-3.5 ${
                                msg.is_read
                                  ? 'text-emerald-100'
                                  : 'text-white/40'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* =========================================================
          INPUT AREA
      ========================================================= */}
      {engagementStatus === 'approved' ? (
        <div className="border-t border-white/10 bg-[#101612] p-4">

          <div className="rounded-2xl border border-white/10 bg-[#0b0f0d] p-2 shadow-inner">

            <div className="flex items-center gap-2">

              <input
                type="text"
                value={newMessage}
                onChange={(e) =>
                  setNewMessage(e.target.value)
                }
                onKeyPress={(e) =>
                  e.key === 'Enter' && sendMessage()
                }
                placeholder="Write a message..."
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
                disabled={sending}
              />

              <button
                onClick={sendMessage}
                disabled={
                  sending || !newMessage.trim()
                }
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {sending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 px-1">
            <Lock className="h-3 w-3 text-emerald-400/50" />
            <p className="text-[10px] text-white/25">
              Personal contact information is automatically blocked for your safety.
            </p>
          </div>
        </div>
      ) : engagementStatus === 'pending' ? (
        <div className="border-t border-white/10 bg-[#101612] p-4">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/10 bg-amber-400/[0.04] py-3 text-xs text-amber-300/60">
            <Clock className="h-4 w-4" />
            Waiting for admin approval...
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 bg-[#101612] p-4">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.04] py-3 text-xs text-red-300/60">
            <XCircle className="h-4 w-4" />
            This engagement was rejected.
          </div>
        </div>
      )}
    </div>
  )
}