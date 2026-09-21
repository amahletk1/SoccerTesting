'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Eye,
  Calendar,
  TrendingUp,
  Target,
  Shield,
  Zap,
  Activity,
  Star,
  ChevronRight,
} from 'lucide-react'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get scout profile
    const { data: scout } = await supabase
      .from('scouts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (scout) {
      const { data } = await supabase
        .from('scouting_reports')
        .select('*, players(name, position, age, nationality)')
        .eq('scout_id', scout.id)
        .order('created_at', { ascending: false })

      if (data) setReports(data)
    }

    setLoading(false)
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'sign_immediately':
        return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400'
      case 'trial_recommended':
        return 'border-sky-400/20 bg-sky-400/10 text-sky-400'
      case 'monitor_further':
        return 'border-amber-400/20 bg-amber-400/10 text-amber-400'
      case 'not_recommended':
        return 'border-red-400/20 bg-red-400/10 text-red-400'
      default:
        return 'border-white/10 bg-white/[0.04] text-slate-400'
    }
  }

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case 'sign_immediately':
        return 'Sign Immediately'
      case 'trial_recommended':
        return 'Trial Recommended'
      case 'monitor_further':
        return 'Monitor Further'
      case 'not_recommended':
        return 'Not Recommended'
      default:
        return rec
    }
  }

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'sign_immediately':
        return <Target className="h-3.5 w-3.5" />
      case 'trial_recommended':
        return <Star className="h-3.5 w-3.5" />
      case 'monitor_further':
        return <Eye className="h-3.5 w-3.5" />
      case 'not_recommended':
        return <Shield className="h-3.5 w-3.5" />
      default:
        return <FileText className="h-3.5 w-3.5" />
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-emerald-400'
    if (rating >= 6) return 'text-amber-400'
    return 'text-red-400'
  }

  const getRatingBar = (rating: number) => {
    if (rating >= 8) return 'bg-emerald-400'
    if (rating >= 6) return 'bg-amber-400'
    return 'bg-red-400'
  }

  const ratingItems = [
    {
      key: 'speed_rating',
      label: 'Speed',
      icon: Zap,
    },
    {
      key: 'shooting_rating',
      label: 'Shooting',
      icon: Target,
    },
    {
      key: 'passing_rating',
      label: 'Passing',
      icon: Activity,
    },
    {
      key: 'dribbling_rating',
      label: 'Dribbling',
      icon: TrendingUp,
    },
    {
      key: 'defending_rating',
      label: 'Defending',
      icon: Shield,
    },
    {
      key: 'physical_rating',
      label: 'Physical',
      icon: Star,
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-400" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Loading scouting reports...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-180px] top-[-150px] h-[500px] w-[500px] rounded-full bg-emerald-500/[0.045] blur-[140px]" />
        <div className="absolute right-[-180px] top-[25%] h-[500px] w-[500px] rounded-full bg-amber-400/[0.025] blur-[150px]" />
      </div>

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-5 lg:px-6 lg:py-7">

        {/* ================= HEADER ================= */}
        <div className="relative mb-7 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,.14),transparent_35%),radial-gradient(circle_at_90%_100%,rgba(245,158,11,.07),transparent_30%)]" />

          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <FileText className="h-4 w-4 text-emerald-400" />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                    Scouting Centre
                  </span>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  My Scouting Reports
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Review and manage your player evaluations,
                  ratings and scouting recommendations.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Total Reports
                  </p>
                  <p className="mt-1 text-2xl font-black text-emerald-400">
                    {reports.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= EMPTY STATE ================= */}
        {reports.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.07] bg-[#0b100d] p-10 text-center shadow-2xl sm:p-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.06]">
              <FileText className="h-9 w-9 text-emerald-400" />
            </div>

            <h2 className="mt-6 text-xl font-black text-white">
              No scouting reports yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Start scouting players to create detailed
              evaluations and recommendations.
            </p>

            <Link
              href="/dashboard/players?scoutMode=true"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-[#061009] transition hover:bg-emerald-400"
            >
              Browse Players
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          /* ================= REPORT GRID ================= */
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {reports.map((report) => {
              const overall = Number(report.overall_rating || 0)

              return (
                <div
                  key={report.id}
                  className="group overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-xl transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-2xl"
                >
                  {/* Card top accent */}
                  <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 opacity-70" />

                  <div className="p-5 sm:p-6">

                    {/* Player header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 ring-1 ring-emerald-500/10">
                            <span className="text-sm font-black text-emerald-400">
                              {report.players?.name
                                ?.charAt(0)
                                ?.toUpperCase() || 'P'}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-black text-white sm:text-xl">
                              {report.players?.name}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>
                                {report.players?.position || 'Position N/A'}
                              </span>

                              <span className="text-slate-700">
                                •
                              </span>

                              <span>
                                Age {report.players?.age || 'N/A'}
                              </span>

                              <span className="text-slate-700">
                                •
                              </span>

                              <span>
                                {report.players?.nationality || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide ${getRecommendationColor(
                          report.recommendation
                        )}`}
                      >
                        {getRecommendationIcon(
                          report.recommendation
                        )}

                        <span className="hidden sm:inline">
                          {getRecommendationLabel(
                            report.recommendation
                          )}
                        </span>
                      </span>
                    </div>

                    {/* Overall score */}
                    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#080d0a] p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            overall >= 8
                              ? 'bg-emerald-500/10'
                              : overall >= 6
                                ? 'bg-amber-500/10'
                                : 'bg-red-500/10'
                          }`}
                        >
                          <TrendingUp
                            className={`h-5 w-5 ${getRatingColor(
                              overall
                            )}`}
                          />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            Overall Rating
                          </p>

                          <p
                            className={`mt-0.5 text-xl font-black ${getRatingColor(
                              overall
                            )}`}
                          >
                            {overall}
                            <span className="ml-1 text-xs font-medium text-slate-600">
                              /10
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(
                            report.created_at
                          ).toLocaleDateString()}
                        </div>

                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-700">
                          <FileText className="h-3 w-3" />
                          Scouting Report
                        </div>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                          Player Assessment
                        </p>

                        <p className="text-[10px] text-slate-700">
                          6 attributes
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        {ratingItems.map(
                          ({
                            key,
                            label,
                            icon: Icon
                          }) => {
                            const rating = Number(
                              report[key] || 0
                            )

                            return (
                              <div key={key}>
                                <div className="mb-1.5 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-3.5 w-3.5 text-slate-600" />

                                    <span className="text-xs font-medium text-slate-400">
                                      {label}
                                    </span>
                                  </div>

                                  <span
                                    className={`text-xs font-black ${getRatingColor(
                                      rating
                                    )}`}
                                  >
                                    {rating}/10
                                  </span>
                                </div>

                                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                  <div
                                    className={`h-full rounded-full transition-all ${getRatingBar(
                                      rating
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        rating * 10,
                                        100
                                      )}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          }
                        )}
                      </div>
                    </div>

                    {/* Strengths */}
                    {report.strengths && (
                      <div className="mt-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.035] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            Strengths
                          </p>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          {report.strengths}
                        </p>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {report.weaknesses && (
                      <div className="mt-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.025] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Areas to Monitor
                          </p>
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          {report.weaknesses}
                        </p>
                      </div>
                    )}

                    {/* Action */}
                    <Link
                      href={`/dashboard/players/${report.player_id}?scoutMode=true`}
                      className="group/button mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] py-3 text-xs font-bold text-emerald-400 transition hover:border-emerald-400/40 hover:bg-emerald-500 hover:text-[#061009]"
                    >
                      <Eye className="h-4 w-4" />

                      Edit Report

                      <ChevronRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}