'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  Star,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Globe,
  ChevronRight,
  Shield,
  Users,
  SlidersHorizontal,
  Sparkles,
  BadgeCheck,
  Building2
} from 'lucide-react'

export default function AgentsDirectoryPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    verification: 'verified',
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
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (player) {
      setUserRole('player')
      setCurrentUserId(player.id)
    } else {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (agent) {
        setUserRole('agent')
      } else {
        const { data: scout } = await supabase
          .from('scouts')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (scout) {
          setUserRole('scout')
        } else {
          const { data: admin } = await supabase
            .from('admins')
            .select('id')
            .eq('user_id', user.id)
            .single()

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
      query = query.or(
        `name.ilike.%${searchTerm}%,agency.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
      )
    }

    // Apply location filter
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching agents:', error)
    } else {
      // Filter by specialization if needed
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
        return {
          text: 'Verified',
          color:
            'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          icon: CheckCircle
        }

      case 'rejected':
        return {
          text: 'Rejected',
          color: 'bg-red-500/10 text-red-300 border-red-500/20',
          icon: XCircle
        }

      default:
        return {
          text: 'Pending',
          color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
          icon: Clock
        }
    }
  }

  // Get unique specializations from all agents
  const allSpecializations = [
    ...new Set(agents.flatMap(a => a.specializations || []))
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b09] text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full bg-emerald-500/[0.08] blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-yellow-500/[0.04] blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <Briefcase className="absolute inset-0 m-auto w-5 h-5 text-emerald-400" />
          </div>

          <p className="text-sm text-slate-400">
            Loading agents...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b09] text-white relative overflow-hidden">
      {/* =========================================================
          AMBIENT BACKGROUND
      ========================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-72 left-1/4 w-[700px] h-[700px] rounded-full bg-emerald-500/[0.055] blur-3xl" />
        <div className="absolute top-1/3 -right-72 w-[600px] h-[600px] rounded-full bg-yellow-500/[0.025] blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* =========================================================
            HEADER
        ========================================================== */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b120f]/95 p-6 sm:p-8 mb-6">
          <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-yellow-500/5 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                </div>

                <span className="text-xs uppercase tracking-[0.18em] font-bold text-emerald-400/80">
                  PlayerFynder Network
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Agents Directory
                </h1>

                <Sparkles className="hidden sm:block w-5 h-5 text-yellow-400/70" />
              </div>

              <p className="text-slate-400 mt-2 max-w-2xl text-sm sm:text-base">
                Discover verified football agents and connect with professionals
                who can help take your career to the next level.
              </p>

              {/* Mini stats */}
              <div className="flex flex-wrap gap-3 mt-5">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.035] border border-white/10">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">
                    {agents.length}
                  </span>
                  <span className="text-xs text-slate-500">
                    {agents.length === 1 ? 'Agent' : 'Agents'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.035] border border-white/10">
                  <BadgeCheck className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-slate-400">
                    Verified network
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all border ${
                showFilters
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/[0.04] text-slate-200 border-white/10 hover:bg-white/[0.07] hover:border-emerald-500/20'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* =========================================================
            SEARCH
        ========================================================== */}
        <div className="relative mb-5">
          <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-500" />
          </div>

          <input
            type="text"
            placeholder="Search by agent name, agency, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-5 rounded-2xl bg-[#0b120f]/95 border border-white/10 text-white placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5"
          />
        </div>

        {/* =========================================================
            FILTERS
        ========================================================== */}
        {showFilters && (
          <div className="relative rounded-2xl border border-white/10 bg-[#0b120f]/95 p-5 sm:p-6 mb-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                <Filter className="w-4 h-4 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-white">
                  Directory Filters
                </h2>
                <p className="text-xs text-slate-500">
                  Refine the agents displayed below
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Verification */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Verification Status
                </label>

                <select
                  value={filters.verification}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      verification: e.target.value
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#08100d] border border-white/10 text-sm text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5"
                >
                  <option value="verified">Verified Only</option>
                  <option value="pending">Pending Only</option>
                  <option value="all">All Agents</option>
                </select>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Specialization
                </label>

                <select
                  value={filters.specialization}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      specialization: e.target.value
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#08100d] border border-white/10 text-sm text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5"
                >
                  <option value="">All Specializations</option>

                  {allSpecializations.map(spec => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Location
                </label>

                <input
                  type="text"
                  placeholder="e.g. Johannesburg, Cape Town"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      location: e.target.value
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#08100d] border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5"
                />
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-white/10 flex justify-end">
              <button
                onClick={() =>
                  setFilters({
                    verification: 'verified',
                    specialization: '',
                    location: ''
                  })
                }
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            RESULTS BAR
        ========================================================== */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-400">
              <span className="text-white font-semibold">
                {agents.length}
              </span>{' '}
              agent{agents.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Showing trusted professionals
          </div>
        </div>

        {/* =========================================================
            EMPTY STATE
        ========================================================== */}
        {agents.length === 0 ? (
          <div className="relative rounded-3xl border border-white/10 bg-[#0b120f]/95 p-12 sm:p-16 text-center overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white/[0.035] border border-white/10 flex items-center justify-center mb-5">
                <Briefcase className="w-9 h-9 text-slate-600" />
              </div>

              <h2 className="text-lg font-bold text-white mb-2">
                No agents found
              </h2>

              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No agents match your current search and filter criteria.
              </p>

              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilters({
                    verification: 'verified',
                    specialization: '',
                    location: ''
                  })
                }}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================
             AGENT GRID
          ========================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {agents.map((agent) => {
              const verificationBadge =
                getVerificationBadge(agent.verification_status)

              const VerificationIcon = verificationBadge.icon

              return (
                <div
                  key={agent.id}
                  className="group relative rounded-2xl border border-white/10 bg-[#0b120f]/95 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-950/20"
                >
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Card header glow */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/[0.035] blur-3xl group-hover:bg-emerald-500/[0.06] transition-all" />

                  <div className="relative p-5">

                    {/* =================================================
                       PROFILE HEADER
                    ================================================== */}
                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3 min-w-0">
                        {agent.profile_picture ? (
                          <img
                            src={agent.profile_picture}
                            alt={agent.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-950 to-[#101b15] border border-emerald-500/10 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-emerald-400/70" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-base truncate">
                            {agent.name || 'Unnamed Agent'}
                          </h3>

                          <p className="text-xs text-slate-500 truncate mt-1">
                            {agent.agency || 'Independent Agent'}
                          </p>

                          {agent.verification_status === 'verified' && (
                            <div className="flex items-center gap-1 mt-2">
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                                Verified
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${verificationBadge.color}`}
                      >
                        <VerificationIcon className="w-3 h-3" />
                        {verificationBadge.text}
                      </span>
                    </div>

                    {/* =================================================
                       DETAILS
                    ================================================== */}
                    <div className="mt-5 grid grid-cols-2 gap-2">

                      {agent.location && (
                        <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[9px] uppercase tracking-wider text-slate-600">
                              Location
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 truncate">
                            {agent.location}
                          </p>
                        </div>
                      )}

                      {agent.years_experience && (
                        <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-[9px] uppercase tracking-wider text-slate-600">
                              Experience
                            </span>
                          </div>

                          <p className="text-xs text-slate-300">
                            {agent.years_experience}+ years
                          </p>
                        </div>
                      )}

                      {!agent.location && !agent.years_experience && (
                        <div className="col-span-2 rounded-xl bg-white/[0.025] border border-white/[0.06] p-3">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs text-slate-500">
                              Professional football agent
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* =================================================
                       SPECIALIZATIONS
                    ================================================== */}
                    {agent.specializations?.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-slate-600">
                            Specializations
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {agent.specializations
                            .slice(0, 3)
                            .map((spec: string) => (
                              <span
                                key={spec}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/[0.07] border border-emerald-500/10 text-emerald-300 text-[10px] font-medium"
                              >
                                {spec}
                              </span>
                            ))}

                          {agent.specializations.length > 3 && (
                            <span className="px-2 py-1 text-[10px] text-slate-500">
                              +{agent.specializations.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* =================================================
                       LANGUAGES
                    ================================================== */}
                    {agent.languages?.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {agent.languages
                            .slice(0, 2)
                            .map((lang: string) => (
                              <span
                                key={lang}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.035] border border-white/[0.07] text-slate-400 text-[10px]"
                              >
                                <Globe className="w-3 h-3 text-slate-500" />
                                {lang}
                              </span>
                            ))}

                          {agent.languages.length > 2 && (
                            <span className="px-2 py-1 text-[10px] text-slate-500">
                              +{agent.languages.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* =================================================
                       ACTIONS
                    ================================================== */}
                    <div className="mt-5 pt-4 border-t border-white/[0.07] flex gap-2">

                      <Link
                        href={`/dashboard/agent/view/${agent.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/5"
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      {userRole === 'player' && (
                        <Link
                          href={`/dashboard/player/messages?agent=${agent.id}`}
                          className="px-4 py-2.5 rounded-xl bg-white/[0.045] border border-white/10 text-slate-300 hover:bg-yellow-500/10 hover:border-yellow-500/20 hover:text-yellow-300 transition-all text-xs font-semibold flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            Message
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}