'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Search, MessageSquare, UserCircle, Eye, Shield, 
  AlertTriangle, CheckCircle, Clock, RefreshCw
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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
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
    const { data: { user } } = await supabase.auth.getUser()
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
            unread_count: unreadCount || 0
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
        supabase.from('agents').select('name').eq('id', conversation.agent_id).single(),
        supabase.from('players').select('name').eq('id', conversation.player_id).single()
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
          sender_name: msg.sender_type === 'agent' 
            ? (agent?.name || 'Unknown Agent')
            : (player?.name || 'Unknown Player')
        }))
        setMessages(messagesWithNames)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages([])
    }
    
    setMessagesLoading(false)
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    await fetchConversationMessages(conversation.id)
    
    // Mark all unread messages in this conversation as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation.id)
      .eq('is_read', false)

    if (!error) {
      // Update local state to remove unread badge
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      )
    }
    
    // Load existing admin note
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
      .update({ admin_notes: adminNoteInput.trim() })
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

  const filteredConversations = conversations.filter(conv => {
    const agentName = conv.agent?.name?.toLowerCase() || ''
    const playerName = conv.player?.name?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    return agentName.includes(search) || playerName.includes(search)
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            Conversation Monitor
          </h1>
          <p className="text-gray-600 mt-1">Monitor all agent-player communications</p>
        </div>

        <div className="flex h-full bg-white rounded-xl shadow overflow-hidden">
          {/* Sidebar - Conversations List */}
          <div className="w-80 border-r flex flex-col bg-gray-50">
            <div className="p-4 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by agent or player..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center px-4 py-2 border-b bg-white">
              <span className="text-xs text-gray-500">{conversations.length} conversations</span>
              <button
                onClick={fetchAllConversations}
                className="text-gray-400 hover:text-red-600 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const unreadCount = conv.unread_count || 0
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-4 border-b hover:bg-gray-100 transition relative ${
                        selectedConversation?.id === conv.id ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {conv.player?.profile_picture ? (
                          <img src={conv.player.profile_picture} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conv.player?.name || 'Unknown Player'}
                            </h3>
                            {conv.last_message_at && (
                              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Agent: {conv.agent?.name || 'Unknown Agent'}
                          </p>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conv.last_message}
                          </p>
                        </div>
                      </div>
                      
                      {/* Unread Count Badge - Positioned on the right edge of each conversation card */}
                      {unreadCount > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat Area - Message Viewer */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b bg-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedConversation.player?.profile_picture ? (
                        <img 
                          src={selectedConversation.player.profile_picture} 
                          className="w-10 h-10 rounded-full object-cover" 
                          alt={selectedConversation.player?.name}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.player?.name || 'Unknown Player'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Agent: {selectedConversation.agent?.name || 'Unknown Agent'} • 
                          {selectedConversation.agent?.agency || 'Independent Agent'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No messages in this conversation</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isAgent = msg.sender_type === 'agent'
                      return (
                        <div key={msg.id || idx} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[70%] rounded-lg p-3 ${
                            isAgent 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'bg-green-100 text-green-900'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold">
                                {isAgent ? 'Agent' : 'Player'}: {msg.sender_name || (isAgent ? 'Unknown Agent' : 'Unknown Player')}
                              </span>
                            </div>
                            <p className="text-sm break-words">{msg.message}</p>
                            <div className="flex justify-end mt-1">
                              <span className="text-xs opacity-70">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Saved Admin Note Display - Below messages */}
                {savedAdminNote && savedAdminNote.trim() !== '' && (
                  <div className="flex-shrink-0 mx-4 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-yellow-800">Admin Note (only visible to admins):</p>
                        <p className="text-sm text-yellow-700">{savedAdminNote}</p>
                      </div>
                      <button
                        onClick={clearAdminNote}
                        disabled={savingNote}
                        className="text-yellow-500 hover:text-yellow-700 text-lg leading-none disabled:opacity-50 flex-shrink-0"
                        title="Clear note"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin Note Input - Always at bottom */}
                <div className="flex-shrink-0 p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="Add admin note (only visible to admins)..."
                      className="flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          saveAdminNote()
                        }
                      }}
                      disabled={savingNote}
                    />
                    <button
                      onClick={saveAdminNote}
                      disabled={savingNote || !adminNoteInput.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {savingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Admin notes are visible only to other admins for monitoring purposes
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No conversation selected</h3>
                  <p className="text-gray-500 mt-1">Select a conversation from the left to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}