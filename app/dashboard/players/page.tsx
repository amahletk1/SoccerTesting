'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Eye } from 'lucide-react'

export default function BrowsePlayersPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [shortlisted, setShortlisted] = useState<string[]>([])
  const [agentId, setAgentId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    position: '',
    ageMin: '',
    ageMax: '',
    nationality: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAgentAndPlayers()
  }, [filters])

  const fetchAgentAndPlayers = async () => {
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
      
      const { data: shortlistData } = await supabase
        .from('shortlists')
        .select('player_id')
        .eq('agent_id', agent.id)
      
      if (shortlistData) {
        setShortlisted(shortlistData.map(s => s.player_id))
      }
    }

    let query = supabase
      .from('players')
      .select('*, player_stats(*)')
      .eq('status', 'approved')
    
    if (filters.position) {
      query = query.eq('position', filters.position)
    }
    if (filters.ageMin) {
      query = query.gte('age', parseInt(filters.ageMin))
    }
    if (filters.ageMax) {
      query = query.lte('age', parseInt(filters.ageMax))
    }
    if (filters.nationality) {
      query = query.ilike('nationality', `%${filters.nationality}%`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching players:', error)
    } else {
      setPlayers(data || [])
    }
    setLoading(false)
  }

  const handleAddToShortlist = async (playerId: string) => {
    if (!agentId) return

    if (shortlisted.includes(playerId)) {
      const { error } = await supabase
        .from('shortlists')
        .delete()
        .eq('agent_id', agentId)
        .eq('player_id', playerId)
      
      if (!error) {
        setShortlisted(shortlisted.filter(id => id !== playerId))
      }
    } else {
      const { error } = await supabase
        .from('shortlists')
        .insert({ agent_id: agentId, player_id: playerId })
      
      if (!error) {
        setShortlisted([...shortlisted, playerId])
      }
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
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent mb-2">Browse Players</h1>
      <p className="text-gray-600 mb-8">Discover and connect with elite football talent</p>

      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.position}
            onChange={(e) => setFilters({ ...filters, position: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Positions</option>
            <option value="Forward">Forward</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Defender">Defender</option>
            <option value="Goalkeeper">Goalkeeper</option>
          </select>
          
          <input
            type="number"
            placeholder="Min Age"
            value={filters.ageMin}
            onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />
          
          <input
            type="number"
            placeholder="Max Age"
            value={filters.ageMax}
            onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />
          
          <input
            type="text"
            placeholder="Nationality"
            value={filters.nationality}
            onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {players.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500">No players found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div key={player.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition border-t-4 border-red-500">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{player.name}</h3>
                    <p className="text-gray-600">{player.position}</p>
                  </div>
                  <button
                    onClick={() => handleAddToShortlist(player.id)}
                    className={`p-2 rounded-full transition ${
                      shortlisted.includes(player.id)
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    <Star className="w-6 h-6" fill={shortlisted.includes(player.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="font-semibold">{player.age}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Nation</p>
                    <p className="font-semibold">{player.nationality || '—'}</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Height</p>
                    <p className="font-semibold">{player.height_cm ? `${player.height_cm}cm` : '—'}</p>
                  </div>
                </div>

                {player.player_stats && player.player_stats.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Matches</p>
                        <p className="font-semibold">{player.player_stats[0]?.matches_played || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Goals</p>
                        <p className="font-semibold text-red-600">{player.player_stats[0]?.goals || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Assists</p>
                        <p className="font-semibold text-blue-600">{player.player_stats[0]?.assists || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  href={`/dashboard/players/${player.id}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
                >
                  <Eye className="w-4 h-4" />
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}