'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Target,
  FileText,
  Star,
  Clock,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  Calendar,
  BarChart3,
  Eye,
  Zap,
  Trophy,
  UploadCloud,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react'

export default function ScoutDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myReports, setMyReports] = useState<any[]>([])
  const [playersCount, setPlayersCount] = useState(0)
  const [scoutId, setScoutId] = useState<string>('')

  // Qualifications state
  const [qualifications, setQualifications] = useState('')
  const [certificateUrl, setCertificateUrl] = useState('')
  const [uploadingCert, setUploadingCert] = useState(false)

  const [stats, setStats] = useState({
    playersScouted: 0,
    reportsWritten: 0,
    averageRating: 0,
    thisMonthReports: 0,
    topRating: 0,
    topPlayer: '',
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        // Get scout profile
        const { data: scout, error: scoutError } = await supabase
          .from('scouts')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (scoutError || !scout) {
          router.push('/dashboard')
          return
        }

        setProfile(scout)
        setScoutId(scout.id)
        setQualifications(scout.qualifications || '')
        setCertificateUrl(scout.certificate_url || '')

        // Get scout's reports
        const { data: reportsData } = await supabase
          .from('scouting_reports')
          .select(`
            *,
            player:players(id, name, position, age, nationality)
          `)
          .eq('scout_id', scout.id)
          .order('created_at', { ascending: false })

        if (reportsData) {
          setMyReports(reportsData)

          const thisMonth = new Date().getMonth()

          const thisMonthReports = reportsData.filter(
            (r) =>
              r.created_at &&
              new Date(r.created_at).getMonth() === thisMonth
          )

          const avgRating =
            reportsData.length > 0
              ? reportsData.reduce(
                  (acc, r) => acc + (r.overall_rating || 0),
                  0
                ) / reportsData.length
              : 0

          const topRated =
            reportsData.length > 0
              ? reportsData.reduce(
                  (max, r) =>
                    r.overall_rating > (max.overall_rating || 0)
                      ? r
                      : max,
                  {}
                )
              : { overall_rating: 0, player: null }

          setStats({
            playersScouted: reportsData.length,
            reportsWritten: reportsData.length,
            averageRating: Math.round(avgRating * 10) / 10,
            thisMonthReports: thisMonthReports.length,
            topRating: topRated.overall_rating || 0,
            topPlayer: topRated.player?.name || '',
          })
        }

        // Get total players count for scouting target
        const { count: playersTotal } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')

        setPlayersCount(playersTotal || 0)
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  // Handle certificate upload
  const handleCertificateUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file || !scoutId) return

    setUploadingCert(true)

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file')
      setUploadingCert(false)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      setUploadingCert(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${scoutId}/certificate-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('scout-certificates')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploadingCert(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('scout-certificates')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('scouts')
      .update({ certificate_url: publicUrl })
      .eq('id', scoutId)

    if (updateError) {
      alert('Error saving certificate: ' + updateError.message)
    } else {
      setCertificateUrl(publicUrl)
      alert('Certificate uploaded successfully!')
    }

    setUploadingCert(false)
  }

  // Save qualifications on blur
  const saveQualifications = async () => {
    const { error } = await supabase
      .from('scouts')
      .update({ qualifications })
      .eq('id', scoutId)

    if (error) {
      console.error('Error saving qualifications:', error)
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
            Loading scout dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-180px] top-[-180px] h-[520px] w-[520px] rounded-full bg-emerald-500/[0.055] blur-[150px]" />
        <div className="absolute right-[-180px] top-[20%] h-[500px] w-[500px] rounded-full bg-amber-400/[0.025] blur-[150px]" />
        <div className="absolute bottom-[-200px] left-[35%] h-[450px] w-[450px] rounded-full bg-emerald-500/[0.025] blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-5 lg:px-6 lg:py-7">
        {/* =========================================================
            HERO / WELCOME
        ========================================================= */}
        <section className="relative mb-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(16,185,129,.16),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(245,158,11,.07),transparent_30%)]" />

          <div className="absolute right-[-80px] top-[-100px] h-72 w-72 rounded-full border border-emerald-500/[0.05]" />
          <div className="absolute right-[-30px] top-[-50px] h-52 w-52 rounded-full border border-emerald-500/[0.05]" />

          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-400/20 sm:h-20 sm:w-20">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-400/5 blur-xl" />
                  <Target className="relative h-8 w-8 text-emerald-400 sm:h-10 sm:w-10" />
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                      Scout Command Centre
                    </span>
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                      Active
                    </span>
                  </div>

                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Welcome back,{' '}
                    {profile?.name?.split(' ')[0] || 'Scout'}
                  </h1>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Discover talent. Build reports. Identify the next
                    generation.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-400">
                      {profile?.club_name || 'Independent Scout'}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-500">
                      <Calendar className="h-3 w-3 text-emerald-400" />
                      Member since{' '}
                      {profile?.created_at
                        ? new Date(profile.created_at).getFullYear()
                        : '2024'}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/scouting"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-[#061009] transition hover:bg-emerald-400"
              >
                <Target className="h-4 w-4" />
                Find Players
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            QUALIFICATIONS
        ========================================================= */}
        <section className="mb-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-xl">
          <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <Award className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-white">
                  Scout Credentials
                </h2>
                <p className="text-[11px] text-slate-600">
                  Keep your professional qualifications up to date
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                Qualifications
              </label>

              <textarea
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                onBlur={saveQualifications}
                placeholder="Enter your qualifications (e.g., UEFA B License, Scouting Diploma)..."
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#080d0a] px-4 py-3 text-sm text-slate-300 outline-none transition placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10"
                rows={3}
              />

              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-700">
                <Shield className="h-3 w-3" />
                Qualifications are visible to clubs and agents
              </div>
            </div>

            <div className="lg:min-w-[330px]">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                Certificate
              </label>

              <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#080d0a] p-4">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertificateUpload}
                  disabled={uploadingCert}
                  className="hidden"
                  id="certificate-upload"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label
                    htmlFor="certificate-upload"
                    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/[0.05] hover:text-emerald-400 ${
                      uploadingCert ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <UploadCloud className="h-4 w-4" />
                    {uploadingCert
                      ? 'Uploading...'
                      : 'Upload Certificate'}
                  </label>

                  {certificateUrl && (
                    <a
                      href={certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                    >
                      <FileText className="h-4 w-4" />
                      View Certificate
                    </a>
                  )}
                </div>

                <p className="mt-3 text-[10px] text-slate-700">
                  PDF, JPG, or PNG · Maximum 10MB
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            STATS
        ========================================================= */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Players */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] p-4 shadow-lg transition hover:border-emerald-500/20">
            <div className="absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full bg-emerald-500/[0.04] blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>

                <TrendingUp className="h-3.5 w-3.5 text-emerald-500/40" />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Players Scouted
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                {stats.playersScouted}
              </p>
            </div>
          </div>

          {/* Reports */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] p-4 shadow-lg transition hover:border-sky-500/20">
            <div className="absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full bg-sky-500/[0.04] blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                  <FileText className="h-4 w-4 text-sky-400" />
                </div>

                <span className="text-[10px] font-bold text-sky-400">
                  +{stats.thisMonthReports}
                </span>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Reports Written
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                {stats.reportsWritten}
              </p>

              <p className="mt-1 text-[10px] text-slate-700">
                this month
              </p>
            </div>
          </div>

          {/* Average */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] p-4 shadow-lg transition hover:border-amber-500/20">
            <div className="absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full bg-amber-500/[0.04] blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                </div>

                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Average Rating
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                {stats.averageRating}
                <span className="ml-1 text-xs font-medium text-slate-600">
                  /10
                </span>
              </p>
            </div>
          </div>

          {/* Available */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] p-4 shadow-lg transition hover:border-purple-500/20">
            <div className="absolute right-[-20px] top-[-20px] h-24 w-24 rounded-full bg-purple-500/[0.04] blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
                  <Users className="h-4 w-4 text-purple-400" />
                </div>

                <Activity className="h-3.5 w-3.5 text-purple-500/40" />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Available Players
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                {playersCount}
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            TOP DISCOVERY
        ========================================================= */}
        {stats.topPlayer && stats.topRating > 0 && (
          <section className="relative mb-5 overflow-hidden rounded-3xl border border-amber-400/10 bg-[#0b100d] shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,rgba(245,158,11,.08),transparent_40%)]" />

            <div className="relative p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10">
                  <Trophy className="h-4 w-4 text-amber-400" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
                    Top Discovery
                  </p>
                  <p className="text-xs text-slate-600">
                    Your highest-rated player
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {stats.topPlayer}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Highest overall rating across your reports
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
                    <span className="text-2xl font-black text-amber-400">
                      {stats.topRating}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Overall
                    </p>
                    <p className="text-sm font-bold text-slate-400">
                      /10 rating
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            RECENT REPORTS
        ========================================================= */}
        <section className="mb-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-xl">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <FileText className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-white">
                  My Recent Reports
                </h2>
                <p className="text-[11px] text-slate-600">
                  Latest player evaluations
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/scouting/reports"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              View all ({stats.reportsWritten})
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {myReports.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <FileText className="h-7 w-7 text-slate-700" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-400">
                No reports written yet
              </p>

              <Link
                href="/dashboard/scouting"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Start scouting
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {myReports.slice(0, 5).map((report) => {
                const rating = Number(report.overall_rating || 0)

                return (
                  <div
                    key={report.id}
                    className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/[0.07] ring-1 ring-emerald-500/10">
                        <span className="text-xs font-black text-emerald-400">
                          {report.player?.name
                            ?.charAt(0)
                            ?.toUpperCase() || 'P'}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {report.player?.name || 'Unknown Player'}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
                          <span>
                            {report.player?.position || 'Position N/A'}
                          </span>

                          <span>•</span>

                          <span>
                            Age {report.player?.age || '?'}
                          </span>

                          <span>•</span>

                          <span>
                            {report.player?.nationality || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="flex items-center gap-1.5">
                        <Star
                          className={`h-4 w-4 ${
                            rating >= 8
                              ? 'fill-emerald-400 text-emerald-400'
                              : rating >= 6
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-600 text-slate-600'
                          }`}
                        />

                        <span className="text-sm font-black text-white">
                          {report.overall_rating || '?'}/10
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/players/${report.player_id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[10px] font-bold text-slate-400 transition hover:border-emerald-500/20 hover:bg-emerald-500/[0.06] hover:text-emerald-400"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* =========================================================
            QUICK ACTIONS
        ========================================================= */}
        <section className="mb-5 grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard/scouting"
            className="group relative overflow-hidden rounded-3xl border border-emerald-500/10 bg-[#0b100d] p-5 shadow-xl transition hover:-translate-y-0.5 hover:border-emerald-500/25 sm:p-6"
          >
            <div className="absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-emerald-500/[0.07] blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Target className="h-5 w-5 text-emerald-400" />
                </div>

                <h3 className="text-lg font-black text-white">
                  Find Players
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Discover new football talent
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.02] transition group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-emerald-400" />
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/scouting/reports"
            className="group relative overflow-hidden rounded-3xl border border-amber-500/10 bg-[#0b100d] p-5 shadow-xl transition hover:-translate-y-0.5 hover:border-amber-500/25 sm:p-6"
          >
            <div className="absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-amber-500/[0.05] blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <FileText className="h-5 w-5 text-amber-400" />
                </div>

                <h3 className="text-lg font-black text-white">
                  My Reports
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Manage your player evaluations
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.02] transition group-hover:border-amber-500/30 group-hover:bg-amber-500/10">
                <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-amber-400" />
              </div>
            </div>
          </Link>
        </section>

        {/* =========================================================
            SCOUT TIPS
        ========================================================= */}
        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b100d] shadow-xl">
          <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  Scout Success Tips
                </h3>
                <p className="text-[11px] text-slate-600">
                  Build stronger, more consistent evaluations
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-white/[0.04] md:grid-cols-3">
            <div className="bg-[#0b100d] p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>

              <p className="text-xs font-bold text-white">
                Watch 3+ matches
              </p>

              <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
                Build a reliable view of a player's consistency before
                rating them.
              </p>
            </div>

            <div className="bg-[#0b100d] p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
              </div>

              <p className="text-xs font-bold text-white">
                Use professional benchmarks
              </p>

              <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
                Compare performances against realistic standards for
                the player's level.
              </p>
            </div>

            <div className="bg-[#0b100d] p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <FileText className="h-4 w-4 text-emerald-400" />
              </div>

              <p className="text-xs font-bold text-white">
                Document both sides
              </p>

              <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
                Record clear strengths and weaknesses for balanced
                scouting decisions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}