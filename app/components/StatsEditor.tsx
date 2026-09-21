'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  TrendingUp,
  Award,
  X,
  Minus,
  Plus,
  Target,
  Shield,
  Trophy,
  AlertCircle,
  Save,
} from 'lucide-react'

interface StatsEditorProps {
  playerId: string
  currentStats: {
    matches_played: number
    goals: number
    assists: number
    clean_sheets?: number
    yellow_cards?: number
    red_cards?: number
  }
  onUpdate: () => void
  onClose?: () => void
}

export default function StatsEditor({
  playerId,
  currentStats,
  onUpdate,
  onClose,
}: StatsEditorProps) {
  const [stats, setStats] = useState({
    matches_played: currentStats.matches_played || 0,
    goals: currentStats.goals || 0,
    assists: currentStats.assists || 0,
    clean_sheets: currentStats.clean_sheets || 0,
    yellow_cards: currentStats.yellow_cards || 0,
    red_cards: currentStats.red_cards || 0,
  })

  const [loading, setLoading] = useState(false)

  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('player_stats')
      .upsert({
        player_id: playerId,
        matches_played: stats.matches_played,
        goals: stats.goals,
        assists: stats.assists,
        clean_sheets: stats.clean_sheets,
        yellow_cards: stats.yellow_cards,
        red_cards: stats.red_cards,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      setMessage({
        type: 'error',
        text: 'Error updating stats: ' + error.message,
      })

      setLoading(false)
    } else {
      setMessage({
        type: 'success',
        text: 'Statistics updated successfully!',
      })

      onUpdate()

      // Auto close after 1.5 seconds
      setTimeout(() => {
        if (onClose) {
          onClose()
        }
      }, 1500)
    }

    setLoading(false)
  }

  const handleIncrement = (
    field: keyof typeof stats,
    amount: number
  ) => {
    setStats((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + amount),
    }))
  }

  const updateNumber = (
    field: keyof typeof stats,
    value: string
  ) => {
    setStats((prev) => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }))
  }

  const statCards = [
    {
      field: 'matches_played' as const,
      label: 'Matches Played',
      icon: Trophy,
      description: 'Total appearances',
      accent: 'emerald',
    },
    {
      field: 'goals' as const,
      label: 'Goals',
      icon: Target,
      description: 'Goals scored',
      accent: 'gold',
    },
    {
      field: 'assists' as const,
      label: 'Assists',
      icon: TrendingUp,
      description: 'Goals created',
      accent: 'emerald',
    },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f0d] shadow-2xl shadow-black/30">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#101612]">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-amber-400/5 blur-3xl" />

        <div className="relative flex items-center justify-between p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Edit Statistics
              </h2>

              <p className="mt-0.5 text-xs text-white/40">
                Update player performance data
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
          CONTENT
      ========================================================= */}
      <div className="p-5 sm:p-6">

        {/* Status message */}
        {message && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
              message.type === 'success'
                ? 'border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300'
                : 'border-red-400/20 bg-red-500/[0.08] text-red-300'
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                message.type === 'success'
                  ? 'bg-emerald-500/10'
                  : 'bg-red-500/10'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
            </div>

            <div className="pt-1">
              <p className="text-sm font-medium">
                {message.text}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">

          {/* =====================================================
              PRIMARY STATISTICS
          ===================================================== */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Performance
                </h3>

                <p className="mt-1 text-xs text-white/35">
                  Core player statistics
                </p>
              </div>

              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  Core stats
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {statCards.map((stat) => {
                const Icon = stat.icon

                return (
                  <div
                    key={stat.field}
                    className="rounded-2xl border border-white/10 bg-[#101612] p-4 transition hover:border-white/15"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            stat.accent === 'gold'
                              ? 'bg-amber-400/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-white">
                            {stat.label}
                          </p>

                          <p className="mt-0.5 text-[10px] text-white/30">
                            {stat.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleIncrement(stat.field, -1)
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/40 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={stats[stat.field]}
                        onChange={(e) =>
                          updateNumber(
                            stat.field,
                            e.target.value
                          )
                        }
                        className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b0f0d] px-3 text-center text-base font-bold text-white outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleIncrement(stat.field, 1)
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* =====================================================
              ADVANCED STATISTICS
          ===================================================== */}
          <section className="border-t border-white/10 pt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                <Award className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  Advanced Statistics
                </h3>

                <p className="mt-1 text-xs text-white/35">
                  Additional performance information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

              {/* Clean Sheets */}
              <div className="rounded-xl border border-white/10 bg-[#101612] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />

                  <label className="text-xs font-semibold text-white">
                    Clean Sheets
                  </label>
                </div>

                <input
                  type="number"
                  min="0"
                  value={stats.clean_sheets}
                  onChange={(e) =>
                    updateNumber(
                      'clean_sheets',
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0f0d] px-4 text-sm font-semibold text-white outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              {/* Yellow Cards */}
              <div className="rounded-xl border border-white/10 bg-[#101612] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-4 w-3 rounded-[2px] bg-amber-400" />

                  <label className="text-xs font-semibold text-white">
                    Yellow Cards
                  </label>
                </div>

                <input
                  type="number"
                  min="0"
                  value={stats.yellow_cards}
                  onChange={(e) =>
                    updateNumber(
                      'yellow_cards',
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0f0d] px-4 text-sm font-semibold text-white outline-none transition focus:border-amber-400/40 focus:ring-2 focus:ring-amber-500/10"
                />
              </div>

              {/* Red Cards */}
              <div className="rounded-xl border border-white/10 bg-[#101612] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-4 w-3 rounded-[2px] bg-red-500" />

                  <label className="text-xs font-semibold text-white">
                    Red Cards
                  </label>
                </div>

                <input
                  type="number"
                  min="0"
                  value={stats.red_cards}
                  onChange={(e) =>
                    updateNumber(
                      'red_cards',
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0b0f0d] px-4 text-sm font-semibold text-white outline-none transition focus:border-red-400/40 focus:ring-2 focus:ring-red-500/10"
                />
              </div>
            </div>
          </section>

          {/* =====================================================
              SAVE
          ===================================================== */}
          <div className="border-t border-white/10 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Statistics
                </>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-emerald-400/50" />

              <p className="text-[10px] text-white/25">
                Player performance data will be updated securely
              </p>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}