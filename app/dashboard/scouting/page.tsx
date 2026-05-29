'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, Filter, Eye, Star, TrendingUp, Users,
  Calendar, MapPin, Target, BarChart3, ArrowUpDown,
  UserPlus, Briefcase, Activity, Zap, Flame, XCircle,
  FileText, CheckCircle, AlertCircle, MessageSquare, Heart, Trophy
} from 'lucide-react'

export default function ScoutingPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<any[]>([])
  const [hotProspects, setHotProspects] = useState<any[]>([])
  const [filters, setFilters] = useState({
    position: '',
    ageMin: '',
    ageMax: '',
    nationality: '',
    sortBy: 'recent'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [scoutId, setScoutId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchScoutAndPlayers()
  }, [filters])

  const fetchScoutAndPlayers = async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: scout } = await supabase
      .from('scouts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (scout) {
      setScoutId(scout.id)
      
      const { data: reportsData } = await supabase
        .from('scouting_reports')
        .select('player_id')
        .eq('scout_id', scout.id)
      
      if (reportsData) {
        setReports(reportsData)
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
    
    if (filters.sortBy === 'goals') {
      query = query.order('player_stats.goals', { ascending: false })
    } else if (filters.sortBy === 'age') {
      query = query.order('age', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching players:', error)
    } else {
      setPlayers(data || [])
    }
    
    const { data: hotData } = await supabase
      .from('players')
      .select('*, player_stats(*)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (hotData) setHotProspects(hotData)
    
    setLoading(false)
  }

  const hasReport = (playerId: string) => {
    return reports.some(r => r.player_id === playerId)
  }

  const toggleCompare = (playerId: string) => {
    if (selectedForCompare.includes(playerId)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== playerId))
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([...selectedForCompare, playerId])
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
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            Talent Discovery
          </h1>
          <p className="text-gray-600 mt-1">Find and evaluate the next generation of football stars</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="goals">Most Goals</option>
                <option value="age">Youngest First</option>
              </select>
            </div>
            <button
              onClick={() => setFilters({
                position: '', ageMin: '', ageMax: '', nationality: '', sortBy: 'recent'
              })}
              className="text-sm text-red-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {hotProspects.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-yellow-50 to-orange-50 rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">🔥 Hot Prospects</h2>
            <span className="text-xs text-gray-500">Recommended for you</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {hotProspects.map((player) => (
              <div key={player.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{player.name}</h3>
                    <p className="text-sm text-gray-500">{player.position}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">8.5</span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-gray-400" />
                    <span>Goals: {player.player_stats?.[0]?.goals || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-gray-400" />
                    <span>Assists: {player.player_stats?.[0]?.assists || 0}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {hasReport(player.id) ? (
                    <span className="flex-1 text-center text-sm bg-green-100 text-green-700 px-3 py-1 rounded">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Reported
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/scouting/reports/new/${player.id}`}
                      className="flex-1 text-center text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Create Report
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/players/${player.id}`}
                    className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => {
            setCompareMode(!compareMode)
            setSelectedForCompare([])
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            compareMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {compareMode ? 'Exit Compare Mode' : 'Compare Players'}
          {compareMode && selectedForCompare.length > 0 && (
            <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">
              {selectedForCompare.length}/3
            </span>
          )}
        </button>
      </div>

      {players.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No players found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const reported = hasReport(player.id)
            return (
              <div key={player.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition border-t-4 border-red-500">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{player.name}</h3>
                      <p className="text-gray-600">{player.position}</p>
                    </div>
                    {compareMode && (
                      <button
                        onClick={() => toggleCompare(player.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedForCompare.includes(player.id)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {selectedForCompare.includes(player.id) && '✓'}
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Age {player.age}</span>
                    <MapPin className="w-4 h-4 ml-2" />
                    <span>{player.nationality || 'N/A'}</span>
                  </div>

                  {player.player_stats && player.player_stats.length > 0 && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
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

                  <div className="mt-4 flex gap-2">
                    {reported ? (
                      <span className="flex-1 text-center py-2 bg-green-100 text-green-700 rounded-lg text-sm flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Report Submitted
                      </span>
                    ) : (
                      <Link
                        href={`/dashboard/scouting/reports/new/${player.id}`}
                        className="flex-1 text-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center justify-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        Create Report
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/players/${player.id}`}
                      className="flex-1 text-center py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {compareMode && selectedForCompare.length >= 2 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href={`/dashboard/compare?players=${selectedForCompare.join(',')}`}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            <BarChart3 className="w-5 h-5" />
            Compare {selectedForCompare.length} Players
          </Link>
        </div>
      )}
    </div>
  )
}