'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, AlertTriangle, CheckCircle, XCircle, Clock, Search } from 'lucide-react'

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        agent:agents(id, name, agency_name),
        player:players(id, name, position),
        engagement:engagements(status, restriction_level)
      `)
      .order('last_message_at', { ascending: false })
    if (data) setConversations(data)
    setLoading(false)
  }

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const selectConversation = async (conversation: any) => {
    setSelectedConversation(conversation)
    await fetchMessages(conversation.id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return { text: 'Active', color: 'bg-green-100 text-green-700' }
      case 'pending': return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' }
      case 'rejected': return { text: 'Rejected', color: 'bg-red-100 text-red-700' }
      default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-700' }
    }
  }

  const filteredConversations = conversations.filter(conv => 
    conv.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.player?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            Conversation Monitor
          </h1>
          <p className="text-gray-600 mt-1">Monitor all agent-player communications</p>
        </div>
        <button 
          onClick={fetchConversations} 
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by agent or player..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-9 pr-3 py-2 border rounded-lg" 
            />
          </div>
          
          {filteredConversations.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const statusBadge = getStatusBadge(conv.engagement?.status)
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full bg-white rounded-xl shadow p-4 text-left hover:shadow-md transition ${
                    selectedConversation?.id === conv.id ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {conv.agent?.name} ↔ {conv.player?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conv.agent?.agency_name} | {conv.player?.position}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.color}`}>
                      {statusBadge.text}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Messages Area */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.agent?.name} ↔ {selectedConversation.player?.name}
                    </h3>
                    <p className="text-xs text-gray-300 mt-1">
                      {selectedConversation.agent?.agency_name} | {selectedConversation.player?.position}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(selectedConversation.engagement?.status).color}`}>
                    {getStatusBadge(selectedConversation.engagement?.status).text}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'agent' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_type === 'agent' ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {msg.sender_type === 'agent' ? selectedConversation.agent?.name : selectedConversation.player?.name}
                          </span>
                          <span className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm break-words">{msg.message}</p>
                        {msg.has_restricted_content && (
                          <div className="mt-2 text-xs bg-red-100 text-red-700 rounded p-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Restricted content blocked
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}