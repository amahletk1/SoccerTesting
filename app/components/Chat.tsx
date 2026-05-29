'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, UserCircle, MessageSquare, CheckCheck, AlertCircle, Shield, Clock, XCircle } from 'lucide-react'
import { detectRestrictedContent, getRestrictedTypeLabel } from '@/lib/message-filter'

interface Message {
  id: string
  conversation_id: string
  sender_type: string
  sender_id: string
  message: string
  is_read: boolean
  has_restricted_content?: boolean
  restricted_types?: string[]
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
  onMessageSent
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>(propCurrentUserId || '')
  const [userType, setUserType] = useState<'agent' | 'player' | null>(propUserType as any || null)
  const [engagementStatus, setEngagementStatus] = useState<string>(propEngagementStatus || 'pending')
  const [restrictionLevel, setRestrictionLevel] = useState<string>(propRestrictionLevel || 'none')
  const [otherPerson, setOtherPerson] = useState<any>(null)
  const [actualConversationId, setActualConversationId] = useState<string | null>(conversationId || null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!propCurrentUserId) {
      fetchCurrentUser()
    } else {
      if (actualConversationId || (agentId && playerId)) {
        fetchMessages()
        subscribeToMessages()
      }
      if (!propEngagementStatus) {
        fetchEngagementStatus()
      }
      fetchOtherPerson()
    }
  }, [])

  useEffect(() => {
    if (currentUserId && (actualConversationId || (agentId && playerId))) {
      fetchMessages()
      subscribeToMessages()
      if (!propEngagementStatus) {
        fetchEngagementStatus()
      }
      fetchOtherPerson()
    }
  }, [currentUserId, actualConversationId, agentId, playerId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: agent } = await supabase.from('agents').select('id').eq('user_id', user.id).single()
      if (agent) {
        setUserType('agent')
      } else {
        const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).single()
        if (player) setUserType('player')
      }
    }
  }

  const fetchOtherPerson = async () => {
    if (userType === 'agent' && playerId) {
      const { data } = await supabase.from('players').select('id, name, position, profile_picture').eq('id', playerId).single()
      if (data) setOtherPerson(data)
    } else if (userType === 'player' && agentId) {
      const { data } = await supabase.from('agents').select('id, name, agency_name, profile_picture').eq('id', agentId).single()
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
      } else if (engagementStatus === 'approved') {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ agent_id: agentId, player_id: playerId, is_active: true })
          .select()
          .single()
        if (newConv) {
          convId = newConv.id
          setActualConversationId(convId)
        }
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
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.conversation_id === actualConversationId) {
          setMessages(prev => [...prev, newMsg])
          if (newMsg.sender_id !== currentUserId) {
            supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id)
          }
        }
      })
      .subscribe()
    return () => { subscription.unsubscribe() }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    
    if (engagementStatus !== 'approved') {
      alert(engagementStatus === 'pending' ? 'Waiting for admin approval...' : 'This engagement was rejected')
      return
    }
    
    const detection = detectRestrictedContent(newMessage)
    if (detection.hasRestricted) {
      alert(`Message blocked: Cannot share ${detection.types.map(t => getRestrictedTypeLabel(t)).join(', ')}`)
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
          .insert({ agent_id: agentId, player_id: playerId, is_active: true })
          .select()
          .single()
        if (newConv) convId = newConv.id
      }
      setActualConversationId(convId)
    }
    
    if (convId) {
      const { error } = await supabase.from('messages').insert({
        conversation_id: convId,
        sender_type: userType,
        sender_id: currentUserId,
        message: newMessage.trim(),
        is_read: false,
        has_restricted_content: false,
        created_at: new Date().toISOString()
      })
      
      if (!error) {
        await supabase.from('conversations').update({ last_message: newMessage.trim(), last_message_at: new Date().toISOString() }).eq('id', convId)
        setNewMessage('')
        if (onMessageSent) onMessageSent()
        await fetchMessages()
      }
    }
    
    setSending(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getStatusBadge = () => {
    switch (engagementStatus) {
      case 'approved': return { text: 'Active', color: 'bg-green-100 text-green-700', icon: null }
      case 'pending': return { text: 'Pending Admin Approval', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
      case 'rejected': return { text: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
      default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-50 to-blue-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-900">
            {userType === 'agent' ? otherPerson?.name || 'Player' : otherPerson?.name || 'Agent'}
          </h3>
          {engagementStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusBadge.color}`}>
              {statusBadge.icon && <statusBadge.icon className="w-3 h-3" />}
              {statusBadge.text}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      {engagementStatus !== 'approved' && (
        <div className={`p-3 text-sm flex items-center gap-2 ${engagementStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-b border-yellow-200' : 'bg-red-50 text-red-700 border-b border-red-200'}`}>
          {engagementStatus === 'pending' ? <Clock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{engagementStatus === 'pending' ? 'Pending admin approval. Messaging disabled.' : 'This engagement was rejected.'}</span>
        </div>
      )}

      {engagementStatus === 'approved' && restrictionLevel === 'restricted' && (
        <div className="p-3 text-sm bg-red-50 text-red-700 border-b border-red-200 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Restricted: No phone numbers, emails, or social media sharing.</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No messages yet</p>
            {engagementStatus === 'approved' && <p className="text-sm">Send a message to start the conversation</p>}
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg p-3 ${isCurrentUser ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <UserCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{isCurrentUser ? 'You' : (userType === 'agent' ? otherPerson?.name : otherPerson?.name)}</span>
                  </div>
                  <p className="text-sm break-words">{msg.message}</p>
                  <div className="flex justify-end items-center gap-1 mt-1">
                    <span className="text-xs opacity-70">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isCurrentUser && (msg.is_read ? <CheckCheck className="w-3 h-3" /> : <CheckCheck className="w-3 h-3 opacity-50" />)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {engagementStatus === 'approved' ? (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message... (Phone/email blocked)" className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" disabled={sending} />
            <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition disabled:opacity-50"><Send className="w-5 h-5" /></button>
          </div>
          <p className="text-xs text-gray-400 mt-2">⚠️ Personal contact info is automatically blocked for your safety.</p>
        </div>
      ) : engagementStatus === 'pending' ? (
        <div className="p-4 border-t bg-gray-50"><div className="text-center text-sm text-gray-500"><Clock className="w-4 h-4 mx-auto mb-1" />Waiting for admin approval...</div></div>
      ) : (
        <div className="p-4 border-t bg-gray-50"><div className="text-center text-sm text-red-500"><XCircle className="w-4 h-4 mx-auto mb-1" />This engagement was rejected.</div></div>
      )}
    </div>
  )
}