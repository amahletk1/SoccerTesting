'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, UserCircle, MessageSquare, CheckCheck } from 'lucide-react'

interface Message {
  id: string
  conversation_id: string
  sender_type: string
  sender_id: string
  message: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  id: string
  agent_id: string
  player_id: string
  last_message: string
  last_message_at: string
  agent?: { name: string; user_id: string }
  player?: { name: string; user_id: string }
}

interface ChatProps {
  conversationId?: string
  agentId?: string
  playerId?: string
  onClose?: () => void
}

export default function Chat({ conversationId, agentId, playerId, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [userType, setUserType] = useState<'agent' | 'player' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUserId && (conversationId || (agentId && playerId))) {
      fetchMessages()
      subscribeToMessages()
    }
  }, [conversationId, agentId, playerId, currentUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      // Check if user is agent or player
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

  const fetchMessages = async () => {
    setLoading(true)
    
    let convId = conversationId
    
    // If no conversation ID, create one
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
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({ agent_id: agentId, player_id: playerId })
          .select()
          .single()
        
        if (newConv && !createError) {
          convId = newConv.id
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
      
      // Mark messages as read
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
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => [...prev, newMsg])
          
          // Mark as read if not from current user
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
      subscription.unsubscribe()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    
    let convId = conversationId
    
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
          .insert({ agent_id: agentId, player_id: playerId })
          .select()
          .single()
        
        if (newConv) {
          convId = newConv.id
          // Update last message
          await supabase
            .from('conversations')
            .update({ last_message: newMessage, last_message_at: new Date().toISOString() })
            .eq('id', convId)
        }
      }
    }
    
    if (convId) {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_type: userType,
          sender_id: currentUserId,
          message: newMessage.trim(),
          is_read: false
        })
      
      if (!error) {
        setNewMessage('')
        await supabase
          .from('conversations')
          .update({ last_message: newMessage.trim(), last_message_at: new Date().toISOString() })
          .eq('id', convId)
      }
    }
    
    setSending(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getSenderName = (message: Message) => {
    if (message.sender_type === 'agent') return 'Agent'
    return 'Player'
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-50 to-blue-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-900">Chat</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender_id === currentUserId
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {getSenderName(msg)}
                  </span>
                </div>
                <p className="text-sm">{msg.message}</p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-xs opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender_id === currentUserId && (
                    msg.is_read ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <CheckCheck className="w-3 h-3 opacity-50" />
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}