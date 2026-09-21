'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Target,
  Zap,
  Shield,
  Activity,
  Eye,
  Award,
  CheckCircle,
  XCircle,
  Send,
  Building2,
  X,
  ChevronRight,
  Star,
  UserRound,
  FileText,
} from 'lucide-react'

interface CreateReportPageProps {
  params: Promise<{ playerId: string }>
}

export default function CreateScoutingReportPage({
  params,
}: CreateReportPageProps) {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [scoutId, setScoutId] = useState<string | null>(null)
  const [scoutName, setScoutName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Agent selection modal
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [recommendMessage, setRecommendMessage] = useState('')
  const [savedReportId, setSavedReportId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    speed_rating: 5,
    shooting_rating: 5,
    passing_rating: 5,
    dribbling_rating: 5,
    defending_rating: 5,
    physical_rating: 5,
    overall_rating: 5,
    recommendation: 'monitor_further',
    strengths: '',
    weaknesses: '',
    notes: '',
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const unwrapParams = async () => {
      const { playerId } = await params
      setPlayerId(playerId)
    }

    unwrapParams()
  }, [params])

  useEffect(() => {
    if (playerId) {
      fetchData()
    }
  }, [playerId])

  const fetchData = async () => {
    setLoading(true)

    // Get scout profile
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: scout } = await supabase
      .from('scouts')
      .select('id, name')
      .eq('user_id', user.id)
      .single()

    if (!scout) {
      router.push('/dashboard/scout')
      return
    }

    setScoutId(scout.id)
    setScoutName(scout.name || 'A scout')

    // Get player details
    const { data: playerData } = await supabase
      .from('players')
      .select('name, position, age, nationality, profile_picture')
      .eq('id', playerId)
      .single()

    setPlayer(playerData)

    // Fetch agents for selection
    const { data: agentsData } = await supabase
      .from('agents')
      .select('id, name, agency, specializations')
      .eq('verification_status', 'verified')
      .limit(30)

    if (agentsData) setAgents(agentsData)

    setLoading(false)
  }

  const handleRatingChange = (field: string, value: number) => {
    setFormData({ ...formData, [field]: value })

    if (
      [
        'speed_rating',
        'shooting_rating',
        'passing_rating',
        'dribbling_rating',
        'defending_rating',
        'physical_rating',
      ].includes(field)
    ) {
      const avg = Math.round(
        (formData.speed_rating +
          formData.shooting_rating +
          formData.passing_rating +
          formData.dribbling_rating +
          formData.defending_rating +
          formData.physical_rating) /
          6
      )

      setFormData((prev) => ({
        ...prev,
        overall_rating: avg,
      }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Save the scouting report
    const { data: report, error: insertError } = await supabase
      .from('scouting_reports')
      .insert({
        scout_id: scoutId,
        player_id: playerId,
        speed_rating: formData.speed_rating,
        shooting_rating: formData.shooting_rating,
        passing_rating: formData.passing_rating,
        dribbling_rating: formData.dribbling_rating,
        defending_rating: formData.defending_rating,
        physical_rating: formData.physical_rating,
        overall_rating: formData.overall_rating,
        recommendation: formData.recommendation,
        strengths: formData.strengths,
        weaknesses: formData.weaknesses,
        notes: formData.notes,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSavedReportId(report.id)

    // Show agent selection modal instead of sending to all agents
    setShowAgentModal(true)
    setSaving(false)
  }

  const sendRecommendations = async () => {
    if (!savedReportId || selectedAgents.length === 0) return

    setSaving(true)

    const recommendationLabel = getRecommendationLabel(
      formData.recommendation
    )

    let successCount = 0

    for (const agentId of selectedAgents) {
      // Get agent details
      const { data: agent } = await supabase
        .from('agents')
        .select('id, name, email, user_id')
        .eq('id', agentId)
        .single()

      if (agent) {
        // Create email notification
        await supabase
          .from('email_notifications')
          .insert({
            user_id: agent.user_id,
            recipient_email: agent.email,
            recipient_type: 'agent',
            subject: `🔍 New Scouting Report: ${player?.name}`,
            message: `Dear ${agent.name},\n\nScout ${scoutName} has just completed a scouting report on ${player?.name} (${player?.position}).\n\n📊 Overall Rating: ${formData.overall_rating}/10\n💡 Recommendation: ${recommendationLabel}\n\nScout's Note: ${recommendMessage || 'No additional notes'}\n\nLog in to your dashboard to view the full report and consider engaging this player.\n\nBest regards,\nPlayerFynder Team`,
            status: 'pending',
            created_at: new Date().toISOString(),
          })

        // Create scout recommendation
        await supabase
          .from('scout_recommendations')
          .insert({
            scout_id: scoutId,
            agent_id: agent.id,
            player_id: playerId,
            report_id: savedReportId,
            message:
              recommendMessage ||
              `I recommend ${player?.name} (Rating: ${formData.overall_rating}/10) - ${recommendationLabel}`,
            status: 'pending',
            created_at: new Date().toISOString(),
          })

        successCount++
      }
    }

    alert(
      `Scouting report saved! Recommended to ${successCount} agent(s).`
    )

    setShowAgentModal(false)
    setSelectedAgents([])
    setRecommendMessage('')
    router.push('/dashboard/scouting/reports')
    setSaving(false)
  }

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(
        selectedAgents.filter((id) => id !== agentId)
      )
    } else {
      setSelectedAgents([...selectedAgents, agentId])
    }
  }

  const skipRecommendation = () => {
    alert(
      'Scouting report saved! You can recommend to agents later from your reports page.'
    )

    router.push('/dashboard/scouting/reports')
    setShowAgentModal(false)
  }

  const ratingItems = [
    {
      key: 'speed_rating',
      label: 'Speed',
      icon: Zap,
      description: 'Acceleration & pace',
    },
    {
      key: 'shooting_rating',
      label: 'Shooting',
      icon: Target,
      description: 'Finishing & striking',
    },
    {
      key: 'passing_rating',
      label: 'Passing',
      icon: Activity,
      description: 'Distribution & vision',
    },
    {
      key: 'dribbling_rating',
      label: 'Dribbling',
      icon: Zap,
      description: 'Control & creativity',
    },
    {
      key: 'defending_rating',
      label: 'Defending',
      icon: Shield,
      description: 'Defensive ability',
    },
    {
      key: 'physical_rating',
      label: 'Physical',
      icon: Activity,
      description: 'Strength & stamina',
    },
  ]

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-emerald-400'
    if (rating >= 6) return 'text-amber-400'
    return 'text-red-400'
  }

  const getRecommendationStyles = (value: string) => {
    switch (value) {
      case 'sign_immediately':
        return {
          active:
            'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
          icon: 'bg-emerald-400/10 text-emerald-400',
        }

      case 'trial_recommended':
        return {
          active: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
          icon: 'bg-sky-400/10 text-sky-400',
        }

      case 'monitor_further':
        return {
          active:
            'border-amber-400/40 bg-amber-400/10 text-amber-300',
          icon: 'bg-amber-400/10 text-amber-400',
        }

      case 'not_recommended':
        return {
          active: 'border-red-400/40 bg-red-400/10 text-red-300',
          icon: 'bg-red-400/10 text-red-400',
        }

      default:
        return {
          active: 'border-white/10 bg-white/[0.03] text-slate-300',
          icon: 'bg-white/[0.05] text-slate-400',
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-400" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Preparing scouting report...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-180px] top-[-160px] h-[500px] w-[500px] rounded-full bg-emerald-500/[0.05] blur-[150px]" />
        <div className="absolute right-[-180px] top-[25%] h-[500px] w-[500px] rounded-full bg-amber-400/[0.025] blur-[150px]" />
      </div>

      <div className="mx-auto max-w-5xl px-3 py-5 sm:px-5 lg:px-6 lg:py-7">
        {/* =========================================================
            TOP NAV
        ========================================================= */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href={`/dashboard/players/${playerId}`}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0b100d] px-3.5 py-2.5 text-xs font-semibold text-slate-400 transition hover:border-emerald-500/20 hover:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Player Profile
          </Link>

          <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700 sm:flex">
            <FileText className="h-3.5 w-3.5" />
            New Scouting Report
          </div>
        </div>

        {/* =========================================================
            PLAYER HEADER
        ========================================================= */}
        <section className="relative mb-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,.15),transparent_38%),radial-gradient(circle_at_100%_100%,rgba(245,158,11,.06),transparent_35%)]" />

          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                {player?.profile_picture ? (
                  <img
                    src={player.profile_picture}
                    alt={player.name}
                    className="h-full w-full rounded-2xl object-cover ring-2 ring-emerald-400/20"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <Target className="h-9 w-9 text-emerald-400" />
                  </div>
                )}

                <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#0b100d] bg-emerald-500">
                  <Eye className="h-3.5 w-3.5 text-[#061009]" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                    Player Assessment
                  </span>

                  <span className="h-1 w-1 rounded-full bg-slate-700" />

                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Scout Mode
                  </span>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Scouting Report:{' '}
                  <span className="text-emerald-400">
                    {player?.name}
                  </span>
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{player?.position || 'Position N/A'}</span>
                  <span className="text-slate-700">•</span>
                  <span>Age {player?.age || 'N/A'}</span>
                  <span className="text-slate-700">•</span>
                  <span>{player?.nationality || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-300">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold">Unable to save report</p>
              <p className="mt-1 text-xs text-red-300/70">
                {error}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* =========================================================
              RATINGS
          ========================================================= */}
          <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-xl">
            <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Activity className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Player Ratings
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Evaluate each attribute from 1 to 10
                    </p>
                  </div>
                </div>

                <div className="hidden rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[10px] font-bold text-slate-600 sm:block">
                  1 — 10
                </div>
              </div>
            </div>

            <div className="grid gap-px bg-white/[0.04] sm:grid-cols-2">
              {ratingItems.map(
                ({ key, label, icon: Icon, description }) => {
                  const rating = formData[
                    key as keyof typeof formData
                  ] as number

                  return (
                    <div
                      key={key}
                      className="bg-[#0b100d] p-5 sm:p-6"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                            <Icon className="h-4 w-4 text-slate-500" />
                          </div>

                          <div>
                            <p className="text-xs font-bold text-white">
                              {label}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-700">
                              {description}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-lg font-black ${getRatingColor(
                            rating
                          )}`}
                        >
                          {rating}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={rating}
                        onChange={(e) =>
                          handleRatingChange(
                            key,
                            parseInt(e.target.value)
                          )
                        }
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-emerald-400"
                      />

                      <div className="mt-2 flex justify-between text-[9px] font-medium text-slate-700">
                        <span>Developing</span>
                        <span>Elite</span>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </section>

          {/* =========================================================
              OVERALL ASSESSMENT
          ========================================================= */}
          <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-xl">
            <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                  <Award className="h-5 w-5 text-amber-400" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-white">
                    Overall Assessment
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    Final evaluation and recommendation
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-7 lg:grid-cols-[180px_1fr] lg:items-center">
                {/* Overall rating */}
                <div className="text-center">
                  <div className="relative mx-auto h-36 w-36">
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
                        strokeWidth="8"
                      />

                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="8"
                        strokeDasharray={`${(formData.overall_rating / 10) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-emerald-400">
                        {formData.overall_rating}
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        / 10
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                    Overall Rating
                  </p>
                </div>

                {/* Recommendation */}
                <div>
                  <div className="mb-3">
                    <p className="text-xs font-bold text-white">
                      Recommendation
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Select the action you believe should be taken
                      with this player.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      {
                        value: 'sign_immediately',
                        label: 'Sign Immediately',
                        icon: CheckCircle,
                      },
                      {
                        value: 'trial_recommended',
                        label: 'Trial Recommended',
                        icon: Star,
                      },
                      {
                        value: 'monitor_further',
                        label: 'Monitor Further',
                        icon: Eye,
                      },
                      {
                        value: 'not_recommended',
                        label: 'Not Recommended',
                        icon: XCircle,
                      },
                    ].map((option) => {
                      const Icon = option.icon
                      const styles = getRecommendationStyles(
                        option.value
                      )

                      const active =
                        formData.recommendation === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              recommendation: option.value,
                            })
                          }
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                            active
                              ? styles.active
                              : 'border-white/[0.07] bg-white/[0.015] text-slate-500 hover:border-white/[0.12] hover:bg-white/[0.03]'
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              active
                                ? styles.icon
                                : 'bg-white/[0.04] text-slate-600'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <span className="text-xs font-bold">
                            {option.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================
              SCOUTING NOTES
          ========================================================= */}
          <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-xl">
            <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                  <Eye className="h-5 w-5 text-purple-400" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-white">
                    Scouting Notes
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    Add observations to support your evaluation
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Strengths
                </label>

                <textarea
                  value={formData.strengths}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      strengths: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-[#080d0a] px-4 py-3 text-sm leading-6 text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="e.g., Excellent pace, strong aerial ability, good positional awareness..."
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Weaknesses
                </label>

                <textarea
                  value={formData.weaknesses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weaknesses: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-[#080d0a] px-4 py-3 text-sm leading-6 text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10"
                  placeholder="e.g., Needs to improve weak foot, decision making under pressure..."
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold text-sky-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  Additional Notes
                </label>

                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-[#080d0a] px-4 py-3 text-sm leading-6 text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/10"
                  placeholder="Any other observations, potential, areas for development..."
                />
              </div>
            </div>
          </section>

          {/* =========================================================
              ACTIONS
          ========================================================= */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/dashboard/players/${playerId}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-3 text-xs font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-[#061009] shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Report'}
              {!saving && (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ===========================================================
          AGENT SELECTION MODAL
      =========================================================== */}
      {showAgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0b100d] shadow-2xl">
            {/* Modal header */}
            <div className="shrink-0 border-b border-white/[0.07] bg-[#0b100d] px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Send className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-white">
                      Recommend Player to Agents
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-600">
                      Choose which verified agents should receive
                      this recommendation.
                    </p>
                  </div>
                </div>

                <button
                  onClick={skipRecommendation}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="overflow-y-auto p-5 sm:p-6">
              <div className="space-y-5">
                {/* Player summary */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080d0a] p-4">
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-500/[0.04] blur-2xl" />

                  <div className="relative flex items-center gap-3">
                    {player?.profile_picture ? (
                      <img
                        src={player.profile_picture}
                        alt={player.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                        <UserRound className="h-5 w-5 text-emerald-400" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Player
                      </p>

                      <p className="truncate text-sm font-black text-white">
                        {player?.name}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="font-bold text-emerald-400">
                          Rating: {formData.overall_rating}/10
                        </span>

                        <span className="text-slate-700">•</span>

                        <span className="text-slate-500">
                          {getRecommendationLabel(
                            formData.recommendation
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-white">
                    Message to Agents{' '}
                    <span className="font-normal text-slate-700">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    value={recommendMessage}
                    onChange={(e) =>
                      setRecommendMessage(e.target.value)
                    }
                    placeholder="Add a personal note about why this player is worth considering..."
                    className="h-24 w-full resize-none rounded-xl border border-white/[0.07] bg-[#080d0a] p-3 text-sm text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                {/* Agent selection */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-bold text-white">
                      Select Agents
                    </label>

                    <span className="rounded-full border border-emerald-500/10 bg-emerald-500/[0.05] px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                      {selectedAgents.length} selected
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/[0.07] bg-[#080d0a]">
                    {agents.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <Building2 className="mx-auto h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          No verified agents available
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.05]">
                        {agents.map((agent) => {
                          const selected =
                            selectedAgents.includes(agent.id)

                          return (
                            <label
                              key={agent.id}
                              className={`flex cursor-pointer items-center gap-3 p-3.5 transition ${
                                selected
                                  ? 'bg-emerald-500/[0.04]'
                                  : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  toggleAgent(agent.id)
                                }
                                className="h-4 w-4 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/30"
                              />

                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                  selected
                                    ? 'bg-emerald-500/10'
                                    : 'bg-white/[0.04]'
                                }`}
                              >
                                <Building2
                                  className={`h-4 w-4 ${
                                    selected
                                      ? 'text-emerald-400'
                                      : 'text-slate-600'
                                  }`}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-white">
                                  {agent.name}
                                </p>

                                <p className="truncate text-[10px] text-slate-600">
                                  {agent.agency ||
                                    'Independent Agent'}
                                </p>
                              </div>

                              {agent.specializations &&
                                agent.specializations.length >
                                  0 && (
                                  <div className="hidden gap-1 sm:flex">
                                    {agent.specializations
                                      .slice(0, 2)
                                      .map(
                                        (spec: string) => (
                                          <span
                                            key={spec}
                                            className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] font-medium text-slate-600"
                                          >
                                            {spec}
                                          </span>
                                        )
                                      )}
                                  </div>
                                )}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="shrink-0 border-t border-white/[0.07] bg-[#080d0a] p-4 sm:p-5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={skipRecommendation}
                  className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Skip & Save Report
                </button>

                <button
                  onClick={sendRecommendations}
                  disabled={
                    selectedAgents.length === 0 || saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-[#061009] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />

                  {saving
                    ? 'Sending...'
                    : `Send to ${selectedAgents.length} Agent(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}