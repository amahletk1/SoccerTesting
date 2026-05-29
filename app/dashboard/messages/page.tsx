'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Chat from '@/app/components/Chat'
import { MessageSquare, Users, UserCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
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
        return { text: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'pending':
        return { text: 'Pending Admin Approval', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
      case 'rejected':
        return { text: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent mb-2">
        Messages
      </h1>
      <p className="text-gray-600 mb-8">Chat with your connections</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-red-50 to-blue-50">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
            <p className="text-sm text-gray-500">{conversations.length} chats</p>
          </div>
          
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">When agents contact you, they'll appear here</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherPerson = userType === 'agent' ? conv.player : conv.agent
                const statusBadge = getEngagementStatusBadge(conv.engagement?.status)
                const StatusIcon = statusBadge.icon
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                      selectedConversation?.id === conv.id ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {otherPerson?.profile_picture ? (
                            <img 
                              src={otherPerson.profile_picture} 
                              alt={otherPerson.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            userType === 'agent' ? (
                              <Users className="w-5 h-5 text-blue-600" />
                            ) : (
                              <UserCircle className="w-5 h-5 text-red-600" />
                            )
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 truncate">
                              {otherPerson?.name || 'Unknown'}
                            </p>
                            <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${statusBadge.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusBadge.text}
                            </span>
                          </div>
                          {userType === 'agent' && otherPerson?.position && (
                            <p className="text-xs text-gray-500">{otherPerson.position}</p>
                          )}
                          {userType === 'player' && conv.agent?.agency_name && (
                            <p className="text-xs text-gray-500">{conv.agent.agency_name}</p>
                          )}
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {conv.last_message_sender === userType ? 'You: ' : ''}
                            {conv.last_message}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-2 flex-shrink-0">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                          {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Chat
              conversationId={selectedConversation.id}
agentId={selectedConversation.agent_id}
playerId={selectedConversation.player_id}
              currentUserId={userId}
              userType={userType}
              engagementStatus={selectedConversation.engagement?.status}
              restrictionLevel={selectedConversation.engagement?.restriction_level}
              onClose={() => setSelectedConversation(null)}
              onMessageSent={() => fetchConversations()}
            />
          ) : (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}