'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  User,
  MapPin,
  Briefcase,
  Eye,
  X,
  Loader2,
  Star,
  ShieldCheck,
  Users,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
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
      const {
        data: { user },
      } = await supabase.auth.getUser()

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
        .select(
          'id, name, age, position, nationality, current_club, profile_picture'
        )
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
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      searchTerm === '' ||
      player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.nationality?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPosition =
      selectedPosition === '' ||
      player.position === selectedPosition

    return matchesSearch && matchesPosition
  })

  const positions = [
    'Forward',
    'Midfielder',
    'Defender',
    'Goalkeeper',
  ]

  const getInitials = (name: string) => {
    if (!name) return '?'

    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#070b09]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <p className="text-sm text-white/40">
            Loading player directory...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b09] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[25%] -right-40 w-[450px] h-[450px] bg-yellow-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-[35%] w-[400px] h-[300px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-7">

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                Talent Directory
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Browse Players
            </h1>

            <p className="text-sm sm:text-base text-white/40 mt-2 max-w-xl">
              Discover talented football players and explore their
              professional scouting profiles.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="px-4 py-3 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
              <p className="text-[10px] uppercase tracking-wider text-white/30">
                Available Talent
              </p>
              <p className="text-xl font-black text-white mt-0.5">
                {players.length}
              </p>
            </div>

            <div className="hidden sm:block px-4 py-3 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/10">
              <p className="text-[10px] uppercase tracking-wider text-white/30">
                Showing
              </p>
              <p className="text-xl font-black text-emerald-400 mt-0.5">
                {filteredPlayers.length}
              </p>
            </div>

          </div>
        </div>

        {/* ====================================================== */}
        {/* SEARCH / FILTER PANEL */}
        {/* ====================================================== */}
        <div className="relative rounded-2xl border border-white/[0.07] bg-[#0b110e] p-4 sm:p-5 mb-7 overflow-hidden">

          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                Find your player
              </p>
              <p className="text-[11px] text-white/30">
                Search by name, nationality or position
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_250px_auto] gap-3">

            {/* Search */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-white/30 mb-2">
                Search players
              </label>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />

                <input
                  type="text"
                  placeholder="Search by name or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/[0.035] border border-white/[0.08] text-sm text-white placeholder:text-white/25 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-white/30 mb-2">
                Position
              </label>

              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[#101712] border border-white/[0.08] text-sm text-white/75 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
              >
                <option value="">All Positions</option>

                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear */}
            <div className="flex items-end">
              {(searchTerm || selectedPosition) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedPosition('')
                  }}
                  className="h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/20 text-sm text-white/50 hover:text-red-400 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ====================================================== */}
        {/* RESULTS HEADER */}
        {/* ====================================================== */}
        <div className="flex items-center justify-between mb-4">

          <div>
            <p className="text-sm text-white/40">
              <span className="font-bold text-white">
                {filteredPlayers.length}
              </span>{' '}
              player{filteredPlayers.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {(searchTerm || selectedPosition) && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/30">
              <Search className="w-3.5 h-3.5" />
              Filtered results
            </div>
          )}

        </div>

        {/* ====================================================== */}
        {/* EMPTY STATE */}
        {/* ====================================================== */}
        {filteredPlayers.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0b110e] p-12 sm:p-16 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <User className="w-7 h-7 text-white/15" />
            </div>

            <h3 className="text-lg font-bold text-white/70 mt-5">
              No players found
            </h3>

            <p className="text-sm text-white/30 mt-2 max-w-sm mx-auto">
              Try adjusting your search term or changing the position
              filter.
            </p>

            {(searchTerm || selectedPosition) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedPosition('')
                }}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition"
              >
                <X className="w-4 h-4" />
                Reset filters
              </button>
            )}

          </div>
        ) : (
          /* ==================================================== */
          /* PLAYER GRID */
          /* ==================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {filteredPlayers.map((player) => (
              <Link
                key={player.id}
                href={`/dashboard/players/${player.id}`}
                className="group block rounded-2xl border border-white/[0.07] bg-[#0b110e] overflow-hidden hover:border-emerald-500/25 hover:-translate-y-1 transition-all duration-300"
              >

                {/* Player Card Banner */}
                <div className="relative h-32 overflow-hidden">

                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#101812] to-[#090d0b]" />

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.20),transparent_45%)]" />

                  <div className="absolute right-5 top-5 w-20 h-20 rounded-full border border-emerald-400/10" />
                  <div className="absolute right-10 top-10 w-10 h-10 rounded-full border border-yellow-400/10" />

                  {/* Position */}
                  {player.position && (
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm border border-white/[0.08]">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {player.position}
                      </span>
                    </div>
                  )}

                  {/* Verified indicator */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>

                  {/* Player image */}
                  <div className="absolute -bottom-12 left-5">

                    {player.profile_picture ? (
                      <img
                        src={player.profile_picture}
                        alt={player.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#0b110e] ring-1 ring-emerald-400/20 shadow-2xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-950 border-4 border-[#0b110e] ring-1 ring-emerald-400/20 shadow-2xl flex items-center justify-center">
                        <span className="text-2xl font-black text-emerald-100">
                          {getInitials(player.name)}
                        </span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Player Information */}
                <div className="pt-14 px-5 pb-5">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-white truncate group-hover:text-emerald-400 transition-colors">
                        {player.name || 'Unnamed Player'}
                      </h3>

                      <div className="flex items-center gap-2 mt-1.5">

                        {player.age && (
                          <span className="text-xs text-white/35">
                            {player.age} years
                          </span>
                        )}

                        {player.position && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/15" />
                            <span className="text-xs text-white/35">
                              {player.position}
                            </span>
                          </>
                        )}

                      </div>
                    </div>

                    <div className="shrink-0 w-9 h-9 rounded-xl bg-white/[0.035] border border-white/[0.07] flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                      <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>

                  </div>

                  {/* Player Details */}
                  <div className="space-y-2.5 mt-5">

                    {player.nationality && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.035] flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400/70" />
                        </div>

                        <span className="text-xs text-white/45 truncate">
                          {player.nationality}
                        </span>
                      </div>
                    )}

                    {player.current_club && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.035] flex items-center justify-center shrink-0">
                          <Briefcase className="w-3.5 h-3.5 text-yellow-400/70" />
                        </div>

                        <span className="text-xs text-white/45 truncate">
                          {player.current_club}
                        </span>
                      </div>
                    )}

                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">

                    <span className="text-xs font-semibold text-white/35 group-hover:text-emerald-400 transition-colors">
                      View full profile
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </span>

                  </div>

                </div>
              </Link>
            ))}

          </div>
        )}

        {/* Bottom summary */}
        {filteredPlayers.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#0b110e] px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>

              <p className="text-xs text-white/35">
                Showing{' '}
                <span className="font-bold text-white/70">
                  {filteredPlayers.length}
                </span>{' '}
                available player profiles
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-white/25">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              PlayerFynder Talent Network
            </div>

          </div>
        )}

      </div>
    </div>
  )
}