'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp,
  Users,
  UserCheck,
  Activity,
  BarChart3,
  Calendar,
  Download,
  Star,
  Trophy,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  ArrowUpRight,
  Database,
} from 'lucide-react'

export default function OverviewPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalAgents: 0,
    totalEngagements: 0,
    approvedEngagements: 0,
    totalMedia: 0,
    pendingPlayers: 0,
    approvedPlayers: 0,
    rejectedPlayers: 0,
  })

  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [pendingEngagements, setPendingEngagements] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { count: totalPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })

    const { count: totalAgents } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })

    const { count: pendingPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: approvedPlayersCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    const { count: rejectedPlayers } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')

    const { data: engagements } = await supabase
      .from('engagements')
      .select('status')

    const { count: totalMedia } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true })

    const { data: approved } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5)

    if (approved) setApprovedPlayers(approved)

    const { data: agentList } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (agentList) setAgents(agentList)

    const { data: engagementsList } = await supabase
      .from('engagements')
      .select('*')
      .eq('status', 'pending')

    if (engagementsList) setPendingEngagements(engagementsList)

    setStats({
      totalPlayers: totalPlayers || 0,
      totalAgents: totalAgents || 0,
      totalEngagements: engagements?.length || 0,
      approvedEngagements:
        engagements?.filter((e) => e.status === 'approved').length || 0,
      totalMedia: totalMedia || 0,
      pendingPlayers: pendingPlayers || 0,
      approvedPlayers: approvedPlayersCount || 0,
      rejectedPlayers: rejectedPlayers || 0,
    })

    setLoading(false)
  }

  const handleExportData = async () => {
    const players = await supabase.from('players').select('*')
    const agents = await supabase.from('agents').select('*')
    const engagements = await supabase.from('engagements').select('*')

    const exportData = {
      players: players.data,
      agents: agents.data,
      engagements: engagements.data,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' }
    )

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `playerfynder_analytics_${new Date()
      .toISOString()
      .split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#070b09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <BarChart3 className="absolute inset-0 m-auto h-5 w-5 text-emerald-400" />
          </div>

          <p className="text-sm text-zinc-500">
            Loading platform analytics...
          </p>
        </div>
      </div>
    )
  }

  const approvalRate =
    stats.totalPlayers > 0
      ? Math.round(
          (stats.approvedPlayers / stats.totalPlayers) * 100
        )
      : 0

  const engagementSuccessRate =
    stats.totalEngagements > 0
      ? Math.round(
          (stats.approvedEngagements / stats.totalEngagements) * 100
        )
      : 0

  const approvedPercentage =
    stats.totalPlayers > 0
      ? (stats.approvedPlayers / stats.totalPlayers) * 100
      : 0

  const pendingPercentage =
    stats.totalPlayers > 0
      ? (stats.pendingPlayers / stats.totalPlayers) * 100
      : 0

  return (
    <div className="min-h-screen bg-[#070b09] text-white">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-48 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.07] blur-3xl" />
        <div className="absolute right-[-200px] top-20 h-[450px] w-[450px] rounded-full bg-yellow-500/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Admin Command Centre
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Analytics Overview
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Platform performance, player activity and scouting insights.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>

              <button
                onClick={handleExportData}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <Download className="h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            HERO ANALYTICS BANNER
        ========================================================= */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-950/60 via-[#0b1510] to-[#080c0a] p-6 sm:p-8">
          <div className="absolute right-[-80px] top-[-100px] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-[-120px] left-1/2 h-64 w-64 rounded-full bg-yellow-400/[0.04] blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Platform Performance
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Your scouting ecosystem at a glance
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Monitor players, agents, engagements and media activity
                from one central dashboard.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-emerald-400" />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Dashboard Date
                  </p>

                  <p className="mt-0.5 text-sm font-medium text-zinc-200">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            KEY METRICS
        ========================================================= */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Players */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all hover:border-emerald-400/25">
            <div className="absolute right-[-20px] top-[-30px] h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>

                <ArrowUpRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-emerald-400" />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Total Players
              </p>

              <p className="mt-1 text-3xl font-bold text-white">
                {stats.totalPlayers}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-medium">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.approvedPlayers} approved
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/10 px-2 py-1 text-yellow-400">
                  <Clock3 className="h-3 w-3" />
                  {stats.pendingPlayers} pending
                </span>
              </div>
            </div>
          </div>

          {/* Agents */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all hover:border-yellow-400/25">
            <div className="absolute right-[-20px] top-[-30px] h-32 w-32 rounded-full bg-yellow-400/[0.06] blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10">
                  <UserCheck className="h-5 w-5 text-yellow-400" />
                </div>

                <ArrowUpRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-yellow-400" />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Total Agents
              </p>

              <p className="mt-1 text-3xl font-bold text-white">
                {stats.totalAgents}
              </p>

              <p className="mt-4 text-xs text-zinc-600">
                Active scouting professionals
              </p>
            </div>
          </div>

          {/* Engagements */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all hover:border-emerald-400/25">
            <div className="absolute right-[-20px] top-[-30px] h-32 w-32 rounded-full bg-emerald-400/[0.06] blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>

                <ArrowUpRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-emerald-400" />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Engagements
              </p>

              <p className="mt-1 text-3xl font-bold text-white">
                {stats.totalEngagements}
              </p>

              <p className="mt-4 text-xs text-emerald-400">
                ✓ {stats.approvedEngagements} successful
              </p>
            </div>
          </div>

          {/* Media */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all hover:border-yellow-400/25">
            <div className="absolute right-[-20px] top-[-30px] h-32 w-32 rounded-full bg-yellow-400/[0.05] blur-3xl" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10">
                  <BarChart3 className="h-5 w-5 text-yellow-400" />
                </div>

                <ArrowUpRight className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-yellow-400" />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Media Uploads
              </p>

              <p className="mt-1 text-3xl font-bold text-white">
                {stats.totalMedia}
              </p>

              <p className="mt-4 text-xs text-zinc-600">
                Player highlights & reels
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================
            PERFORMANCE
        ========================================================= */}
        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Player Approval */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">
                    Player Approval Rate
                  </h3>
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  Current player approval performance
                </p>
              </div>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                {approvalRate}%
              </span>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="relative h-40 w-40">
                <svg
                  className="h-full w-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                  />

                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${(approvalRate / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {approvalRate}%
                    </p>

                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                      Approved
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-zinc-500">
                    Approved Players
                  </span>

                  <span className="font-semibold text-emerald-400">
                    {stats.approvedPlayers}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.min(approvedPercentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-zinc-500">
                    Pending Approval
                  </span>

                  <span className="font-semibold text-yellow-400">
                    {stats.pendingPlayers}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{
                      width: `${Math.min(pendingPercentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Success */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-semibold text-white">
                    Engagement Success Rate
                  </h3>
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  Connection request performance
                </p>
              </div>

              <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-xs font-bold text-yellow-400">
                {engagementSuccessRate}%
              </span>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="relative h-40 w-40">
                <svg
                  className="h-full w-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                  />

                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="10"
                    strokeDasharray={`${(engagementSuccessRate / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {engagementSuccessRate}%
                    </p>

                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                      Success
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 divide-x divide-white/[0.06] rounded-xl border border-white/[0.06] bg-black/10">
              <div className="p-4 text-center">
                <p className="text-xl font-bold text-white">
                  {stats.totalEngagements}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                  Requests
                </p>
              </div>

              <div className="p-4 text-center">
                <p className="text-xl font-bold text-emerald-400">
                  {stats.approvedEngagements}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                  Approved
                </p>
              </div>

              <div className="p-4 text-center">
                <p className="text-xl font-bold text-yellow-400">
                  {pendingEngagements.length}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                  Pending
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            RECENT ACTIVITY
        ========================================================= */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Recent Players */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">
                    Recent Approved Players
                  </h3>
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  Latest players approved on the platform
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
                {approvedPlayers.length} shown
              </span>
            </div>

            <div className="space-y-2">
              {approvedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all hover:border-emerald-400/10 hover:bg-white/[0.035]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {player.profile_picture ? (
                      <img
                        src={player.profile_picture}
                        alt={player.name}
                        className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                        <Users className="h-5 w-5 text-emerald-400" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">
                        {player.name}
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-600">
                        {player.position} • Age {player.age}
                      </p>
                    </div>
                  </div>

                  <div className="ml-3 shrink-0 text-right">
                    <p className="text-[10px] text-zinc-600">
                      Added
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-emerald-400/80">
                      {new Date(
                        player.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}

              {approvedPlayers.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-zinc-700" />
                  <p className="mt-3 text-sm text-zinc-600">
                    No approved players yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Agents */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-semibold text-white">
                    Recent Agents
                  </h3>
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  Latest scouting professionals joining the platform
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
                {agents.length} shown
              </span>
            </div>

            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-all hover:border-yellow-400/10 hover:bg-white/[0.035]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-400/15 bg-yellow-400/[0.07]">
                      <UserCheck className="h-5 w-5 text-yellow-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-200">
                        {agent.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-zinc-600">
                        {agent.agency || 'Independent Agent'}
                      </p>
                    </div>
                  </div>

                  <div className="ml-3 shrink-0 text-right">
                    <p className="text-[10px] text-zinc-600">
                      Added
                    </p>

                    <p className="mt-0.5 text-xs font-medium text-yellow-400/80">
                      {new Date(
                        agent.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}

              {agents.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
                  <UserCheck className="mx-auto h-8 w-8 text-zinc-700" />
                  <p className="mt-3 text-sm text-zinc-600">
                    No agents yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            PLATFORM SUMMARY
        ========================================================= */}
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-emerald-400/15 bg-gradient-to-r from-emerald-950/30 via-white/[0.025] to-yellow-950/10 p-6">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-400/[0.05] blur-3xl" />

          <div className="relative">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                <Database className="h-5 w-5 text-emerald-400" />
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  Platform Summary
                </h3>

                <p className="text-xs text-zinc-600">
                  Current ecosystem totals
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {stats.totalPlayers}
                </p>

                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                  Total Players
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.totalAgents}
                </p>

                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                  Total Agents
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {stats.totalEngagements}
                </p>

                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                  Connections Made
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {stats.totalMedia}
                </p>

                <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                  Media Uploads
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}