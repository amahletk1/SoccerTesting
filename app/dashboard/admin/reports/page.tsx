'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Eye,
  Award,
  Calendar,
  Search,
  Target,
  Activity,
  Shield,
  Zap,
  Heart,
  ChevronRight,
  XCircle,
  RefreshCw,
  Users,
  TrendingUp,
  Star,
  MapPin,
  UserRound,
  ArrowUpRight,
  Clock3,
} from 'lucide-react'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchReports()
  }, [])

  const checkAdminAndFetchReports = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!adminData) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await fetchReports()
    } catch (err) {
      console.error('Error checking admin:', err)
      router.push('/dashboard')
    }
  }

  const fetchReports = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('scouting_reports')
      .select(`
        *,
        player:players(id, name, position, age, nationality, profile_picture),
        scout:scouts(id, name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
    } else {
      setReports(data || [])
    }

    setLoading(false)
  }

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'sign_immediately':
        return 'Sign Immediately'
      case 'trial_recommended':
        return 'Trial Recommended'
      case 'monitor_further':
        return 'Monitor Further'
      default:
        return 'Not Recommended'
    }
  }

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'sign_immediately':
        return Target
      case 'trial_recommended':
        return Activity
      case 'monitor_further':
        return Eye
      default:
        return XCircle
    }
  }

  const getRecommendationStyles = (rec: string) => {
    switch (rec) {
      case 'sign_immediately':
        return {
          wrapper:
            'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300',
          icon: 'bg-emerald-400/15 text-emerald-300',
          dot: 'bg-emerald-400',
        }

      case 'trial_recommended':
        return {
          wrapper:
            'border-sky-400/20 bg-sky-400/[0.08] text-sky-300',
          icon: 'bg-sky-400/15 text-sky-300',
          dot: 'bg-sky-400',
        }

      case 'monitor_further':
        return {
          wrapper:
            'border-amber-400/20 bg-amber-400/[0.08] text-amber-300',
          icon: 'bg-amber-400/15 text-amber-300',
          dot: 'bg-amber-400',
        }

      default:
        return {
          wrapper: 'border-red-400/20 bg-red-400/[0.08] text-red-300',
          icon: 'bg-red-400/15 text-red-300',
          dot: 'bg-red-400',
        }
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-emerald-300'
    if (rating >= 6) return 'text-amber-300'
    return 'text-red-300'
  }

  const getRatingBar = (rating: number) => {
    if (rating >= 8) return 'bg-emerald-400'
    if (rating >= 6) return 'bg-amber-400'
    return 'bg-red-400'
  }

  const filteredReports = reports.filter(
    (report) =>
      report.player?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      report.scout?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  )

  const signImmediatelyCount = reports.filter(
    (report) => report.recommendation === 'sign_immediately'
  ).length

  const trialRecommendedCount = reports.filter(
    (report) => report.recommendation === 'trial_recommended'
  ).length

  const uniqueScoutIds = new Set(
    reports
      .map((report) => report.scout?.id)
      .filter(Boolean)
  )

  const averageRating =
    reports.length > 0
      ? (
          reports.reduce(
            (total, report) =>
              total + Number(report.overall_rating || 0),
            0
          ) / reports.length
        ).toFixed(1)
      : '0.0'

  const formatDate = (date: string) => {
    if (!date) return 'Unknown date'

    return new Date(date).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (date: string) => {
    if (!date) return ''

    return new Date(date).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] -m-4 md:-m-6 flex items-center justify-center bg-[#050907] text-white">
        <div className="relative flex flex-col items-center">
          <div className="absolute -inset-16 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative">
            <div className="h-16 w-16 rounded-full border border-emerald-400/20 bg-white/[0.03] shadow-[0_0_40px_rgba(16,185,129,0.12)] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
            </div>
          </div>

          <p className="relative mt-5 text-sm font-semibold text-white">
            Loading scouting intelligence
          </p>

          <p className="relative mt-1 text-xs text-slate-500">
            Preparing the latest reports...
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen -m-4 md:-m-6 bg-[#050907] text-white overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 -right-48 h-[500px] w-[500px] rounded-full bg-yellow-500/[0.035] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
        {/* ========================================================= */}
        {/* HEADER */}
        {/* ========================================================= */}
        <section className="relative mb-6 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b110e] shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.10] via-transparent to-yellow-500/[0.04]" />

          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-emerald-400/[0.08]" />
          <div className="absolute -right-8 -top-16 h-48 w-48 rounded-full border border-emerald-400/[0.05]" />

          <div className="relative p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>

                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                      Admin Intelligence
                    </span>
                  </div>

                  <div className="hidden h-4 w-px bg-white/10 sm:block" />

                  <span className="text-xs font-medium text-slate-500">
                    PlayerFynder / Scouting Reports
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                  Scouting Reports
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                  Review player assessments, scout recommendations and
                  performance intelligence from across the platform.
                </p>
              </div>

              <button
                onClick={fetchReports}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-white transition-all duration-200 hover:border-emerald-400/30 hover:bg-emerald-400/[0.08] hover:text-emerald-300"
              >
                <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                Refresh Reports
              </button>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                Admin verified
              </div>

              <div className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                {reports.length} total reports
              </div>

              <div className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                <TrendingUp className="h-3.5 w-3.5 text-yellow-400" />
                {averageRating} average rating
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* STATS */}
        {/* ========================================================= */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b110e] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/20">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/[0.05] blur-2xl transition-all group-hover:bg-emerald-400/[0.09]" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Reports
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {reports.length}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  All scouting submissions
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/[0.08]">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Sign immediately */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b110e] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400/20">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-yellow-400/[0.045] blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sign Immediately
                </p>
                <p className="mt-2 text-3xl font-black text-yellow-300">
                  {signImmediatelyCount}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Highest-priority prospects
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-yellow-400/10 bg-yellow-400/[0.07]">
                <Target className="h-5 w-5 text-yellow-300" />
              </div>
            </div>
          </div>

          {/* Trial */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b110e] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/20">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky-400/[0.04] blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Trial Recommended
                </p>
                <p className="mt-2 text-3xl font-black text-sky-300">
                  {trialRecommendedCount}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Candidates worth testing
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/10 bg-sky-400/[0.07]">
                <Activity className="h-5 w-5 text-sky-300" />
              </div>
            </div>
          </div>

          {/* Scouts */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b110e] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/20">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/[0.05] blur-2xl" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Scouts
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-300">
                  {uniqueScoutIds.size}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Scouts contributing reports
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/[0.08]">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEARCH TOOLBAR */}
        {/* ========================================================= */}
        <section className="mb-6 rounded-2xl border border-white/[0.07] bg-[#0b110e] p-4 shadow-xl md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by player or scout..."
                className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-11 pr-11 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-emerald-400/30 focus:bg-black/30 focus:ring-2 focus:ring-emerald-400/[0.06]"
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                  aria-label="Clear search"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Search className="h-3.5 w-3.5" />
                <span>
                  Showing{' '}
                  <span className="font-bold text-slate-300">
                    {filteredReports.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-300">
                    {reports.length}
                  </span>
                </span>
              </div>

              {searchTerm && (
                <span className="rounded-lg border border-emerald-400/10 bg-emerald-400/[0.05] px-2.5 py-1.5 font-medium text-emerald-300">
                  Filter active
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* EMPTY STATE */}
        {/* ========================================================= */}
        {filteredReports.length === 0 ? (
          <section className="rounded-[28px] border border-white/[0.07] bg-[#0b110e] px-6 py-16 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              {searchTerm ? (
                <Search className="h-7 w-7 text-slate-500" />
              ) : (
                <FileText className="h-7 w-7 text-slate-500" />
              )}
            </div>

            <h3 className="mt-5 text-lg font-bold text-white">
              {searchTerm
                ? 'No reports found'
                : 'No scouting reports yet'}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {searchTerm
                ? `We couldn't find any reports matching "${searchTerm}". Try a different player or scout name.`
                : 'Scouting reports will appear here once scouts begin submitting player assessments.'}
            </p>

            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-[#04100a] transition-all hover:bg-emerald-300"
              >
                Clear Search
              </button>
            )}
          </section>
        ) : (
          /* ======================================================= */
          /* REPORTS */
          /* ======================================================= */
          <div className="space-y-5">
            {filteredReports.map((report) => {
              const RecommendationIcon = getRecommendationIcon(
                report.recommendation
              )

              const recommendationStyles =
                getRecommendationStyles(report.recommendation)

              const ratings = [
                {
                  label: 'Speed',
                  value: Number(report.speed_rating || 0),
                },
                {
                  label: 'Shooting',
                  value: Number(report.shooting_rating || 0),
                },
                {
                  label: 'Passing',
                  value: Number(report.passing_rating || 0),
                },
                {
                  label: 'Dribbling',
                  value: Number(report.dribbling_rating || 0),
                },
                {
                  label: 'Defending',
                  value: Number(report.defending_rating || 0),
                },
                {
                  label: 'Physical',
                  value: Number(report.physical_rating || 0),
                },
              ]

              return (
                <article
                  key={report.id}
                  className="group overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#0b110e] shadow-xl transition-all duration-300 hover:border-emerald-400/[0.18] hover:shadow-[0_20px_70px_rgba(0,0,0,0.35)]"
                >
                  {/* REPORT HEADER */}
                  <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-r from-[#0e1712] via-[#0b110e] to-[#10150d]">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-400/[0.04] blur-3xl" />

                    <div className="relative p-5 md:p-6">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          {/* PLAYER IMAGE */}
                          <div className="relative shrink-0">
                            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-lg md:h-[72px] md:w-[72px]">
                              {report.player?.profile_picture ? (
                                <img
                                  src={report.player.profile_picture}
                                  alt={report.player?.name || 'Player'}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-emerald-400/[0.07]">
                                  <UserRound className="h-7 w-7 text-emerald-400/60" />
                                </div>
                              )}
                            </div>

                            <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0b110e] bg-emerald-400">
                              <Shield className="h-3 w-3 text-[#031008]" />
                            </div>
                          </div>

                          {/* PLAYER INFO */}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-lg font-black text-white md:text-xl">
                                {report.player?.name || 'Unknown Player'}
                              </h2>

                              {report.player?.position && (
                                <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {report.player.position}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                              {report.player?.age && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                  Age {report.player.age}
                                </span>
                              )}

                              {report.player?.nationality && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-slate-600" />
                                  {report.player.nationality}
                                </span>
                              )}

                              {report.scout?.name && (
                                <span className="flex items-center gap-1.5">
                                  <UserRound className="h-3.5 w-3.5 text-slate-600" />
                                  Scouted by {report.scout.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* RECOMMENDATION + DATE */}
                        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                          <div
                            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 ${recommendationStyles.wrapper}`}
                          >
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg ${recommendationStyles.icon}`}
                            >
                              <RecommendationIcon className="h-4 w-4" />
                            </span>

                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                                Recommendation
                              </p>
                              <p className="text-xs font-bold">
                                {getRecommendationText(
                                  report.recommendation
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                            <Clock3 className="h-3.5 w-3.5 text-slate-600" />

                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                                Submitted
                              </p>
                              <p className="text-xs font-semibold text-slate-400">
                                {formatDate(report.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REPORT BODY */}
                  <div className="p-5 md:p-6">
                    {/* TOP SUMMARY */}
                    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Overall
                          </span>
                          <Star className="h-3.5 w-3.5 text-yellow-400" />
                        </div>

                        <div className="flex items-end gap-1.5">
                          <span
                            className={`text-2xl font-black ${getRatingColor(
                              Number(report.overall_rating || 0)
                            )}`}
                          >
                            {report.overall_rating ?? '—'}
                          </span>
                          <span className="mb-1 text-xs text-slate-600">
                            / 10
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Scout
                          </span>
                          <UserRound className="h-3.5 w-3.5 text-emerald-400" />
                        </div>

                        <p className="truncate text-sm font-bold text-white">
                          {report.scout?.name || 'Unknown'}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                          Report author
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Nationality
                          </span>
                          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        </div>

                        <p className="truncate text-sm font-bold text-white">
                          {report.player?.nationality || 'Not specified'}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                          Player profile
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Submitted
                          </span>
                          <Calendar className="h-3.5 w-3.5 text-yellow-400" />
                        </div>

                        <p className="truncate text-sm font-bold text-white">
                          {formatDate(report.created_at)}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                          {formatTime(report.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* ASSESSMENT */}
                    <div className="mb-6 rounded-2xl border border-white/[0.06] bg-black/15 p-4 md:p-5">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-400" />
                            <h3 className="text-sm font-black text-white">
                              Player Assessment
                            </h3>
                          </div>

                          <p className="mt-1 text-xs text-slate-600">
                            Scout performance breakdown
                          </p>
                        </div>

                        <div className="hidden rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 sm:block">
                          6 attributes
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                        {ratings.map((rating) => (
                          <div key={rating.label}>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-400">
                                {rating.label}
                              </span>

                              <span
                                className={`text-xs font-black ${getRatingColor(
                                  rating.value
                                )}`}
                              >
                                {rating.value}/10
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className={`h-full rounded-full transition-all ${getRatingBar(
                                  rating.value
                                )}`}
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(rating.value * 10, 100)
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* INSIGHTS */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {/* Strengths */}
                      <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10">
                            <Award className="h-4 w-4 text-emerald-400" />
                          </div>

                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                              Strengths
                            </h3>
                            <p className="text-[10px] text-emerald-400/40">
                              Key positives
                            </p>
                          </div>
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                          {report.strengths || 'No strengths recorded.'}
                        </p>
                      </div>

                      {/* Weaknesses */}
                      <div className="rounded-2xl border border-red-400/10 bg-red-400/[0.025] p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-400/10">
                            <Shield className="h-4 w-4 text-red-300" />
                          </div>

                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-red-300">
                              Weaknesses
                            </h3>
                            <p className="text-[10px] text-red-400/40">
                              Areas to improve
                            </p>
                          </div>
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                          {report.weaknesses ||
                            'No weaknesses recorded.'}
                        </p>
                      </div>

                      {/* Notes */}
                      <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.025] p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10">
                            <Heart className="h-4 w-4 text-yellow-300" />
                          </div>

                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-yellow-300">
                              Scout Notes
                            </h3>
                            <p className="text-[10px] text-yellow-400/40">
                              Additional intelligence
                            </p>
                          </div>
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                          {report.notes || 'No additional notes.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-white/[0.06] bg-black/15 px-5 py-4 md:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/10 bg-emerald-400/[0.06]">
                          <Shield className="h-4 w-4 text-emerald-400" />
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-300">
                            Admin Review Record
                          </p>
                          <p className="text-[10px] text-slate-600">
                            Submitted by {report.scout?.name || 'Unknown Scout'}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/players/${report.player_id}`}
                        className="group/link inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-[#04100a] transition-all duration-200 hover:bg-emerald-300 hover:shadow-[0_0_25px_rgba(52,211,153,0.18)]"
                      >
                        View Player Profile
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}