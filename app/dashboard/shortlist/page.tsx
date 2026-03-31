'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Eye, Trash2 } from 'lucide-react'

export default function ShortlistPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchShortlist()
  }, [])

  const fetchShortlist = async () => {
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
        .select('player_id, players(*, player_stats(*))')
        .eq('agent_id', agent.id)
      
      if (shortlistData) {
        setPlayers(shortlistData.map(s => s.players))
      }
    }
    setLoading(false)
  }

  const handleRemoveFromShortlist = async (playerId: string) => {
    if (!agentId) return

    await supabase
      .from('shortlists')
      .delete()
      .eq('agent_id', agentId)
      .eq('player_id', playerId)
    
    setPlayers(players.filter(p => p.id !== playerId))
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
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent mb-2">My Shortlist</h1>
      <p className="text-gray-600 mb-8">Players you've saved for future reference</p>

      {players.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center border-t-4 border-red-500">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Your shortlist is empty</p>
          <Link href="/dashboard/players" className="inline-block mt-4 text-red-600 hover:underline">
            Browse Players →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div key={player.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition border-t-4 border-blue-500">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{player.name}</h3>
                    <p className="text-gray-600">{player.position}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromShortlist(player.id)}
                    className="p-2 rounded-full text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-5 h-5" />
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
                    <p className="text-xs text-gray-500">Position</p>
                    <p className="font-semibold">{player.position}</p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/players/${player.id}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition"
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