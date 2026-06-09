'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Chat from '@/app/components/Chat'
import { MessageSquare, UserCircle, Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react'

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
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          const newMessage = payload.new
          // If message is not from current user and belongs to one of our conversations
          if (newMessage.sender_id !== currentUserId) {
            // Increment unread count for that conversation
            setUnreadCounts(prev => ({
              ...prev,
              [newMessage.conversation_id]: (prev[newMessage.conversation_id] || 0) + 1
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
    const { data: { user } } = await supabase.auth.getUser()
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
      const convWithLastMsg = await Promise.all(data.map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('message, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
        return { 
          ...conv, 
          last_message: lastMsg?.[0]?.message || 'No messages yet', 
          last_message_time: lastMsg?.[0]?.created_at 
        }
      }))
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
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }))
  }

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation)
    await markConversationAsRead(conversation.id)
  }

  const getEngagementBadge = (status: string) => {
    switch (status) {
      case 'approved': return { text: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'pending': return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
      case 'rejected': return { text: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
      default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
    }
  }

  const filteredConversations = conversations.filter(conv => 
    conv.player?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="flex h-full bg-white rounded-xl shadow overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b bg-gradient-to-r from-red-600 to-red-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Messages
              </h2>
              {totalUnread > 0 && (
                <span className="bg-yellow-400 text-red-900 text-xs font-bold px-2 py-1 rounded-full">
                  {totalUnread} new
                </span>
              )}
            </div>
            <p className="text-red-100 text-xs mt-1">{conversations.length} conversations</p>
          </div>
          
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by player name..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500" 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <Link href="/dashboard/players" className="inline-block mt-4 text-red-600 text-sm hover:underline">
                  Browse Players →
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const badge = getEngagementBadge(conv.engagement?.status)
                const BadgeIcon = badge.icon
                const unreadCount = unreadCounts[conv.id] || 0
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition relative ${
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
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900 truncate">{conv.player?.name}</h3>
                          {conv.last_message_time && (
                            <span className="text-xs text-gray-400">{new Date(conv.last_message_time).toLocaleDateString()}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{conv.player?.position}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-sm truncate max-w-[150px] ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {conv.last_message}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${badge.color}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Unread Message Badge */}
                    {unreadCount > 0 && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1">
          {selectedConversation ? (
            <Chat
              conversationId={selectedConversation.id}
              agentId={agentId}
              playerId={selectedConversation.player_id}
              currentUserId={currentUserId}
              userType="agent"
              engagementStatus={selectedConversation.engagement?.status}
              restrictionLevel={selectedConversation.engagement?.restriction_level}
              onClose={() => setSelectedConversation(null)}
              onMessageRead={() => {
                // Refresh unread counts when messages are read
                fetchUnreadCounts(agentId)
                fetchConversations(agentId)
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No conversation selected</h3>
                <p className="text-gray-500 mt-1">Select a conversation from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}