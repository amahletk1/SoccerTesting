'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Chat from '@/app/components/Chat'
import { MessageSquare, UserCircle, Clock, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react'

export default function PlayerMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [playerId, setPlayerId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchPlayerAndConversations()
  }, [])

  const fetchPlayerAndConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).single()
    if (!player) { router.push('/dashboard'); return }

    setPlayerId(player.id)
    await fetchConversations(player.id)
  }

  const fetchConversations = async (playerId: string) => {
    setLoading(true)
    
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        agent:agents(id, name, agency_name, profile_picture),
        engagement:engagements(status, restriction_level)
      `)
      .eq('player_id', playerId)
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

  const getEngagementBadge = (status: string) => {
    switch (status) {
      case 'approved': return { text: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'pending': return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
      case 'rejected': return { text: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
      default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
    }
  }

  const filteredConversations = conversations.filter(conv => 
    conv.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages
            </h2>
            <p className="text-blue-100 text-xs mt-1">{conversations.length} conversations</p>
          </div>
          
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by agent name..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const badge = getEngagementBadge(conv.engagement?.status)
                const BadgeIcon = badge.icon
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {conv.agent?.profile_picture ? (
                        <img src={conv.agent.profile_picture} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900 truncate">{conv.agent?.name}</h3>
                          {conv.last_message_time && (
                            <span className="text-xs text-gray-400">{new Date(conv.last_message_time).toLocaleDateString()}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{conv.agent?.agency_name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate max-w-[150px]">{conv.last_message}</p>
                          <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${badge.color}`}>
                            <BadgeIcon className="w-3 h-3" />
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
        </div>

        {/* Chat Area */}
        <div className="flex-1">
          {selectedConversation ? (
            <Chat
              conversationId={selectedConversation.id}
              agentId={selectedConversation.agent_id}
              playerId={playerId}
              engagementStatus={selectedConversation.engagement?.status}
              restrictionLevel={selectedConversation.engagement?.restriction_level}
              onClose={() => setSelectedConversation(null)}
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