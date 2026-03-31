'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, Filter, Star, Eye, TrendingUp, Calendar, 
  MapPin, Award, ChevronDown, Download, Share2,
  BarChart3, Users, Target, Activity
} from 'lucide-react'

export default function ScoutingPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [shortlisted, setShortlisted] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    position: '',
    ageMin: '',
    ageMax: '',
    nationality: '',
    minGoals: '',
    minAssists: '',
    minMatches: '',
    sortBy: 'recent'
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
    
    // Apply filters
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
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching players:', error)
    } else {
      // Apply stats filters and sorting
      let filteredData = data || []
      
      if (filters.minGoals) {
        filteredData = filteredData.filter(p => 
          p.player_stats?.[0]?.goals >= parseInt(filters.minGoals)
        )
      }
      if (filters.minAssists) {
        filteredData = filteredData.filter(p => 
          p.player_stats?.[0]?.assists >= parseInt(filters.minAssists)
        )
      }
      if (filters.minMatches) {
        filteredData = filteredData.filter(p => 
          p.player_stats?.[0]?.matches_played >= parseInt(filters.minMatches)
        )
      }
      
      // Sorting
      switch (filters.sortBy) {
        case 'goals':
          filteredData.sort((a, b) => (b.player_stats?.[0]?.goals || 0) - (a.player_stats?.[0]?.goals || 0))
          break
        case 'assists':
          filteredData.sort((a, b) => (b.player_stats?.[0]?.assists || 0) - (a.player_stats?.[0]?.assists || 0))
          break
        case 'age':
          filteredData.sort((a, b) => a.age - b.age)
          break
        case 'recent':
          filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break
      }
      
      setPlayers(filteredData)
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

  const handleExport = () => {
    const csvData = players.map(p => ({
      Name: p.name,
      Position: p.position,
      Age: p.age,
      Nationality: p.nationality,
      Goals: p.player_stats?.[0]?.goals || 0,
      Assists: p.player_stats?.[0]?.assists || 0,
      Matches: p.player_stats?.[0]?.matches_played || 0
    }))
    
    const csv = [Object.keys(csvData[0] || {}).join(','), 
      ...csvData.map(row => Object.values(row).join(','))]
      .join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `playerfynder_scouting_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const statsSummary = {
    totalPlayers: players.length,
    avgGoals: players.reduce((sum, p) => sum + (p.player_stats?.[0]?.goals || 0), 0) / (players.length || 1),
    topScorer: players.sort((a, b) => (b.player_stats?.[0]?.goals || 0) - (a.player_stats?.[0]?.goals || 0))[0],
    topAssists: players.sort((a, b) => (b.player_stats?.[0]?.assists || 0) - (a.player_stats?.[0]?.assists || 0))[0],
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            Scouting Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Discover and evaluate elite football talent</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Players</p>
              <p className="text-2xl font-bold text-red-600">{statsSummary.totalPlayers}</p>
            </div>
            <Users className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg. Goals/Player</p>
              <p className="text-2xl font-bold text-blue-600">{statsSummary.avgGoals.toFixed(1)}</p>
            </div>
            <Target className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Top Scorer</p>
              <p className="text-lg font-bold text-black truncate">{statsSummary.topScorer?.name || 'N/A'}</p>
              <p className="text-xs text-gray-500">{statsSummary.topScorer?.player_stats?.[0]?.goals || 0} goals</p>
            </div>
            <TrendingUp className="w-8 h-8 text-gray-300" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Top Playmaker</p>
              <p className="text-lg font-bold text-purple-600 truncate">{statsSummary.topAssists?.name || 'N/A'}</p>
              <p className="text-xs text-gray-500">{statsSummary.topAssists?.player_stats?.[0]?.assists || 0} assists</p>
            </div>
            <Activity className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-red-600" />
            Advanced Filters
          </h3>
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <input
              type="number"
              placeholder="Min Goals"
              value={filters.minGoals}
              onChange={(e) => setFilters({ ...filters, minGoals: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
            
            <input
              type="number"
              placeholder="Min Assists"
              value={filters.minAssists}
              onChange={(e) => setFilters({ ...filters, minAssists: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
            
            <input
              type="number"
              placeholder="Min Matches"
              value={filters.minMatches}
              onChange={(e) => setFilters({ ...filters, minMatches: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="recent">Most Recent</option>
              <option value="goals">Most Goals</option>
              <option value="assists">Most Assists</option>
              <option value="age">Youngest First</option>
            </select>
          </div>
        </div>
      )}

      {/* Players Grid */}
      {players.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center border-t-4 border-red-500">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No players match your scouting criteria</p>
          <button
            onClick={() => setFilters({
              position: '', ageMin: '', ageMax: '', nationality: '',
              minGoals: '', minAssists: '', minMatches: '', sortBy: 'recent'
            })}
            className="mt-4 text-red-600 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div key={player.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-to-r from-red-50 to-blue-50 p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{player.name}</h3>
                    <p className="text-gray-600">{player.position}</p>
                  </div>
                  <button
                    onClick={() => handleAddToShortlist(player.id)}
                    className={`p-2 rounded-full transition ${
                      shortlisted.includes(player.id)
                        ? 'text-yellow-500 bg-yellow-50'
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    <Star className="w-5 h-5" fill={shortlisted.includes(player.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Age: <strong>{player.age}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{player.nationality || 'N/A'}</span>
                  </div>
                </div>

                {player.player_stats && player.player_stats.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-3 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Matches</p>
                        <p className="font-bold text-gray-900">{player.player_stats[0]?.matches_played || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Goals</p>
                        <p className="font-bold text-red-600">{player.player_stats[0]?.goals || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Assists</p>
                        <p className="font-bold text-blue-600">{player.player_stats[0]?.assists || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/players/${player.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Scout Profile
                  </Link>
                  <button
                    onClick={() => handleAddToShortlist(player.id)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Share2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}