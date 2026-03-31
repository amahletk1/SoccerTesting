'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Mail, Video, Image } from 'lucide-react'

interface PlayerProfilePageProps {
  params: Promise<{ id: string }>
}

export default function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [isShortlisted, setIsShortlisted] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Unwrap params using useEffect
  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params
      setPlayerId(id)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (playerId) {
      fetchPlayerAndAgent()
    }
  }, [playerId])

  const fetchPlayerAndAgent = async () => {
    if (!playerId) return
    setLoading(true)
    
    // Get player details
    const { data: playerData } = await supabase
      .from('players')
      .select('*, player_stats(*)')
      .eq('id', playerId)
      .single()
    
    setPlayer(playerData)

    // Fetch player media
    if (playerData) {
      const { data: mediaData } = await supabase
        .from('media')
        .select('*')
        .eq('player_id', playerData.id)
        .order('created_at', { ascending: false })
      
      if (mediaData) setMedia(mediaData)
    }

    // Get current agent
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user)

    if (user) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      console.log('Agent data:', agent, agentError)
      
      if (agent) {
        setAgentId(agent.id)
        
        // Check if player is shortlisted
        const { data: shortlistData } = await supabase
          .from('shortlists')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('player_id', playerId)
          .maybeSingle()
        
        setIsShortlisted(!!shortlistData)
      } else {
        console.log('No agent found for user')
      }
    }
    
    setLoading(false)
  }

  const handleShortlist = async () => {
    if (!agentId || !playerId) {
      alert('Please log in as an agent to shortlist players')
      return
    }

    if (isShortlisted) {
      const { error } = await supabase
        .from('shortlists')
        .delete()
        .eq('agent_id', agentId)
        .eq('player_id', playerId)
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        setIsShortlisted(false)
        alert('Removed from shortlist')
      }
    } else {
      const { error } = await supabase
        .from('shortlists')
        .insert({ agent_id: agentId, player_id: playerId })
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        setIsShortlisted(true)
        alert('Added to shortlist!')
      }
    }
  }

  const handleRequestEngagement = async () => {
    if (!agentId || !playerId) {
      alert('Please log in as an agent to request engagement')
      return
    }
    setRequesting(true)

    console.log('Requesting engagement:', { agentId, playerId })

    const { data, error } = await supabase
      .from('engagements')
      .insert({
        agent_id: agentId,
        player_id: playerId,
        status: 'pending'
      })
      .select()

    console.log('Engagement result:', { data, error })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Engagement request sent! Admin will review it.')
    }
    setRequesting(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Player not found</p>
        <Link href="/dashboard/players" className="text-green-600 hover:underline mt-4 inline-block">
          Back to Players
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/dashboard/players" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Players
      </Link>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{player.name}</h1>
              <p className="text-xl text-gray-600 mt-1">{player.position}</p>
            </div>
            <button
              onClick={handleShortlist}
              className={`p-3 rounded-full transition ${
                isShortlisted
                  ? 'text-yellow-500 bg-yellow-50'
                  : 'text-gray-400 bg-gray-100 hover:text-yellow-500'
              }`}
            >
              <Star className="w-6 h-6" fill={isShortlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Age</p>
              <p className="text-2xl font-bold">{player.age}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Nationality</p>
              <p className="text-2xl font-bold">{player.nationality || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Height / Weight</p>
              <p className="text-2xl font-bold">
                {player.height_cm ? `${player.height_cm}cm` : '—'} / {player.weight_kg ? `${player.weight_kg}kg` : '—'}
              </p>
            </div>
          </div>

          {player.player_stats && player.player_stats.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Matches Played</p>
                  <p className="text-3xl font-bold text-green-700">{player.player_stats[0]?.matches_played || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Goals</p>
                  <p className="text-3xl font-bold text-green-700">{player.player_stats[0]?.goals || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Assists</p>
                  <p className="text-3xl font-bold text-green-700">{player.player_stats[0]?.assists || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Media Gallery */}
          {media.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Highlight Reels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="bg-gray-100 rounded-lg overflow-hidden">
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        className="w-full aspect-video object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt="Player highlight"
                        className="w-full aspect-video object-cover"
                      />
                    )}
                    <div className="flex items-center justify-between p-2 bg-white">
                      <div className="flex items-center gap-1">
                        {item.type === 'video' ? (
                          <Video className="w-3 h-3 text-gray-500" />
                        ) : (
                          <Image className="w-3 h-3 text-gray-500" />
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t">
            <button
              onClick={handleRequestEngagement}
              disabled={requesting}
              className="w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              {requesting ? 'Sending...' : 'Request Engagement'}
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Your request will be reviewed by an admin before connecting with the player.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}