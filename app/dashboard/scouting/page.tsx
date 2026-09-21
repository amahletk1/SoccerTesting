'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Filter,
  Eye,
  Star,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Target,
  BarChart3,
  ArrowUpDown,
  UserPlus,
  Briefcase,
  Activity,
  Zap,
  Flame,
  XCircle,
  FileText,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Heart,
  Trophy,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
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
    sortBy: 'recent',
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

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
      query = query.ilike(
        'nationality',
        `%${filters.nationality}%`
      )
    }

    if (filters.sortBy === 'goals') {
      query = query.order('player_stats.goals', {
        ascending: false,
      })
    } else if (filters.sortBy === 'age') {
      query = query.order('age', {
        ascending: true,
      })
    } else {
      query = query.order('created_at', {
        ascending: false,
      })
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

    if (hotData) {
      setHotProspects(hotData)
    }

    setLoading(false)
  }

  const hasReport = (playerId: string) => {
    return reports.some((r) => r.player_id === playerId)
  }

  const toggleCompare = (playerId: string) => {
    if (selectedForCompare.includes(playerId)) {
      setSelectedForCompare(
        selectedForCompare.filter((id) => id !== playerId)
      )
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([
          ...selectedForCompare,
          playerId,
        ])
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-400" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Loading talent database...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-180px] top-[-150px] h-[550px] w-[550px] rounded-full bg-emerald-500/[0.045] blur-[150px]" />
        <div className="absolute right-[-200px] top-[20%] h-[500px] w-[500px] rounded-full bg-amber-400/[0.025] blur-[150px]" />
        <div className="absolute bottom-[-250px] left-[35%] h-[550px] w-[550px] rounded-full bg-emerald-500/[0.025] blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-5 lg:px-6 lg:py-8">

        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <div className="mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Target className="h-4 w-4 text-emerald-400" />
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Scout Command Centre
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Talent Discovery
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                Discover, evaluate and compare the next generation
                of football talent.
              </p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`group flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${
                showFilters
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/[0.08] bg-[#0b100d] text-slate-400 hover:border-emerald-500/20 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />

              {showFilters ? 'Hide Filters' : 'Filter Talent'}

              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* FILTER PANEL */}
        {/* ===================================================== */}

        {showFilters && (
          <div className="mb-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-xl">
            <div className="border-b border-white/[0.06] bg-white/[0.015] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Filter className="h-5 w-5 text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-sm font-black text-white">
                    Talent Filters
                  </h2>

                  <p className="mt-0.5 text-[10px] text-slate-600">
                    Narrow the player database to your requirements.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                    Position
                  </label>

                  <select
                    value={filters.position}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        position: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/[0.07] bg-[#080d0a] px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="">All Positions</option>
                    <option value="Forward">Forward</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Defender">Defender</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                    Minimum Age
                  </label>

                  <input
                    type="number"
                    placeholder="e.g. 16"
                    value={filters.ageMin}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        ageMin: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/[0.07] bg-[#080d0a] px-4 py-3 text-sm text-slate-300 outline-none placeholder:text-slate-700 transition focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                    Maximum Age
                  </label>

                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={filters.ageMax}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        ageMax: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/[0.07] bg-[#080d0a] px-4 py-3 text-sm text-slate-300 outline-none placeholder:text-slate-700 transition focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                    Nationality
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. South Africa"
                    value={filters.nationality}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        nationality: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/[0.07] bg-[#080d0a] px-4 py-3 text-sm text-slate-300 outline-none placeholder:text-slate-700 transition focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    Sort by
                  </span>

                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        sortBy: e.target.value,
                      })
                    }
                    className="rounded-xl border border-white/[0.07] bg-[#080d0a] px-3 py-2 text-xs font-semibold text-slate-400 outline-none focus:border-emerald-500/30"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="goals">Most Goals</option>
                    <option value="age">Youngest First</option>
                  </select>
                </div>

                <button
                  onClick={() =>
                    setFilters({
                      position: '',
                      ageMin: '',
                      ageMax: '',
                      nationality: '',
                      sortBy: 'recent',
                    })
                  }
                  className="text-left text-xs font-bold text-slate-600 transition hover:text-emerald-400 sm:text-right"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* HOT PROSPECTS */}
        {/* ===================================================== */}

        {hotProspects.length > 0 && (
          <section className="mb-7">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                  <Flame className="h-5 w-5 text-amber-400" />

                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      Hot Prospects
                    </h2>

                    <span className="rounded-full border border-amber-400/10 bg-amber-400/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                      Trending
                    </span>
                  </div>

                  <p className="mt-0.5 text-[10px] text-slate-600">
                    Recently approved talent worth investigating.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {hotProspects.map((player, index) => (
                <div
                  key={player.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-950/20"
                >
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-500/[0.04] blur-3xl transition group-hover:bg-emerald-500/[0.08]" />

                  <div className="relative">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {player.profile_picture ? (
                          <img
                            src={player.profile_picture}
                            alt={player.name}
                            className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                            <Users className="h-5 w-5 text-emerald-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-white">
                            {player.name}
                          </h3>

                          <p className="mt-1 text-[10px] text-slate-600">
                            {player.position}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-400/10 bg-amber-400/5 px-2 py-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-amber-400">
                          8.5
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                            Goals
                          </span>
                        </div>

                        <p className="mt-2 text-lg font-black text-white">
                          {player.player_stats?.[0]?.goals || 0}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-sky-400" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                            Assists
                          </span>
                        </div>

                        <p className="mt-2 text-lg font-black text-white">
                          {player.player_stats?.[0]?.assists || 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {hasReport(player.id) ? (
                        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-2.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Reported
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard/scouting/reports/new/${player.id}`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-[10px] font-black text-[#061009] transition hover:bg-emerald-400"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Create Report
                        </Link>
                      )}

                      <Link
                        href={`/dashboard/players/${player.id}`}
                        className="flex items-center justify-center rounded-xl border border-white/[0.07] px-3 py-2.5 text-[10px] font-bold text-slate-500 transition hover:border-white/[0.14] hover:text-white"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================== */}
        {/* DATABASE TOOLBAR */}
        {/* ===================================================== */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/[0.07] bg-[#0b100d] px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                Available Talent
              </span>

              <span className="ml-2 text-sm font-black text-white">
                {players.length}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setCompareMode(!compareMode)
              setSelectedForCompare([])
            }}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
              compareMode
                ? 'border-sky-400/30 bg-sky-500/10 text-sky-300'
                : 'border-white/[0.08] bg-[#0b100d] text-slate-400 hover:border-sky-400/20 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />

            {compareMode
              ? 'Exit Compare Mode'
              : 'Compare Players'}

            {compareMode &&
              selectedForCompare.length > 0 && (
                <span className="rounded-full bg-sky-400 px-2 py-0.5 text-[9px] font-black text-[#061009]">
                  {selectedForCompare.length}/3
                </span>
              )}
          </button>
        </div>

        {/* ===================================================== */}
        {/* PLAYERS */}
        {/* ===================================================== */}

        {players.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.07] bg-[#0b100d] p-12 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03]">
              <Users className="h-7 w-7 text-slate-700" />
            </div>

            <h3 className="mt-5 text-sm font-black text-white">
              No players found
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-600">
              No approved players match your current search
              criteria. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => {
              const reported = hasReport(player.id)
              const stats = player.player_stats?.[0]

              return (
                <div
                  key={player.id}
                  className={`group relative overflow-hidden rounded-3xl border bg-[#0b100d] transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${
                    selectedForCompare.includes(player.id)
                      ? 'border-sky-400/40 shadow-sky-950/20'
                      : 'border-white/[0.07] hover:border-emerald-500/20 hover:shadow-emerald-950/20'
                  }`}
                >
                  {/* Card glow */}
                  <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/[0.025] blur-3xl transition group-hover:bg-emerald-500/[0.06]" />

                  {/* Top accent */}
                  <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 transition group-hover:opacity-100" />

                  <div className="relative p-5">

                    {/* Player identity */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {player.profile_picture ? (
                          <img
                            src={player.profile_picture}
                            alt={player.name}
                            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/[0.02] ring-1 ring-emerald-500/10">
                            <Users className="h-6 w-6 text-emerald-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-base font-black text-white">
                              {player.name}
                            </h3>

                            {reported && (
                              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            )}
                          </div>

                          <p className="mt-1 text-xs font-semibold text-emerald-400/80">
                            {player.position}
                          </p>
                        </div>
                      </div>

                      {compareMode && (
                        <button
                          onClick={() =>
                            toggleCompare(player.id)
                          }
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                            selectedForCompare.includes(
                              player.id
                            )
                              ? 'border-sky-400 bg-sky-500 text-[#061009]'
                              : 'border-white/10 bg-white/[0.02] text-transparent hover:border-sky-400/40'
                          }`}
                        >
                          {selectedForCompare.includes(
                            player.id
                          ) && (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Player metadata */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                        <Calendar className="h-3 w-3" />
                        Age {player.age}
                      </span>

                      <span className="flex min-w-0 max-w-[180px] items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {player.nationality || 'N/A'}
                        </span>
                      </span>
                    </div>

                    {/* Stats */}
                    {player.player_stats &&
                      player.player_stats.length > 0 && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.05] bg-[#080d0a]">
                          <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
                            <div className="p-3 text-center">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-700">
                                Matches
                              </p>

                              <p className="mt-1.5 text-lg font-black text-white">
                                {stats?.matches_played || 0}
                              </p>
                            </div>

                            <div className="p-3 text-center">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-700">
                                Goals
                              </p>

                              <p className="mt-1.5 text-lg font-black text-emerald-400">
                                {stats?.goals || 0}
                              </p>
                            </div>

                            <div className="p-3 text-center">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-700">
                                Assists
                              </p>

                              <p className="mt-1.5 text-lg font-black text-sky-400">
                                {stats?.assists || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Report status */}
                    {reported && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.045] px-3 py-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />

                        <span className="text-[10px] font-bold text-emerald-400">
                          You have already submitted a report
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      {reported ? (
                        <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 py-2.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Report Submitted
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard/scouting/reports/new/${player.id}`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-[10px] font-black text-[#061009] transition hover:bg-emerald-400"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Create Report
                        </Link>
                      )}

                      <Link
                        href={`/dashboard/players/${player.id}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] py-2.5 text-[10px] font-bold text-slate-500 transition hover:border-white/[0.14] hover:bg-white/[0.025] hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ===================================================== */}
        {/* FLOATING COMPARE */}
        {/* ===================================================== */}

        {compareMode && selectedForCompare.length >= 2 && (
          <div className="fixed bottom-5 left-3 right-3 z-40 sm:left-auto sm:right-6">
            <Link
              href={`/dashboard/compare?players=${selectedForCompare.join(',')}`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-[#0b100d]/95 px-6 py-4 text-xs font-black text-white shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:border-sky-400/40 hover:bg-[#101812]"
            >
              <BarChart3 className="h-5 w-5 text-sky-400" />

              Compare {selectedForCompare.length} Players

              <span className="ml-1 rounded-full bg-sky-400 px-2 py-0.5 text-[9px] font-black text-[#061009]">
                {selectedForCompare.length}/3
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}