'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Star,
  Video,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Heart,
  Eye,
  CheckCircle,
  User,
  Trophy,
  Activity,
  Share2,
  MessageCircle,
  Briefcase,
  FileText,
  X,
  Send,
  AlertCircle,
  Shield,
  Target,
  Zap,
  Globe,
  Ruler,
  Dumbbell,
  Users,
  BarChart3,
  Clock,
  ChevronRight,
} from 'lucide-react'

interface PlayerProfilePageProps {
  params: Promise<{ id: string }>
}

export default function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [seasonStats, setSeasonStats] = useState<any[]>([])
  const [careerHistory, setCareerHistory] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [achievements, setAchievements] = useState<string[]>([])
  const [performanceRatings, setPerformanceRatings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [isShortlisted, setIsShortlisted] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newAchievement, setNewAchievement] = useState('')

  const [showEngagementModal, setShowEngagementModal] = useState(false)
  const [engagementMessage, setEngagementMessage] = useState('')
  const [messageError, setMessageError] = useState('')
  const [charCount, setCharCount] = useState(0)

  const MAX_CHARS = 500

  const [newSeasonStat, setNewSeasonStat] = useState({
    season: '',
    competition: '',
    club: '',
    appearances: 0,
    goals: 0,
    assists: 0,
    minutes_played: 0,
    yellow_cards: 0,
    red_cards: 0,
    pass_accuracy: 0,
    shot_accuracy: 0
  })

  const [newCareerEntry, setNewCareerEntry] = useState({
    club_name: '',
    league: '',
    country: '',
    start_date: '',
    end_date: '',
    is_current: false,
    transfer_type: 'Permanent',
    transfer_fee: '',
    appearances: 0,
    goals: 0,
    assists: 0
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params
      setPlayerId(id)
    }

    unwrapParams()
  }, [params])

  useEffect(() => {
    if (playerId) {
      fetchPlayerData()
      fetchUserRole()
    }
  }, [playerId])

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: scout } = await supabase
      .from('scouts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (scout) {
      setUserRole('scout')
      return
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (agent) {
      setUserRole('agent')
      setAgentId(agent.id)
      return
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (admin) {
      setUserRole('admin')
    }
  }

  const fetchPlayerData = async () => {
    if (!playerId) return

    setLoading(true)

    const { data: playerData } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    setPlayer(playerData)

    if (playerData?.achievements && Array.isArray(playerData.achievements)) {
      setAchievements(playerData.achievements)
    }

    if (playerData?.performance_ratings) {
      setPerformanceRatings(playerData.performance_ratings)
    }

    if (playerData) {
      const { data: mediaData } = await supabase
        .from('media')
        .select('*')
        .eq('player_id', playerData.id)
        .order('created_at', { ascending: false })

      if (mediaData) setMedia(mediaData)
    }

    const { data: seasonData } = await supabase
      .from('season_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('season', { ascending: false })

    if (seasonData) setSeasonStats(seasonData)

    const { data: careerData } = await supabase
      .from('career_history')
      .select('*')
      .eq('player_id', playerId)
      .order('start_date', { ascending: false })

    if (careerData) setCareerHistory(careerData)

    const { data: { user } } = await supabase.auth.getUser()

    if (user && userRole === 'agent') {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (agent) {
        setAgentId(agent.id)

        const { data: shortlistData } = await supabase
          .from('shortlists')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('player_id', playerId)
          .maybeSingle()

        setIsShortlisted(!!shortlistData)
      }
    }

    setLoading(false)
  }

  const handleShortlist = async () => {
    if (!agentId || !playerId) {
      alert('Please log in as an agent to shortlist players')
      return
    }

    if (isShortlisted) {
      const { error } = await supabase
        .from('shortlists')
        .delete()
        .eq('agent_id', agentId)
        .eq('player_id', playerId)

      if (error) {
        alert('Error: ' + error.message)
      } else {
        setIsShortlisted(false)
        alert('Removed from shortlist')
      }
    } else {
      const { error } = await supabase
        .from('shortlists')
        .insert({ agent_id: agentId, player_id: playerId })

      if (error) {
        alert('Error: ' + error.message)
      } else {
        setIsShortlisted(true)
        alert('Added to shortlist!')
      }
    }
  }

  const handleRequestEngagement = () => {
    if (!agentId || !playerId) {
      alert('Please log in as an agent to request engagement')
      return
    }

    setShowEngagementModal(true)
    setEngagementMessage('')
    setCharCount(0)
    setMessageError('')
  }

  const sendEngagementRequest = async () => {
    if (!agentId || !playerId) return

    const trimmedMessage = engagementMessage.trim()

    if (trimmedMessage.length === 0) {
      setMessageError('Please write a message to the player')
      return
    }

    if (trimmedMessage.length > MAX_CHARS) {
      setMessageError(`Message exceeds ${MAX_CHARS} characters`)
      return
    }

    setRequesting(true)
    setMessageError('')

    const { error } = await supabase
      .from('engagements')
      .insert({
        agent_id: agentId,
        player_id: playerId,
        status: 'pending',
        agent_message: trimmedMessage,
        message_character_count: trimmedMessage.length,
        created_at: new Date().toISOString()
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      const { data: playerData } = await supabase
        .from('players')
        .select('email, user_id')
        .eq('id', playerId)
        .single()

      const { data: agentData } = await supabase
        .from('agents')
        .select('name')
        .eq('id', agentId)
        .single()

      if (playerData && agentData) {
        await supabase
          .from('email_notifications')
          .insert({
            user_id: playerData.user_id,
            recipient_email: playerData.email,
            recipient_type: 'player',
            subject: 'New Engagement Request',
            message: `Hello,\n\nAgent ${agentData.name} has sent you an engagement request.\n\nMessage: "${trimmedMessage}"\n\nLog in to your dashboard to view and respond to this request.\n\nBest regards,\nPlayerFynder Team`,
            status: 'pending',
            created_at: new Date().toISOString()
          })
      }

      alert('Engagement request sent! Admin will review it.')

      setShowEngagementModal(false)
      setEngagementMessage('')
      setCharCount(0)
    }

    setRequesting(false)
  }

  const handleMessageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const text = e.target.value

    if (text.length <= MAX_CHARS) {
      setEngagementMessage(text)
      setCharCount(text.length)
      setMessageError('')
    }
  }

  const messageTemplates = [
    {
      title: 'Professional Interest',
      text: 'Hello, I have reviewed your profile and believe you have great potential. I would like to discuss representing you and helping you achieve your football goals.'
    },
    {
      title: 'Talent Recognition',
      text: 'Hi, your skills are impressive and I think you meet the requirements for representation. I would love to have a conversation about your career aspirations.'
    },
    {
      title: 'General Interest',
      text: 'Hello, I am interested in your profile and believe we could work well together. I have opportunities that might fit your playing style.'
    }
  ]

  const totalGoals = seasonStats.reduce(
    (sum, stat) => sum + (stat.goals || 0),
    0
  )

  const totalAssists = seasonStats.reduce(
    (sum, stat) => sum + (stat.assists || 0),
    0
  )

  const totalAppearances = seasonStats.reduce(
    (sum, stat) => sum + (stat.appearances || 0),
    0
  )

  const otherMedia = media.filter(
    m => !m.url?.includes('profile')
  )

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#060907] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-5 h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
            <div className="absolute inset-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-white">
            Loading player profile
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Preparing scouting information...
          </p>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-[70vh] bg-[#060907] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <User className="w-7 h-7 text-red-400" />
          </div>

          <h2 className="text-xl font-bold text-white">
            Player not found
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            The player profile could not be found or is no longer available.
          </p>

          <Link
            href="/dashboard/players"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Players
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060907] text-white relative overflow-hidden">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[500px] bg-emerald-500/[0.045] blur-[130px] rounded-full" />
        <div className="absolute top-[35%] right-0 w-[500px] h-[500px] bg-yellow-500/[0.025] blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-[35%] w-[500px] h-[400px] bg-emerald-400/[0.025] blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Back navigation */}
        <Link
          href="/dashboard/players"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Players
        </Link>

        {/* ========================================================= */}
        {/* PLAYER HERO                                               */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b100d] shadow-2xl">

          {/* Hero background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/70 via-[#0a0f0c] to-[#090b0a]" />
            <div className="absolute top-0 right-0 w-[500px] h-[350px] bg-emerald-500/[0.08] blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-1/3 w-[400px] h-[200px] bg-yellow-500/[0.035] blur-[100px] rounded-full" />
          </div>

          {/* Decorative lines */}
          <div className="absolute inset-0 opacity-[0.035]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">

            {/* Top status row */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-400 font-bold">
                  Player Profile
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <Eye className="w-3.5 h-3.5" />
                {player.views_count || 0} profile views
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">

              {/* Player image */}
              <div className="relative flex-shrink-0">

                <div className="absolute -inset-3 rounded-full bg-emerald-500/10 blur-xl" />

                {player.profile_picture ? (
                  <img
                    src={player.profile_picture}
                    alt={player.name}
                    className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-emerald-400/40 shadow-[0_0_45px_rgba(16,185,129,.18)]"
                  />
                ) : (
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full bg-[#111814] border-4 border-emerald-400/30 shadow-[0_0_45px_rgba(16,185,129,.15)] flex items-center justify-center">
                    <User className="w-20 h-20 text-slate-600" />
                  </div>
                )}

                {/* Verified badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-1.5 bg-emerald-500 text-black px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide shadow-lg">
                  <CheckCircle className="w-3 h-3" />
                  Verified Player
                </div>
              </div>

              {/* Main player information */}
              <div className="flex-1 text-center lg:text-left">

                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    {player.position || 'Position not set'}
                  </span>

                  {player.current_club && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-slate-400 text-[10px] font-semibold">
                      {player.current_club}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  {player.name}
                </h1>

                <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 mt-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {player.nationality || 'Nationality not set'}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Age {player.age || '?'}
                  </span>

                  {player.preferred_foot && (
                    <span className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-400" />
                      {player.preferred_foot} foot
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-7">

                  {userRole === 'agent' && (
                    <>
                      <button
                        onClick={handleShortlist}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
                          isShortlisted
                            ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                            : 'bg-white/[0.07] border border-white/[0.10] text-white hover:bg-white/[0.12]'
                        }`}
                      >
                        <Star
                          className="w-4 h-4"
                          fill={isShortlisted ? 'currentColor' : 'none'}
                        />
                        {isShortlisted
                          ? 'Shortlisted'
                          : 'Add to Shortlist'}
                      </button>

                      <button
                        onClick={handleRequestEngagement}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Request Engagement
                      </button>
                    </>
                  )}

                  {userRole === 'scout' && (
                    <Link
                      href={`/dashboard/scouting/reports/new/${player.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 transition"
                    >
                      <FileText className="w-4 h-4" />
                      Create Scouting Report
                    </Link>
                  )}

                  <button
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-slate-300 text-sm font-semibold hover:bg-white/[0.10] hover:text-white transition"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* QUICK STATS                                               */}
        {/* ========================================================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">

          {[
            {
              label: 'Appearances',
              value: totalAppearances,
              icon: TrendingUp,
              accent: 'emerald'
            },
            {
              label: 'Goals',
              value: totalGoals,
              icon: Trophy,
              accent: 'gold'
            },
            {
              label: 'Assists',
              value: totalAssists,
              icon: Heart,
              accent: 'blue'
            },
            {
              label: 'Profile Views',
              value: player.views_count || 0,
              icon: Eye,
              accent: 'purple'
            }
          ].map((stat) => {
            const Icon = stat.icon

            const accentClasses =
              stat.accent === 'emerald'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10'
                : stat.accent === 'gold'
                  ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/10'
                  : stat.accent === 'blue'
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500/10'
                    : 'text-purple-400 bg-purple-500/10 border-purple-500/10'

            return (
              <div
                key={stat.label}
                className="group rounded-2xl border border-white/[0.07] bg-[#0b100d] p-4 sm:p-5 hover:border-white/[0.12] transition"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${accentClasses}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">
                    Career
                  </span>
                </div>

                <p className="text-2xl sm:text-3xl font-black text-white mt-4">
                  {stat.value || 0}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </section>

        {/* ========================================================= */}
        {/* MAIN CONTENT                                              */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

          {/* ======================================================= */}
          {/* LEFT COLUMN                                             */}
          {/* ======================================================= */}
          <div className="space-y-5">

            {/* About */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#0b100d] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Player Information
                    </h2>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Profile details
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-1">

                {[
                  ['Full Name', player.name, User],
                  ['Position', player.position, Target],
                  ['Age', player.age ? `${player.age} years` : '-', Calendar],
                  ['Nationality', player.nationality, Globe],
                  ['Preferred Foot', player.preferred_foot, Zap],
                  [
                    'Height / Weight',
                    `${player.height_cm ? `${player.height_cm} cm` : '—'} / ${player.weight_kg ? `${player.weight_kg} kg` : '—'}`,
                    Ruler
                  ],
                  ['Jersey Number', player.jersey_number, Trophy],
                  ['Current Club', player.current_club, Briefcase],
                  [
                    'Market Value',
                    player.market_value
                      ? `€${(player.market_value / 1000000).toFixed(1)}M`
                      : '-',
                    TrendingUp
                  ]
                ].map(([label, value, Icon]: any) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="text-xs text-slate-500">
                        {label}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-slate-200 text-right truncate max-w-[55%]">
                      {value || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Performance Ratings */}
            {performanceRatings && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#0b100d] overflow-hidden">

                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Performance Rating
                    </h2>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Player attributes
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {Object.entries(performanceRatings).map(
                    ([key, value]: [string, any]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-slate-400 capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>

                          <span className="text-xs font-bold text-white">
                            {value}/100
                          </span>
                        </div>

                        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300"
                            style={{
                              width: `${Math.min(
                                Math.max(Number(value) || 0, 0),
                                100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#0b100d] overflow-hidden">

                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-yellow-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Achievements
                    </h2>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Career highlights
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {achievements.map((achievement, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]"
                    >
                      <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                      </div>

                      <span className="text-xs text-slate-300 leading-relaxed pt-1">
                        {achievement}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Biography */}
            {player.bio && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#0b100d] overflow-hidden">

                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Biography
                    </h2>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                      About the player
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-slate-400 leading-7">
                    {player.bio}
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN                                            */}
          {/* ======================================================= */}
          <div className="lg:col-span-2 space-y-5">

            {/* Career Statistics */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#0b100d] overflow-hidden">

              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Career Statistics
                    </h2>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Season performance
                    </p>
                  </div>
                </div>

                {seasonStats.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    {seasonStats.length} Seasons
                  </span>
                )}
              </div>

              {seasonStats.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-5 h-5 text-slate-600" />
                  </div>

                  <p className="text-sm text-slate-500">
                    No season statistics available yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                        <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-600">
                          Season
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-slate-600">
                          Competition
                        </th>
                        <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-600">
                          Apps
                        </th>
                        <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-600">
                          Goals
                        </th>
                        <th className="px-5 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-slate-600">
                          Assists
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {seasonStats.map((stat, idx) => (
                        <tr
                          key={stat.id}
                          className={`hover:bg-white/[0.025] transition ${
                            idx !== seasonStats.length - 1
                              ? 'border-b border-white/[0.05]'
                              : ''
                          }`}
                        >
                          <td className="px-5 py-4 text-sm font-bold text-white">
                            {stat.season}
                          </td>

                          <td className="px-4 py-4 text-xs text-slate-400">
                            {stat.competition || '-'}
                          </td>

                          <td className="px-4 py-4 text-center text-sm font-semibold text-slate-300">
                            {stat.appearances || 0}
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-bold text-emerald-400">
                              {stat.goals || 0}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="text-sm font-bold text-blue-400">
                              {stat.assists || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Career History */}
            {careerHistory.length > 0 && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#0b100d] overflow-hidden">

                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-yellow-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Career History
                    </h2>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Club history
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="relative">

                    <div className="absolute left-5 top-5 bottom-5 w-px bg-white/[0.06]" />

                    <div className="space-y-5">
                      {careerHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="relative flex gap-4"
                        >
                          <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-xl bg-[#111814] border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">
                            {entry.club_name?.charAt(0) || 'C'}
                          </div>

                          <div className="flex-1 min-w-0 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">

                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  {entry.club_name}
                                </h4>

                                <p className="text-xs text-slate-500 mt-1">
                                  {entry.league} {entry.country ? `• ${entry.country}` : ''}
                                </p>
                              </div>

                              {entry.is_current && (
                                <span className="self-start inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] uppercase tracking-wider font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Current
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-3">
                              <Clock className="w-3.5 h-3.5" />
                              {entry.start_date
                                ? new Date(entry.start_date).getFullYear()
                                : '?'}
                              {' - '}
                              {entry.is_current
                                ? 'Present'
                                : entry.end_date
                                  ? new Date(entry.end_date).getFullYear()
                                  : ''}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-[10px] text-slate-400">
                                {entry.appearances || 0} Apps
                              </span>

                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-[10px] text-emerald-400">
                                {entry.goals || 0} Goals
                              </span>

                              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-[10px] text-blue-400">
                                {entry.assists || 0} Assists
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Highlight Gallery */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#0b100d] overflow-hidden">

              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/10 flex items-center justify-center">
                    <Video className="w-4 h-4 text-purple-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Highlight Gallery
                    </h2>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                      Videos & images
                    </p>
                  </div>
                </div>

                {otherMedia.length > 0 && (
                  <span className="text-[10px] text-slate-600">
                    {otherMedia.length} items
                  </span>
                )}
              </div>

              <div className="p-5">
                {otherMedia.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-dashed border-white/[0.07] bg-white/[0.015]">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                      <Video className="w-5 h-5 text-purple-400/60" />
                    </div>

                    <p className="text-sm text-slate-500">
                      No highlight videos or images yet
                    </p>

                    <p className="text-xs text-slate-700 mt-1">
                      Player media will appear here
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherMedia.map((item) => (
                      <div
                        key={item.id}
                        className="relative group overflow-hidden rounded-xl border border-white/[0.07] bg-black"
                      >
                        {item.type === 'video' ? (
                          <video
                            src={item.url}
                            className="w-full h-56 object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.title || 'Player highlight'}
                            className="w-full h-56 object-cover transition duration-500 group-hover:scale-105"
                          />
                        )}

                        {item.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pt-8 pb-3">
                            <p className="text-xs font-semibold text-white">
                              {item.title}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* =========================================================== */}
      {/* ENGAGEMENT MODAL                                            */}
      {/* =========================================================== */}
      {showEngagementModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">

          <div className="bg-[#0b100d] border border-white/[0.09] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="relative p-6 border-b border-white/[0.07] overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/[0.08] blur-3xl rounded-full" />

              <div className="relative flex justify-between items-start">

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Request Engagement
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      Contact {player?.name || 'the player'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowEngagementModal(false)
                    setEngagementMessage('')
                    setMessageError('')
                  }}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.08] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* Templates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-white">
                    Message Templates
                  </p>

                  <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                    Quick start
                  </span>
                </div>

                <div className="space-y-2">
                  {messageTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setEngagementMessage(template.text)
                        setCharCount(template.text.length)
                        setMessageError('')
                      }}
                      className="w-full text-left p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-emerald-500/25 hover:bg-emerald-500/[0.035] transition group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 transition">
                          {template.title}
                        </p>

                        <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-emerald-400 transition" />
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1 truncate">
                        {template.text.substring(0, 100)}...
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-white">
                    Your Message
                    <span className="text-red-400 ml-1">*</span>
                  </label>

                  <span
                    className={`text-[10px] ${
                      charCount > MAX_CHARS * 0.9
                        ? 'text-yellow-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {charCount}/{MAX_CHARS}
                  </span>
                </div>

                <textarea
                  value={engagementMessage}
                  onChange={handleMessageChange}
                  placeholder="Write a professional message introducing yourself and why you're interested in this player..."
                  rows={6}
                  className={`w-full px-4 py-3.5 bg-black/20 border rounded-xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 resize-none transition ${
                    messageError
                      ? 'border-red-500/60 focus:ring-red-500/30'
                      : 'border-white/[0.08] focus:border-emerald-500/40 focus:ring-emerald-500/20'
                  }`}
                />

                {messageError && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{messageError}</span>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.035] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-emerald-300">
                      Tips for a great message
                    </p>

                    <ul className="text-[11px] text-slate-500 mt-2 space-y-1.5">
                      <li>• Introduce yourself and your agency</li>
                      <li>• Explain why you're interested in this player</li>
                      <li>• Be professional and respectful</li>
                      <li>• Keep your message clear and concise</li>
                      <li>• Your message will be reviewed by the admin first</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-white/[0.07] bg-black/10 flex flex-col-reverse sm:flex-row justify-end gap-2.5">

              <button
                onClick={() => {
                  setShowEngagementModal(false)
                  setEngagementMessage('')
                  setMessageError('')
                }}
                className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 text-sm font-semibold hover:bg-white/[0.05] hover:text-white transition"
                disabled={requesting}
              >
                Cancel
              </button>

              <button
                onClick={sendEngagementRequest}
                disabled={requesting || !engagementMessage.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {requesting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}