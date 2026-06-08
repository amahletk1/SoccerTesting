'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, User, MapPin, Briefcase, Trophy, Eye, 
  X, Loader2, Star
} from 'lucide-react'

export default function BrowsePlayersPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndLoadPlayers()
  }, [])

  const checkUserAndLoadPlayers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      await loadPlayers()
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const loadPlayers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, age, position, nationality, current_club, profile_picture')
        .order('name')

      if (error) {
        console.error('Error loading players:', error)
      } else {
        setPlayers(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter players based on search and position
  const filteredPlayers = players.filter(player => {
    const matchesSearch = searchTerm === '' || 
      player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPosition = selectedPosition === '' || 
      player.position === selectedPosition
    
    return matchesSearch && matchesPosition
  })

  const positions = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper']

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with gradient */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
          Browse Players
        </h1>
        <p className="text-gray-600 mt-2">Discover talented players and view their profiles</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-t-4 border-red-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Position Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Positions</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || selectedPosition) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedPosition('')
                }}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Found {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border-t-4 border-red-500">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No players found</p>
          <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <Link
              key={player.id}
              href={`/dashboard/players/${player.id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 block group border-t-4 border-red-500"
            >
              {/* Player Card Header with Red/Black/Blue Gradient */}
              <div className="relative h-32 bg-gradient-to-r from-red-600 via-black to-blue-600">
                <div className="absolute -bottom-12 left-4">
                  {player.profile_picture ? (
                    <img
                      src={player.profile_picture}
                      alt={player.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-600 to-blue-600 border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {getInitials(player.name)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Player Info */}
              <div className="pt-14 p-4">
                <div className="mb-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition">
                    {player.name || 'Unnamed Player'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      {player.position || 'Position not set'}
                    </span>
                    {player.age && (
                      <span className="text-gray-500 text-sm">
                        {player.age} years
                      </span>
                    )}
                  </div>
                </div>

                {/* Player Details */}
                <div className="space-y-2 mt-3">
                  {player.nationality && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>{player.nationality}</span>
                    </div>
                  )}
                  {player.current_club && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>{player.current_club}</span>
                    </div>
                  )}
                </div>

                {/* View Profile Button */}
                <div className="mt-4 pt-3 border-t">
                  <div className="text-red-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Profile
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}