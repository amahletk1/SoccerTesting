'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Heart,
  Eye,
  CheckCircle,
  Video,
  User,
  Trophy,
  Briefcase,
  Share2,
  MessageCircle,
  Star,
  ShieldCheck,
  Activity,
  Target,
  Footprints,
  Gauge,
  Ruler,
  Weight,
  ExternalLink,
  BarChart3,
  Sparkles,
} from 'lucide-react'

export default function PlayerViewPage() {
  const [profile, setProfile] = useState<any>(null)
  const [seasonStats, setSeasonStats] = useState<any[]>([])
  const [careerHistory, setCareerHistory] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [achievements, setAchievements] = useState<string[]>([])
  const [scoutRatings, setScoutRatings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profileViews, setProfileViews] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchPlayerData()
  }, [])

  // Increment profile views
  useEffect(() => {
    if (profile?.id) {
      const incrementViews = async () => {
        const currentViews = profile.views_count || 0

        const { error } = await supabase
          .from('players')
          .update({ views_count: currentViews + 1 })
          .eq('id', profile.id)

        if (!error) {
          setProfileViews(currentViews + 1)
          setProfile({ ...profile, views_count: currentViews + 1 })
        }
      }

      incrementViews()
    }
  }, [profile?.id])

  const fetchPlayerData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Get player profile
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!player) {
      router.push('/dashboard')
      return
    }

    setProfile(player)

    // Load achievements from profile
    if (player.achievements && Array.isArray(player.achievements)) {
      setAchievements(player.achievements)
    }

    // Get season stats
    const { data: seasonData } = await supabase
      .from('season_stats')
      .select('*')
      .eq('player_id', player.id)
      .order('season', { ascending: false })

    if (seasonData) setSeasonStats(seasonData)

    // Get career history
    const { data: careerData } = await supabase
      .from('career_history')
      .select('*')
      .eq('player_id', player.id)
      .order('start_date', { ascending: false })

    if (careerData) setCareerHistory(careerData)

    // Get player media
    const { data: mediaData } = await supabase
      .from('media')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })

    if (mediaData) setMedia(mediaData)

    // Fetch scout ratings - SIMPLIFIED
    const { data: reports, error } = await supabase
      .from('scouting_reports')
      .select('*')
      .eq('player_id', player.id)

    console.log('📊 Reports for player:', player.id, reports)

    if (reports && reports.length > 0) {
      // Calculate averages from all reports
      const avg = {
        speed: Math.round(
          reports.reduce(
            (a: number, r: any) => a + r.speed_rating,
            0
          ) / reports.length
        ),
        shooting: Math.round(
          reports.reduce(
            (a: number, r: any) => a + r.shooting_rating,
            0
          ) / reports.length
        ),
        passing: Math.round(
          reports.reduce(
            (a: number, r: any) => a + r.passing_rating,
            0
          ) / reports.length
        ),
        dribbling: Math.round(
          reports.reduce(
            (a: number, r: any) => a + r.dribbling_rating,
            0
          ) / reports.length
        ),
        defending: Math.round(
          reports.reduce(
            (a: number, r: any) => a + r.defending_rating,
            0
          ) / reports.length
        ),
        physical: Math.round(
          reports.reduce(
            (a: number, r: any) => a + r.physical_rating,
            0
          ) / reports.length
        ),
        totalReports: reports.length,
      }

      console.log('✅ Calculated averages:', avg)
      setScoutRatings(avg)
    } else {
      console.log('⚠️ No reports found for player:', player.id)
    }

    setLoading(false)
  }

  // Calculate total stats from all seasons
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

  // Format market value for display
  const formatMarketValue = (value: number) => {
    if (!value) return '-'

    if (value >= 1000000) {
      return `R ${(value / 1000000).toFixed(1)}M`
    }

    return `R ${Number(value).toLocaleString('en-ZA')}`
  }

  const ratingItems = [
    {
      key: 'speed',
      label: 'Speed',
      icon: Gauge,
    },
    {
      key: 'shooting',
      label: 'Shooting',
      icon: Target,
    },
    {
      key: 'passing',
      label: 'Passing',
      icon: Activity,
    },
    {
      key: 'dribbling',
      label: 'Dribbling',
      icon: Footprints,
    },
    {
      key: 'defending',
      label: 'Defending',
      icon: ShieldCheck,
    },
    {
      key: 'physical',
      label: 'Physical',
      icon: Trophy,
    },
  ]

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

          <p className="text-sm text-white/50">
            Loading player profile...
          </p>
        </div>
      </div>
    )
  }

  // Separate profile picture from other media
  const otherMedia = media.filter(
    (m) => !m.url?.includes('profile')
  )

  return (
    <div className="min-h-screen bg-[#070b09] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] -right-40 w-[450px] h-[450px] bg-yellow-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-[35%] w-[400px] h-[300px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

        {/* ========================================================= */}
        {/* HERO */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0b110e] shadow-2xl">

          {/* Background details */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(16,185,129,0.18),transparent_35%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_100%,rgba(212,175,55,0.08),transparent_30%)]" />

            <div className="absolute right-[-100px] top-[-120px] w-[420px] h-[420px] rounded-full border border-emerald-400/10" />
            <div className="absolute right-[-30px] top-[-50px] w-[280px] h-[280px] rounded-full border border-emerald-400/10" />
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">

            {/* Top label */}
            <div className="flex items-center justify-between mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                  Player Profile
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-white/35">
                <Eye className="w-4 h-4" />
                {profileViews || profile?.views_count || 0} profile views
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8">

              {/* Profile image */}
              <div className="relative shrink-0">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-400/30 to-yellow-400/10 blur-md" />

                {profile?.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={profile.name}
                    className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-[#101913] ring-1 ring-emerald-400/40 shadow-2xl"
                  />
                ) : (
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full bg-[#101913] border-4 border-[#101913] ring-1 ring-emerald-400/40 flex items-center justify-center shadow-2xl">
                    <User className="w-20 h-20 text-white/20" />
                  </div>
                )}

                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-black text-[11px] font-extrabold shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified Player
                  </div>
                </div>
              </div>

              {/* Player identity */}
              <div className="flex-1 text-center lg:text-left pb-1">

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  {profile?.name || 'Player Name'}
                </h1>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mt-4">

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-white/65">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {profile?.nationality || 'Location not set'}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-white/65">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Age {profile?.age || '?'}
                  </span>

                  <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm font-semibold text-emerald-300">
                    {profile?.position || 'Position not set'}
                  </span>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-6">

                  <button
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-extrabold transition-all duration-200 shadow-lg shadow-emerald-500/10"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Agent
                  </button>

                  <button
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white text-sm font-semibold transition-all duration-200"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Profile
                  </button>

                </div>
              </div>

              {/* Quick profile metrics */}
              <div className="hidden xl:grid grid-cols-2 gap-3 w-[230px] shrink-0">
                <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    Market Value
                  </p>
                  <p className="mt-2 text-lg font-black text-yellow-400">
                    {formatMarketValue(profile?.market_value)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    Club
                  </p>
                  <p className="mt-2 text-sm font-bold text-white truncate">
                    {profile?.current_club || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* STAT CARDS */}
        {/* ========================================================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">

          <div className="group rounded-2xl border border-white/[0.07] bg-[#0b110e] p-4 sm:p-5 hover:border-emerald-500/25 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/30">
                Career
              </span>
            </div>

            <p className="mt-4 text-2xl sm:text-3xl font-black text-white">
              {totalAppearances || 0}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Matches Played
            </p>
          </div>

          <div className="group rounded-2xl border border-white/[0.07] bg-[#0b110e] p-4 sm:p-5 hover:border-yellow-500/25 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/30">
                Output
              </span>
            </div>

            <p className="mt-4 text-2xl sm:text-3xl font-black text-white">
              {totalGoals || 0}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Goals Scored
            </p>
          </div>

          <div className="group rounded-2xl border border-white/[0.07] bg-[#0b110e] p-4 sm:p-5 hover:border-pink-500/25 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/30">
                Creation
              </span>
            </div>

            <p className="mt-4 text-2xl sm:text-3xl font-black text-white">
              {totalAssists || 0}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Assists
            </p>
          </div>

          <div className="group rounded-2xl border border-white/[0.07] bg-[#0b110e] p-4 sm:p-5 hover:border-blue-500/25 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/30">
                Reach
              </span>
            </div>

            <p className="mt-4 text-2xl sm:text-3xl font-black text-white">
              {profileViews || profile?.views_count || 0}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Profile Views
            </p>
          </div>

        </section>

        {/* ========================================================= */}
        {/* MAIN CONTENT */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

          {/* ======================================================= */}
          {/* LEFT COLUMN */}
          {/* ======================================================= */}
          <div className="space-y-5">

            {/* About */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#0b110e] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  Player Profile
                </h2>
                <p className="text-xs text-white/35 mt-1">
                  Personal and playing information
                </p>
              </div>

              <div className="p-5 space-y-0">

                {[
                  ['Full Name', profile?.name],
                  ['Position', profile?.position],
                  ['Age', profile?.age ? `${profile.age} years` : null],
                  ['Nationality', profile?.nationality],
                  ['Preferred Foot', profile?.preferred_foot],
                  [
                    'Height',
                    profile?.height_cm
                      ? `${(profile.height_cm / 100).toFixed(2)}m`
                      : null,
                  ],
                  [
                    'Weight',
                    profile?.weight_kg
                      ? `${profile.weight_kg}kg`
                      : null,
                  ],
                  ['Jersey Number', profile?.jersey_number],
                  ['Current Club', profile?.current_club],
                  [
                    'Market Value',
                    formatMarketValue(profile?.market_value),
                  ],
                  [
                    'Highest Level Played',
                    profile?.highest_level_played,
                  ],
                  [
                    'National Team',
                    profile?.national_team_representation,
                  ],
                  ['Agent History', profile?.agent_history],
                ].map(([label, value], index) => (
                  <div
                    key={String(label)}
                    className={`flex items-start justify-between gap-4 py-3 ${
                      index !== 12
                        ? 'border-b border-white/[0.05]'
                        : ''
                    }`}
                  >
                    <span className="text-xs text-white/35 shrink-0">
                      {label}
                    </span>

                    <span className="text-sm font-semibold text-white/80 text-right break-words">
                      {value || '-'}
                    </span>
                  </div>
                ))}

                {profile?.transfermarkt_url && (
                  <div className="pt-4">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
                      Transfermarkt Profile
                    </p>

                    <a
                      href={profile.transfermarkt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors break-all"
                    >
                      View Transfermarkt
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}

              </div>
            </section>

            {/* Scout Ratings */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#0b110e] overflow-hidden">

              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    Scout Ratings
                  </h2>

                  <p className="text-xs text-white/35 mt-1">
                    Independent scouting assessment
                  </p>
                </div>

                {scoutRatings && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">
                      {scoutRatings.totalReports}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">

                {scoutRatings ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/[0.05] border border-yellow-500/10 mb-5">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-yellow-400" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-white">
                          {scoutRatings.totalReports} scouting report
                          {scoutRatings.totalReports !== 1 ? 's' : ''}
                        </p>
                        <p className="text-[11px] text-white/35">
                          Ratings averaged across all reports
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {ratingItems.map(
                        ({ key, label, icon: Icon }) => {
                          const rating = scoutRatings[key] || 0
                          const percentage = (rating / 10) * 100

                          return (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-3.5 h-3.5 text-white/35" />
                                  <span className="text-xs font-medium text-white/60">
                                    {label}
                                  </span>
                                </div>

                                <span className="text-xs font-black text-emerald-400">
                                  {rating}/10
                                </span>
                              </div>

                              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        }
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <Star className="w-6 h-6 text-white/15" />
                    </div>

                    <p className="text-sm font-semibold text-white/60 mt-4">
                      No scouting reports yet
                    </p>

                    <p className="text-xs text-white/30 mt-1">
                      Scouts will evaluate this player soon
                    </p>
                  </div>
                )}

              </div>
            </section>

            {/* Achievements */}
            {achievements.length > 0 && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#0b110e] overflow-hidden">

                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    Achievements
                  </h2>
                </div>

                <div className="p-5 space-y-2.5">
                  {achievements.map((achievement, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      </div>

                      <span className="text-sm text-white/65 pt-1">
                        {achievement}
                      </span>
                    </div>
                  ))}
                </div>

              </section>
            )}

            {/* Biography */}
            {profile?.bio && (
              <section className="rounded-2xl border border-white/[0.07] bg-[#0b110e] overflow-hidden">

                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    Biography
                  </h2>
                </div>

                <div className="p-5">
                  <p className="text-sm text-white/55 leading-7">
                    {profile.bio}
                  </p>
                </div>

              </section>
            )}

          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN */}
          {/* ======================================================= */}
          <div className="lg:col-span-2 space-y-5">

            {/* Season Statistics */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#0b110e] overflow-hidden">

              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Season Statistics
                  </h2>

                  <p className="text-xs text-white/35 mt-1">
                    Performance across recorded seasons
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-white/30">
                  <Activity className="w-3.5 h-3.5" />
                  {seasonStats.length} season
                  {seasonStats.length !== 1 ? 's' : ''}
                </div>
              </div>

              {seasonStats.length === 0 ? (
                <div className="text-center py-12 px-5">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white/15" />
                  </div>

                  <p className="text-sm font-semibold text-white/60 mt-4">
                    No season statistics added yet
                  </p>

                  <p className="text-xs text-white/30 mt-1">
                    Go to Edit Profile → Season Stats to add performance data.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                        <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-white/30">
                          Season
                        </th>
                        <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-white/30">
                          Competition
                        </th>
                        <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-white/30">
                          Club
                        </th>
                        <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-white/30">
                          Apps
                        </th>
                        <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-white/30">
                          Goals
                        </th>
                        <th className="px-5 py-3 text-center text-[10px] uppercase tracking-wider font-bold text-white/30">
                          Assists
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {seasonStats.map((stat, idx) => (
                        <tr
                          key={stat.id}
                          className={`hover:bg-white/[0.02] transition ${
                            idx !== seasonStats.length - 1
                              ? 'border-b border-white/[0.05]'
                              : ''
                          }`}
                        >
                          <td className="px-5 py-4 text-sm font-bold text-white">
                            {stat.season}
                          </td>

                          <td className="px-3 py-4 text-center text-xs text-white/50">
                            {stat.competition || '-'}
                          </td>

                          <td className="px-3 py-4 text-center text-xs text-white/50">
                            {stat.club || '-'}
                          </td>

                          <td className="px-3 py-4 text-center text-sm font-semibold text-white/70">
                            {stat.appearances || 0}
                          </td>

                          <td className="px-3 py-4 text-center">
                            <span className="inline-flex min-w-8 justify-center px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold">
                              {stat.goals || 0}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-8 justify-center px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-bold">
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
            <section className="rounded-2xl border border-white/[0.07] bg-[#0b110e] overflow-hidden">

              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-yellow-400" />
                  Career History
                </h2>

                <p className="text-xs text-white/35 mt-1">
                  Previous clubs and competitive experience
                </p>
              </div>

              {careerHistory.length === 0 ? (
                <div className="text-center py-12 px-5">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white/15" />
                  </div>

                  <p className="text-sm font-semibold text-white/60 mt-4">
                    No career history added yet
                  </p>

                  <p className="text-xs text-white/30 mt-1">
                    Go to Edit Profile → Career History to add club history.
                  </p>
                </div>
              ) : (
                <div className="p-5 space-y-3">

                  {careerHistory.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="relative flex gap-4 p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-emerald-500/20 transition"
                    >

                      {/* Timeline */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 font-black">
                          {entry.club_name?.charAt(0) || 'C'}
                        </div>

                        {index !== careerHistory.length - 1 && (
                          <div className="absolute left-1/2 top-12 -translate-x-1/2 w-px h-[calc(100%+12px)] bg-emerald-500/10" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white">
                              {entry.club_name}
                            </h4>

                            <p className="text-xs text-white/40 mt-1">
                              {entry.league || '-'} • {entry.country || '-'}
                            </p>
                          </div>

                          <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] text-[11px] text-white/40">
                            <Calendar className="w-3 h-3" />
                            {entry.start_date
                              ? new Date(entry.start_date).getFullYear()
                              : '?'}{' '}
                            -{' '}
                            {entry.end_date
                              ? new Date(entry.end_date).getFullYear()
                              : 'Present'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-xs text-white/45">
                            {entry.appearances || 0} Apps
                          </span>

                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-xs text-emerald-400">
                            {entry.goals || 0} Goals
                          </span>

                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-xs text-blue-400">
                            {entry.assists || 0} Assists
                          </span>
                        </div>

                      </div>
                    </div>
                  ))}

                </div>
              )}

            </section>

            {/* Media Gallery */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#0b110e] overflow-hidden">

              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-400" />
                    Highlight Gallery
                  </h2>

                  <p className="text-xs text-white/35 mt-1">
                    Match footage, highlights and player media
                  </p>
                </div>

                {otherMedia.length > 0 && (
                  <span className="text-xs text-white/30">
                    {otherMedia.length} item
                    {otherMedia.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {otherMedia.length === 0 ? (
                <div className="text-center py-14 px-5">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Video className="w-7 h-7 text-white/15" />
                  </div>

                  <p className="text-sm font-semibold text-white/60 mt-4">
                    No highlights available
                  </p>

                  <p className="text-xs text-white/30 mt-1">
                    Upload media in your profile page
                  </p>
                </div>
              ) : (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

                  {otherMedia.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-black"
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
                          className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      )}

                      {/* Media overlay */}
                      <div className="absolute inset-x-0 bottom-0 pointer-events-none">
                        <div className="h-20 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>

                      {item.title && (
                        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                          <div className="flex items-center gap-2">
                            {item.type === 'video' && (
                              <span className="w-7 h-7 rounded-lg bg-emerald-500/90 flex items-center justify-center">
                                <Video className="w-3.5 h-3.5 text-black" />
                              </span>
                            )}

                            <span className="text-xs font-semibold text-white truncate">
                              {item.title}
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}

                </div>
              )}

            </section>

          </div>
        </div>

        {/* Footer profile summary */}
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0b110e] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                PlayerFynder Verified Profile
              </p>
              <p className="text-[11px] text-white/30">
                Professional scouting profile and performance data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-white/30">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Profile active
          </div>
        </div>

      </div>
    </div>
  )
}