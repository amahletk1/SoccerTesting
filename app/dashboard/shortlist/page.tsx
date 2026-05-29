'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Eye, Trash2, Mail, Filter, X, CheckCircle, Clock, Users } from 'lucide-react'

export default function ShortlistPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState(false)
  const [engagementStatus, setEngagementStatus] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchShortlist()
  }, [])

  const fetchShortlist = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (agent) {
      setAgentId(agent.id)
      
      // Simplified query - get shortlist data first
      const { data: shortlistData, error } = await supabase
        .from('shortlists')
        .select('player_id, created_at')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching shortlist:', error)
        setPlayers([])
        setLoading(false)
        return
      }
      
      if (shortlistData && shortlistData.length > 0) {
        const playerIds = shortlistData.map(item => item.player_id)
        
        // Fetch player details separately
        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .in('id', playerIds)
        
        if (playersData) {
          // Merge shortlist data with player data
          const mergedPlayers = playersData.map(player => ({
            ...player,
            shortlisted_at: shortlistData.find(s => s.player_id === player.id)?.created_at
          }))
          setPlayers(mergedPlayers)
          
          // Check engagement status
          const { data: engagements } = await supabase
            .from('engagements')
            .select('player_id, status')
            .eq('agent_id', agent.id)
            .in('player_id', playerIds)
          
          if (engagements) {
            const statusMap: Record<string, string> = {}
            engagements.forEach(e => {
              statusMap[e.player_id] = e.status
            })
            setEngagementStatus(statusMap)
          }
        }
      } else {
        setPlayers([])
      }
    }
    setLoading(false)
  }

  const handleRemoveFromShortlist = async (playerId: string) => {
    if (!agentId) return

    const { error } = await supabase
      .from('shortlists')
      .delete()
      .eq('agent_id', agentId)
      .eq('player_id', playerId)
    
    if (!error) {
      setPlayers(players.filter(p => p.id !== playerId))
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId))
    }
  }

  const bulkRemove = async () => {
    if (!agentId || selectedPlayers.length === 0) return

    if (confirm(`Remove ${selectedPlayers.length} player(s) from shortlist?`)) {
      const { error } = await supabase
        .from('shortlists')
        .delete()
        .eq('agent_id', agentId)
        .in('player_id', selectedPlayers)
      
      if (!error) {
        setPlayers(players.filter(p => !selectedPlayers.includes(p.id)))
        setSelectedPlayers([])
        setBulkAction(false)
      }
    }
  }

  const bulkRequestEngagement = async () => {
    if (!agentId || selectedPlayers.length === 0) return

    if (confirm(`Send engagement requests to ${selectedPlayers.length} player(s)?`)) {
      let successCount = 0
      let alreadyRequested = 0

      for (const playerId of selectedPlayers) {
        const { data: existing } = await supabase
          .from('engagements')
          .select('id')
          .eq('agent_id', agentId)
          .eq('player_id', playerId)
          .maybeSingle()

        if (!existing) {
          const { error } = await supabase
            .from('engagements')
            .insert({
              agent_id: agentId,
              player_id: playerId,
              status: 'pending'
            })
          
          if (!error) {
            successCount++
            setEngagementStatus(prev => ({ ...prev, [playerId]: 'pending' }))
          }
        } else {
          alreadyRequested++
        }
      }

      alert(`Requests sent to ${successCount} player(s). ${alreadyRequested} already had pending requests.`)
    }
  }

  const toggleSelect = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId))
    } else {
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  const selectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(players.map(p => p.id))
    }
  }

  const getEngagementBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Request Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
      case 'accepted':
        return { text: 'Connected', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'declined':
        return { text: 'Declined', color: 'bg-red-100 text-red-700', icon: X }
      default:
        return null
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
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            My Shortlist
          </h1>
          <p className="text-gray-600 mt-1">
            {players.length} player{players.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        {players.length > 0 && (
          <button
            onClick={() => {
              setBulkAction(!bulkAction)
              setSelectedPlayers([])
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {bulkAction ? 'Cancel Bulk Actions' : 'Bulk Actions'}
          </button>
        )}
      </div>

      {players.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center border-t-4 border-red-500">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Your shortlist is empty</p>
          <p className="text-gray-400 text-sm mt-1">Browse players and click the star icon to add them here</p>
          <Link href="/dashboard/players" className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-lg hover:from-red-700 hover:to-blue-700 transition">
            Browse Players →
          </Link>
        </div>
      ) : (
        <>
          {bulkAction && selectedPlayers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">
                  {selectedPlayers.length} player(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={bulkRequestEngagement}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Request Engagement
                </button>
                <button
                  onClick={bulkRemove}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Selected
                </button>
              </div>
            </div>
          )}

          {bulkAction && players.length > 0 && (
            <div className="mb-4 flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm border">
              <input
                type="checkbox"
                checked={selectedPlayers.length === players.length && players.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label className="text-sm text-gray-600 font-medium">Select All Players</label>
              <span className="text-xs text-gray-400 ml-auto">
                {selectedPlayers.length} of {players.length} selected
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const engagementBadge = getEngagementBadge(engagementStatus[player.id])
              
              return (
                <div key={player.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition border-t-4 border-yellow-500 relative">
                  {bulkAction && (
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player.id)}
                        onChange={() => toggleSelect(player.id)}
                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 bg-white shadow-sm"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{player.name || 'Unnamed Player'}</h3>
                        <p className="text-gray-600">{player.position || 'Position not set'}</p>
                      </div>
                      {!bulkAction && (
                        <button
                          onClick={() => handleRemoveFromShortlist(player.id)}
                          className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Remove from shortlist"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="font-semibold">{player.age || '—'}</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Nation</p>
                        <p className="font-semibold truncate">{player.nationality || '—'}</p>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Height</p>
                        <p className="font-semibold">{player.height_cm ? `${player.height_cm}cm` : '—'}</p>
                      </div>
                    </div>

                    {engagementBadge && (
                      <div className={`mt-3 ${engagementBadge.color} rounded-lg p-2 flex items-center gap-2 text-xs`}>
                        <engagementBadge.icon className="w-3 h-3" />
                        <span>{engagementBadge.text}</span>
                      </div>
                    )}

                    {player.shortlisted_at && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Added {new Date(player.shortlisted_at).toLocaleDateString()}</span>
                      </div>
                    )}

                    <Link
                      href={`/dashboard/players/${player.id}`}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}