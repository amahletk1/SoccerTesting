'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Chat from '@/app/components/Chat'
import { MessageSquare, Users, UserCircle, Clock } from 'lucide-react'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<string>('')
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
    let userId = ''
    
    if (agent) {
      type = 'agent'
      userId = agent.id
    } else {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (player) {
        type = 'player'
        userId = player.id
      }
    }
    setUserType(type)

    // Fetch conversations
    let query = supabase
      .from('conversations')
      .select(`
        *,
        agent:agents(name, user_id),
        player:players(name)
      `)
      .order('last_message_at', { ascending: false })
    
    if (type === 'agent') {
      query = query.eq('agent_id', userId)
    } else if (type === 'player') {
      query = query.eq('player_id', userId)
    }
    
    const { data } = await query
    
    if (data) setConversations(data)
    setLoading(false)
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
                <p className="text-sm">Connect with players or agents to start chatting</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                    selectedConversation?.id === conv.id ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-blue-100 rounded-full flex items-center justify-center">
                        {userType === 'agent' ? (
                          <Users className="w-5 h-5 text-blue-600" />
                        ) : (
                          <UserCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {userType === 'agent' ? conv.player?.name : conv.agent?.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-[150px]">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </button>
              ))
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
              onClose={() => setSelectedConversation(null)}
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