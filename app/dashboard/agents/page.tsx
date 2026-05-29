'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, Filter, MapPin, Briefcase, Star, Eye, 
  CheckCircle, Clock, XCircle, UserCircle, MessageSquare,
  Award, Globe, ChevronRight
} from 'lucide-react'

export default function AgentsDirectoryPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    verification: 'verified', // 'verified', 'pending', 'all'
    specialization: '',
    location: ''
  })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndFetchAgents()
  }, [filters, searchTerm])

  const checkUserAndFetchAgents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Determine user role
    const { data: player } = await supabase.from('players').select('id').eq('user_id', user.id).single()
    if (player) {
      setUserRole('player')
      setCurrentUserId(player.id)
    } else {
      const { data: agent } = await supabase.from('agents').select('id').eq('user_id', user.id).single()
      if (agent) {
        setUserRole('agent')
      } else {
        const { data: scout } = await supabase.from('scouts').select('id').eq('user_id', user.id).single()
        if (scout) {
          setUserRole('scout')
        } else {
          const { data: admin } = await supabase.from('admins').select('id').eq('user_id', user.id).single()
          if (admin) setUserRole('admin')
        }
      }
    }

    await fetchAgents()
  }

  const fetchAgents = async () => {
    setLoading(true)

    let query = supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply verification filter
    if (filters.verification === 'verified') {
      query = query.eq('verification_status', 'verified')
    } else if (filters.verification === 'pending') {
      query = query.eq('verification_status', 'pending')
    }

    // Apply search
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,agency.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
    }

    // Apply location filter
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching agents:', error)
    } else {
      // Filter by specialization if needed (client-side since specializations is an array)
      let filteredAgents = data || []
      if (filters.specialization) {
        filteredAgents = filteredAgents.filter(agent => 
          agent.specializations?.includes(filters.specialization)
        )
      }
      setAgents(filteredAgents)
    }
    setLoading(false)
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return { text: 'Verified', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'rejected':
        return { text: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
      default:
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
    }
  }

  // Get unique specializations from all agents for filter dropdown
  const allSpecializations = [...new Set(agents.flatMap(a => a.specializations || []))]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            Agents Directory
          </h1>
          <p className="text-gray-600 mt-1">Browse and connect with verified football agents</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by agent name, agency, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
              <select
                value={filters.verification}
                onChange={(e) => setFilters({ ...filters, verification: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Only</option>
                <option value="all">All Agents</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <select
                value={filters.specialization}
                onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Specializations</option>
                {allSpecializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g., Johannesburg, Cape Town"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ verification: 'verified', specialization: '', location: '' })}
              className="text-sm text-red-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Found {agents.length} agent{agents.length !== 1 ? 's' : ''}
      </div>

      {/* Agents Grid */}
      {agents.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No agents found matching your criteria</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilters({ verification: 'verified', specialization: '', location: '' })
            }}
            className="mt-4 text-red-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const verificationBadge = getVerificationBadge(agent.verification_status)
            const VerificationIcon = verificationBadge.icon

            return (
              <div key={agent.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition border-t-4 border-blue-500">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {agent.profile_picture ? (
                        <img
                          src={agent.profile_picture}
                          alt={agent.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                          <Briefcase className="w-7 h-7 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{agent.name || 'Unnamed Agent'}</h3>
                        <p className="text-sm text-gray-500">{agent.agency || 'Independent Agent'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${verificationBadge.color}`}>
                      <VerificationIcon className="w-3 h-3" />
                      {verificationBadge.text}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2">
                    {agent.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{agent.location}</span>
                      </div>
                    )}
                    {agent.years_experience && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{agent.years_experience}+ years experience</span>
                      </div>
                    )}
                  </div>

                  {/* Specializations */}
                  {agent.specializations?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {agent.specializations.slice(0, 3).map((spec: string) => (
                        <span key={spec} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          {spec}
                        </span>
                      ))}
                      {agent.specializations.length > 3 && (
                        <span className="text-xs text-gray-400">+{agent.specializations.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Languages */}
                  {agent.languages?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {agent.languages.slice(0, 2).map((lang: string) => (
                        <span key={lang} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {lang}
                        </span>
                      ))}
                      {agent.languages.length > 2 && (
                        <span className="text-xs text-gray-400">+{agent.languages.length - 2} more</span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-5 flex gap-2">
                    <Link
                      href={`/dashboard/agent/view/${agent.id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </Link>
                    
                    {userRole === 'player' && (
                      <Link
                        href={`/dashboard/player/messages?agent=${agent.id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}