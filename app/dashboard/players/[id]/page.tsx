'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Star, Mail, Video, Image, MapPin, Calendar, 
  TrendingUp, Award, Heart, Eye, CheckCircle, User, 
  Trophy, Activity, Share2, MessageCircle, ThumbsUp, 
  Users, Target, Zap, Shield, Briefcase, DollarSign, Clock,
  FileText, Plus, Trash2, Edit2, Save, X
} from 'lucide-react'

interface PlayerProfilePageProps {
  params: Promise<{ id: string }>
}

export default function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [seasonStats, setSeasonStats] = useState<any[]>([])
  const [careerHistory, setCareerHistory] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [achievements, setAchievements] = useState<string[]>([])
  const [performanceRatings, setPerformanceRatings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [isShortlisted, setIsShortlisted] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newAchievement, setNewAchievement] = useState('')
  
  const [newSeasonStat, setNewSeasonStat] = useState({
    season: '',
    competition: '',
    club: '',
    appearances: 0,
    goals: 0,
    assists: 0,
    minutes_played: 0,
    yellow_cards: 0,
    red_cards: 0,
    pass_accuracy: 0,
    shot_accuracy: 0
  })
  
  const [newCareerEntry, setNewCareerEntry] = useState({
    club_name: '',
    league: '',
    country: '',
    start_date: '',
    end_date: '',
    is_current: false,
    transfer_type: 'Permanent',
    transfer_fee: '',
    appearances: 0,
    goals: 0,
    assists: 0
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params
      setPlayerId(id)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (playerId) {
      fetchPlayerData()
      fetchUserRole()
    }
  }, [playerId])

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: scout } = await supabase
      .from('scouts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (scout) {
      setUserRole('scout')
      return
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (agent) {
      setUserRole('agent')
      setAgentId(agent.id)
      return
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (admin) {
      setUserRole('admin')
    }
  }

  const fetchPlayerData = async () => {
    if (!playerId) return
    setLoading(true)
    
    const { data: playerData } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()
    
    setPlayer(playerData)
    
    if (playerData?.achievements && Array.isArray(playerData.achievements)) {
      setAchievements(playerData.achievements)
    }
    
    if (playerData?.performance_ratings) {
      setPerformanceRatings(playerData.performance_ratings)
    }

    if (playerData) {
      const { data: mediaData } = await supabase
        .from('media')
        .select('*')
        .eq('player_id', playerData.id)
        .order('created_at', { ascending: false })
      
      if (mediaData) setMedia(mediaData)
    }

    const { data: seasonData } = await supabase
      .from('season_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('season', { ascending: false })
    
    if (seasonData) setSeasonStats(seasonData)

    const { data: careerData } = await supabase
      .from('career_history')
      .select('*')
      .eq('player_id', playerId)
      .order('start_date', { ascending: false })
    
    if (careerData) setCareerHistory(careerData)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && userRole === 'agent') {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (agent) {
        setAgentId(agent.id)
        
        const { data: shortlistData } = await supabase
          .from('shortlists')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('player_id', playerId)
          .maybeSingle()
        
        setIsShortlisted(!!shortlistData)
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

    const { error } = await supabase
      .from('engagements')
      .insert({
        agent_id: agentId,
        player_id: playerId,
        status: 'pending'
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Engagement request sent! Admin will review it.')
    }
    setRequesting(false)
  }

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([...achievements, newAchievement.trim()])
      setNewAchievement('')
    }
  }

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index))
  }

  const saveAchievements = async () => {
    const { error } = await supabase
      .from('players')
      .update({ achievements: achievements })
      .eq('id', playerId)

    if (error) {
      alert('Error saving achievements: ' + error.message)
    } else {
      alert('Achievements saved!')
      setEditing(false)
      fetchPlayerData()
    }
  }

  const saveRatings = async () => {
    const { error } = await supabase
      .from('players')
      .update({ performance_ratings: performanceRatings })
      .eq('id', playerId)

    if (error) {
      alert('Error saving ratings: ' + error.message)
    } else {
      alert('Ratings saved!')
      setEditing(false)
      fetchPlayerData()
    }
  }

  const addSeasonStat = async () => {
    if (!newSeasonStat.season || !newSeasonStat.competition || !newSeasonStat.club) {
      alert('Please fill in season, competition, and club')
      return
    }

    const { error } = await supabase
      .from('season_stats')
      .insert({
        player_id: playerId,
        season: newSeasonStat.season,
        competition: newSeasonStat.competition,
        club: newSeasonStat.club,
        appearances: newSeasonStat.appearances,
        goals: newSeasonStat.goals,
        assists: newSeasonStat.assists,
        minutes_played: newSeasonStat.minutes_played,
        yellow_cards: newSeasonStat.yellow_cards,
        red_cards: newSeasonStat.red_cards,
        pass_accuracy: newSeasonStat.pass_accuracy,
        shot_accuracy: newSeasonStat.shot_accuracy
      })

    if (error) {
      alert('Error adding season stats: ' + error.message)
    } else {
      alert('Season stats added!')
      setNewSeasonStat({
        season: '', competition: '', club: '', appearances: 0, goals: 0, assists: 0,
        minutes_played: 0, yellow_cards: 0, red_cards: 0, pass_accuracy: 0, shot_accuracy: 0
      })
      fetchPlayerData()
    }
  }

  const deleteSeasonStat = async (id: string) => {
    if (!confirm('Delete this season stat?')) return
    const { error } = await supabase.from('season_stats').delete().eq('id', id)
    if (!error) fetchPlayerData()
  }

  const addCareerEntry = async () => {
    if (!newCareerEntry.club_name) {
      alert('Please enter club name')
      return

       // DEBUG: Log the exact value being sent
  console.log('=== DEBUG CAREER ENTRY ===')
  console.log('transfer_type value:', JSON.stringify(newCareerEntry.transfer_type))
  console.log('transfer_type type:', typeof newCareerEntry.transfer_type)
  console.log('Full entry:', newCareerEntry)
    }

    const { error } = await supabase
      .from('career_history')
      .insert({
        player_id: playerId,
        club_name: newCareerEntry.club_name,
        league: newCareerEntry.league,
        country: newCareerEntry.country,
        start_date: newCareerEntry.start_date || null,
        end_date: newCareerEntry.is_current ? null : (newCareerEntry.end_date || null),
        is_current: newCareerEntry.is_current,
        transfer_type: newCareerEntry.transfer_type,
        transfer_fee: newCareerEntry.transfer_fee ? parseFloat(newCareerEntry.transfer_fee) : null,
        appearances: newCareerEntry.appearances,
        goals: newCareerEntry.goals,
        assists: newCareerEntry.assists
      })

    if (error) {
      alert('Error adding career entry: ' + error.message)
    } else {
      alert('Career entry added!')
      setNewCareerEntry({
        club_name: '', league: '', country: '', start_date: '', end_date: '',
        is_current: false, transfer_type: 'Permanent',
        transfer_fee: '',
        appearances: 0, goals: 0, assists: 0
      })
      fetchPlayerData()
    }
  }

  const deleteCareerEntry = async (id: string) => {
    if (!confirm('Delete this career entry?')) return
    const { error } = await supabase.from('career_history').delete().eq('id', id)
    if (!error) fetchPlayerData()
  }

  const updateRating = (key: string, value: number) => {
    setPerformanceRatings({ ...performanceRatings, [key]: value })
  }

  const totalGoals = seasonStats.reduce((sum, stat) => sum + (stat.goals || 0), 0)
  const totalAssists = seasonStats.reduce((sum, stat) => sum + (stat.assists || 0), 0)
  const totalAppearances = seasonStats.reduce((sum, stat) => sum + (stat.appearances || 0), 0)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Player not found</p>
        <Link href="/dashboard/players" className="text-red-600 hover:underline mt-4 inline-block">
          Back to Players
        </Link>
      </div>
    )
  }

  const otherMedia = media.filter(m => !m.url?.includes('profile'))

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/dashboard/players" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Players
      </Link>

      <div className="flex justify-end gap-2 mb-4">
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="flex items-center gap-2 bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={saveAchievements} className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition">
              <Save className="w-4 h-4" /> Save Achievements
            </button>
            <button onClick={saveRatings} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              <Save className="w-4 h-4" /> Save Ratings
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 bg-white shadow px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <Edit2 className="w-4 h-4" /> Edit Achievements & Ratings
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            {player?.profile_picture ? (
              <img src={player.profile_picture} alt={player.name} className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-2xl" />
            ) : (
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white/20 border-4 border-white shadow-2xl flex items-center justify-center">
                <User className="w-20 h-20 text-white" />
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
              <CheckCircle className="w-3 h-3" /> Verified Player
            </div>
          </div>

          <div className="text-center md:text-left text-white flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{player?.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-white/80">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {player?.nationality || 'Location not set'}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Age {player?.age || '?'}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{player?.position || 'Position not set'}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
              {userRole === 'agent' && (
                <>
                  <button onClick={handleShortlist} className={`px-6 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${isShortlisted ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                    <Star className="w-4 h-4" fill={isShortlisted ? 'currentColor' : 'none'} />
                    {isShortlisted ? 'Shortlisted' : 'Add to Shortlist'}
                  </button>
                  <button onClick={handleRequestEngagement} disabled={requesting} className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> {requesting ? 'Sending...' : 'Request Engagement'}
                  </button>
                </>
              )}
              {userRole === 'scout' && (
                <Link href={`/dashboard/scouting/reports/new/${player.id}`} className="bg-green-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Create Scouting Report
                </Link>
              )}
              <button className="bg-white/20 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-red-500">
          <TrendingUp className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalAppearances || 0}</p>
          <p className="text-xs text-gray-500">Matches Played</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-yellow-500">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalGoals || 0}</p>
          <p className="text-xs text-gray-500">Goals Scored</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-blue-500">
          <Heart className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalAssists || 0}</p>
          <p className="text-xs text-gray-500">Assists</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-purple-500">
          <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{player?.views_count || 0}</p>
          <p className="text-xs text-gray-500">Profile Views</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-red-600" /> About the Player</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Full Name</span><span className="font-medium">{player?.name || '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Position</span><span className="font-medium">{player?.position || '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Age</span><span className="font-medium">{player?.age ? `${player.age} years` : '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Nationality</span><span className="font-medium">{player?.nationality || '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Preferred Foot</span><span className="font-medium">{player?.preferred_foot || '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Height / Weight</span><span className="font-medium">{player?.height_cm ? `${player.height_cm} cm` : '—'} / {player?.weight_kg ? `${player.weight_kg} kg` : '—'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Jersey Number</span><span className="font-medium">{player?.jersey_number || '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Current Club</span><span className="font-medium">{player?.current_club || '-'}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Market Value</span><span className="font-medium">{player?.market_value ? `€${(player.market_value / 1000000).toFixed(1)}M` : '-'}</span></div>
            </div>
          </div>

          {performanceRatings && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-green-600" /> Performance Rating</h2>
              <div className="space-y-4">
                {Object.entries(performanceRatings).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{key}</span>
                      {editing ? (
                        <input type="number" value={value} onChange={(e) => updateRating(key, parseInt(e.target.value))} className="w-16 px-2 py-1 border rounded text-sm" min="0" max="100" />
                      ) : (
                        <span className="font-semibold">{value}/100</span>
                      )}
                    </div>
                    {!editing && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 rounded-full h-2" style={{ width: `${value}%` }}></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-600" /> Achievements</h2>
            {editing ? (
              <>
                <div className="space-y-2 mb-3">
                  {achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm">{achievement}</span>
                      <button onClick={() => removeAchievement(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input type="text" value={newAchievement} onChange={(e) => setNewAchievement(e.target.value)} placeholder="Add achievement (e.g., Top Scorer 2023)" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button onClick={addAchievement} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"><Plus className="w-4 h-4" /> Add</button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {achievements.length === 0 ? <p className="text-gray-500 text-sm">No achievements added yet</p> : achievements.map((achievement, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm"><Trophy className="w-4 h-4 text-yellow-500" /><span>{achievement}</span></div>
                ))}
              </div>
            )}
          </div>

          {player?.bio && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-blue-600" /> Biography</h2>
              <p className="text-gray-700 leading-relaxed">{player.bio}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Season Stat Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Add Season Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Season *</label><input type="text" value={newSeasonStat.season} onChange={(e) => setNewSeasonStat({ ...newSeasonStat, season: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="2023/2024" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Competition *</label><input type="text" value={newSeasonStat.competition} onChange={(e) => setNewSeasonStat({ ...newSeasonStat, competition: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Premier League" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Club *</label><input type="text" value={newSeasonStat.club} onChange={(e) => setNewSeasonStat({ ...newSeasonStat, club: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Club name" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Appearances</label><input type="number" value={newSeasonStat.appearances} onChange={(e) => setNewSeasonStat({ ...newSeasonStat, appearances: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Goals</label><input type="number" value={newSeasonStat.goals} onChange={(e) => setNewSeasonStat({ ...newSeasonStat, goals: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Assists</label><input type="number" value={newSeasonStat.assists} onChange={(e) => setNewSeasonStat({ ...newSeasonStat, assists: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <button onClick={addSeasonStat} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"><Plus className="w-4 h-4 inline mr-2" /> Add Season Stats</button>
          </div>

          {/* Career Statistics Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" /> Career Statistics</h2>
            {seasonStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No season statistics available yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-sm font-semibold">Season</th><th className="px-4 py-2 text-center text-sm font-semibold">Competition</th><th className="px-4 py-2 text-center text-sm font-semibold">Apps</th><th className="px-4 py-2 text-center text-sm font-semibold">Goals</th><th className="px-4 py-2 text-center text-sm font-semibold">Assists</th><th className="px-4 py-2 text-center"></th></tr></thead>
                  <tbody>
                    {seasonStats.map((stat, idx) => (
                      <tr key={stat.id} className={idx !== seasonStats.length - 1 ? 'border-b' : ''}>
                        <td className="px-4 py-3 text-sm font-medium">{stat.season}</td>
                        <td className="px-4 py-3 text-center text-sm">{stat.competition || '-'}</td>
                        <td className="px-4 py-3 text-center text-sm">{stat.appearances || 0}</td>
                        <td className="px-4 py-3 text-center text-sm text-green-600 font-semibold">{stat.goals || 0}</td>
                        <td className="px-4 py-3 text-center text-sm text-blue-600 font-semibold">{stat.assists || 0}</td>
                        <td className="px-4 py-3 text-center"><button onClick={() => deleteSeasonStat(stat.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Career Entry Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-green-600" /> Add Career History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label><input type="text" value={newCareerEntry.club_name} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, club_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Kaizer Chiefs" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">League</label><input type="text" value={newCareerEntry.league} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, league: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., DStv Premiership" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input type="text" value={newCareerEntry.country} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, country: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., South Africa" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={newCareerEntry.start_date} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={newCareerEntry.end_date} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, end_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" disabled={newCareerEntry.is_current} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
                <select value={newCareerEntry.transfer_type} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, transfer_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="Permanent">Permanent Transfer</option>
                  <option value="Loan">Loan</option>
                  <option value="Free Transfer">Free Transfer</option>
                  <option value="Academy">Academy</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Transfer Fee (€)</label><input type="number" value={newCareerEntry.transfer_fee} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, transfer_fee: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., 5000000" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Appearances</label><input type="number" value={newCareerEntry.appearances} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, appearances: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Goals</label><input type="number" value={newCareerEntry.goals} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, goals: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Assists</label><input type="number" value={newCareerEntry.assists} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, assists: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_current" checked={newCareerEntry.is_current} onChange={(e) => setNewCareerEntry({ ...newCareerEntry, is_current: e.target.checked, end_date: '' })} className="w-4 h-4" />
                <label htmlFor="is_current" className="text-sm font-medium text-gray-700">Current Club</label>
              </div>
            </div>
            <button onClick={addCareerEntry} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"><Plus className="w-4 h-4 inline mr-2" /> Add Career Entry</button>
          </div>

          {/* Career History List */}
          {careerHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-gray-600" /> Career History</h2>
              <div className="space-y-4">
                {careerHistory.map((entry) => (
                  <div key={entry.id} className="flex gap-4 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">{entry.club_name?.charAt(0) || 'C'}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{entry.club_name}</h4>
                      <p className="text-sm text-gray-500">{entry.league} • {entry.country}</p>
                      <p className="text-sm text-gray-600 mt-1">{entry.start_date ? new Date(entry.start_date).getFullYear() : '?'} - {entry.is_current ? 'Present' : (entry.end_date ? new Date(entry.end_date).getFullYear() : '')}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>{entry.appearances || 0} Apps</span>
                        <span className="text-green-600">{entry.goals || 0} Goals</span>
                        <span className="text-blue-600">{entry.assists || 0} Assists</span>
                        {entry.transfer_fee && entry.transfer_fee > 0 && <span className="text-purple-600">€{(entry.transfer_fee / 1000000).toFixed(1)}M</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteCareerEntry(entry.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Gallery */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Video className="w-5 h-5 text-purple-600" /> Highlight Gallery</h2>
            {otherMedia.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg"><Video className="w-16 h-16 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No highlight videos or images yet</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherMedia.map((item) => (
                  <div key={item.id} className="relative group">
                    {item.type === 'video' ? <video src={item.url} className="w-full h-48 object-cover rounded-lg" controls /> : <img src={item.url} alt={item.title || "Player highlight"} className="w-full h-48 object-cover rounded-lg" />}
                    {item.title && <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">{item.title}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}