'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star,
  Eye,
  Trash2,
  Mail,
  Filter,
  X,
  CheckCircle,
  Clock,
  Users,
  ArrowRight,
  UserRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

export default function ShortlistPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState(false)
  const [engagementStatus, setEngagementStatus] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchShortlist()
  }, [])

  const fetchShortlist = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (agent) {
      setAgentId(agent.id)

      const { data: shortlistData, error } = await supabase
        .from('shortlists')
        .select('player_id, created_at')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching shortlist:', error)
        setPlayers([])
        setLoading(false)
        return
      }

      if (shortlistData && shortlistData.length > 0) {
        const playerIds = shortlistData.map((item) => item.player_id)

        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .in('id', playerIds)

        if (playersData) {
          const mergedPlayers = playersData.map((player) => ({
            ...player,
            shortlisted_at: shortlistData.find(
              (s) => s.player_id === player.id
            )?.created_at,
          }))

          setPlayers(mergedPlayers)

          const { data: engagements } = await supabase
            .from('engagements')
            .select('player_id, status')
            .eq('agent_id', agent.id)
            .in('player_id', playerIds)

          if (engagements) {
            const statusMap: Record<string, string> = {}

            engagements.forEach((e) => {
              statusMap[e.player_id] = e.status
            })

            setEngagementStatus(statusMap)
          }
        }
      } else {
        setPlayers([])
      }
    }

    setLoading(false)
  }

  const handleRemoveFromShortlist = async (playerId: string) => {
    if (!agentId) return

    const { error } = await supabase
      .from('shortlists')
      .delete()
      .eq('agent_id', agentId)
      .eq('player_id', playerId)

    if (!error) {
      setPlayers(players.filter((p) => p.id !== playerId))
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId))
    }
  }

  const bulkRemove = async () => {
    if (!agentId || selectedPlayers.length === 0) return

    if (
      confirm(
        `Remove ${selectedPlayers.length} player(s) from shortlist?`
      )
    ) {
      const { error } = await supabase
        .from('shortlists')
        .delete()
        .eq('agent_id', agentId)
        .in('player_id', selectedPlayers)

      if (!error) {
        setPlayers(
          players.filter((p) => !selectedPlayers.includes(p.id))
        )
        setSelectedPlayers([])
        setBulkAction(false)
      }
    }
  }

  const bulkRequestEngagement = async () => {
    if (!agentId || selectedPlayers.length === 0) return

    if (
      confirm(
        `Send engagement requests to ${selectedPlayers.length} player(s)?`
      )
    ) {
      let successCount = 0
      let alreadyRequested = 0

      for (const playerId of selectedPlayers) {
        const { data: existing } = await supabase
          .from('engagements')
          .select('id')
          .eq('agent_id', agentId)
          .eq('player_id', playerId)
          .maybeSingle()

        if (!existing) {
          const { error } = await supabase
            .from('engagements')
            .insert({
              agent_id: agentId,
              player_id: playerId,
              status: 'pending',
            })

          if (!error) {
            successCount++

            setEngagementStatus((prev) => ({
              ...prev,
              [playerId]: 'pending',
            }))
          }
        } else {
          alreadyRequested++
        }
      }

      alert(
        `Requests sent to ${successCount} player(s). ${alreadyRequested} already had pending requests.`
      )
    }
  }

  const toggleSelect = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(
        selectedPlayers.filter((id) => id !== playerId)
      )
    } else {
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  const selectAll = () => {
    if (selectedPlayers.length === players.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(players.map((p) => p.id))
    }
  }

  const getEngagementBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Request Pending',
          color: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
          icon: Clock,
        }

      case 'accepted':
        return {
          text: 'Connected',
          color:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
          icon: CheckCircle,
        }

      case 'declined':
        return {
          text: 'Declined',
          color: 'border-red-500/20 bg-red-500/10 text-red-300',
          icon: X,
        }

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <Star className="absolute inset-0 m-auto h-4 w-4 text-amber-400" />
          </div>

          <p className="text-sm text-slate-400">
            Loading your shortlist...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-7 text-white">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b110e] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-amber-500/[0.06]" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                  PlayerFynder • Recruitment
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 bg-clip-text text-transparent">
                  Shortlist
                </span>
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Your curated group of players you're monitoring,
                evaluating and potentially representing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-emerald-400" />

                  <div>
                    <p className="text-2xl font-bold text-white">
                      {players.length}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Shortlisted
                    </p>
                  </div>
                </div>
              </div>

              {players.length > 0 && (
                <button
                  onClick={() => {
                    setBulkAction(!bulkAction)
                    setSelectedPlayers([])
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    bulkAction
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-emerald-400/20 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  <Filter className="h-4 w-4" />

                  {bulkAction
                    ? 'Cancel Bulk Actions'
                    : 'Bulk Actions'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {bulkAction && selectedPlayers.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4 shadow-xl">
          <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" />

          <div className="flex flex-col gap-4 pl-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedPlayers.length} player
                  {selectedPlayers.length !== 1 ? 's' : ''} selected
                </p>

                <p className="text-xs text-slate-500">
                  Choose an action for your selected prospects
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={bulkRequestEngagement}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Mail className="h-4 w-4" />
                Request Engagement
              </button>

              <button
                onClick={bulkRemove}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Remove Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select all */}
      {bulkAction && players.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0b110e] p-4 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={
                selectedPlayers.length === players.length &&
                players.length > 0
              }
              onChange={selectAll}
              className="h-4 w-4 rounded border-white/20 bg-black text-emerald-500 accent-emerald-500 focus:ring-emerald-500"
            />

            <span className="text-sm font-medium text-slate-300">
              Select All Players
            </span>
          </label>

          <span className="text-xs text-slate-500 sm:ml-auto">
            {selectedPlayers.length} of {players.length} selected
          </span>
        </div>
      )}

      {/* Empty state */}
      {players.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b110e] p-10 text-center shadow-2xl sm:p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-amber-500/[0.04]" />

          <div className="relative mx-auto max-w-md">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/20 bg-amber-400/10">
              <Star className="h-9 w-9 text-amber-400" />
            </div>

            <h2 className="text-2xl font-bold text-white">
              Your shortlist is empty
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Start building your recruitment pipeline by saving
              players you're interested in.
            </p>

            <Link
              href="/dashboard/players"
              className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-3 text-sm font-bold text-[#06100a] shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-emerald-300"
            >
              Browse Players
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Shortlist grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => {
              const engagementBadge = getEngagementBadge(
                engagementStatus[player.id]
              )

              const isSelected = selectedPlayers.includes(player.id)

              return (
                <div
                  key={player.id}
                  className={`group relative overflow-hidden rounded-3xl border bg-[#0b110e] shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    isSelected
                      ? 'border-emerald-400/50 shadow-emerald-500/10'
                      : 'border-white/10 hover:border-emerald-400/20'
                  }`}
                >
                  {/* Top accent */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

                  {/* Background glow */}
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl transition group-hover:bg-emerald-500/10" />

                  {bulkAction && (
                    <div className="absolute left-4 top-4 z-20">
                      <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/70 backdrop-blur-md">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(player.id)}
                          className="h-4 w-4 rounded border-white/20 bg-black accent-emerald-500"
                        />
                      </label>
                    </div>
                  )}

                  <div className="relative p-5 sm:p-6">
                    {/* Player header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-amber-500/10">
                          {player.profile_picture ? (
                            <img
                              src={player.profile_picture}
                              alt={player.name || 'Player'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <UserRound className="h-6 w-6 text-emerald-400/70" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-white">
                            {player.name || 'Unnamed Player'}
                          </h3>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                              {player.position || 'Position not set'}
                            </span>

                            {player.verified && (
                              <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {!bulkAction && (
                        <button
                          onClick={() =>
                            handleRemoveFromShortlist(player.id)
                          }
                          className="rounded-xl border border-white/5 bg-white/[0.03] p-2 text-slate-500 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
                          title="Remove from shortlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Player details */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Age
                        </p>
                        <p className="mt-1 text-sm font-bold text-white">
                          {player.age || '—'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Nation
                        </p>
                        <p
                          className="mt-1 truncate text-sm font-bold text-white"
                          title={player.nationality || ''}
                        >
                          {player.nationality || '—'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Height
                        </p>
                        <p className="mt-1 text-sm font-bold text-white">
                          {player.height_cm
                            ? `${player.height_cm}cm`
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Engagement */}
                    {engagementBadge && (
                      <div
                        className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-medium ${engagementBadge.color}`}
                      >
                        <engagementBadge.icon className="h-4 w-4" />
                        <span>{engagementBadge.text}</span>
                      </div>
                    )}

                    {/* Shortlist date */}
                    {player.shortlisted_at && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Added{' '}
                          {new Date(
                            player.shortlisted_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="my-5 h-px bg-white/[0.06]" />

                    {/* Actions */}
                    <Link
                      href={`/dashboard/players/${player.id}`}
                      className="group/link flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3 text-sm font-bold text-[#06100a] shadow-lg shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-emerald-300"
                    >
                      <Eye className="h-4 w-4" />
                      View Full Profile
                      <ArrowRight className="h-4 w-4 transition group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Floating bulk selection indicator */}
      {bulkAction && selectedPlayers.length > 0 && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:w-auto">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-400/20 bg-[#0a100d]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  {selectedPlayers.length} selected
                </p>
                <p className="text-[10px] text-slate-500">
                  Ready for bulk action
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlayers([])}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}