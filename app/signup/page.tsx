'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  Handshake,
  Target,
  CheckCircle,
} from 'lucide-react'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<'player' | 'agent' | 'scout'>('player')
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const roleParam = searchParams.get('role')

    if (
      roleParam === 'player' ||
      roleParam === 'agent' ||
      roleParam === 'scout'
    ) {
      setRole(roleParam)
    }
  }, [searchParams])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      localStorage.setItem('selectedRole', role)

      if (role === 'player') {
        await supabase.from('players').insert({
          user_id: data.user.id,
          name: '',
          age: null,
          position: '',
          status: 'pending',
        })
      } else if (role === 'agent') {
        await supabase.from('agents').insert({
          user_id: data.user.id,
          name: '',
          agency: '',
          subscription_status: 'inactive',
        })
      } else if (role === 'scout') {
        await supabase.from('scouts').insert({
          user_id: data.user.id,
          name: '',
          club_name: '',
        })
      }

      alert('Account created! Please check your email to confirm.')
      router.push(`/complete-profile?role=${role}`)
    }

    setLoading(false)
  }

  const roleLabel =
    role === 'player'
      ? 'Player'
      : role === 'agent'
        ? 'Agent'
        : 'Scout'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050806] text-white">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.09] blur-[120px]" />

        <div className="absolute -right-48 top-[-100px] h-[550px] w-[550px] rounded-full bg-amber-400/[0.06] blur-[120px]" />

        <div className="absolute bottom-[-300px] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-600/[0.05] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,8,6,0.55)_75%,rgba(5,8,6,0.9)_100%)]" />

      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">

        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_480px] lg:gap-20">

          {/* =================================================
              LEFT HERO
          ================================================= */}

          <div className="hidden lg:block">

            <div className="max-w-2xl">

              {/* Brand */}
              <div className="mb-10 flex items-center gap-4">

                <div className="relative">

                  <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl" />

                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl">
                    <img
                      src="/player-fynder-logo.png"
                      alt="PlayerFynder Logo"
                      className="h-12 w-12 object-contain"
                    />
                  </div>

                </div>

                <div>
                  <p className="text-2xl font-black tracking-tight text-white">
                    Player<span className="text-emerald-400">Fynder</span>
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                    Football Scouting Platform
                  </p>
                </div>

              </div>

              {/* Eyebrow */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-2">

                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />

                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Your next opportunity starts here
                </span>

              </div>

              {/* Heading */}
              <h2 className="text-5xl font-black leading-[1.03] tracking-[-0.04em] text-white xl:text-6xl">

                Put your football

                <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 bg-clip-text text-transparent">
                  journey in motion.
                </span>

              </h2>

              <p className="mt-7 max-w-xl text-base leading-7 text-white/45">
                Create your PlayerFynder account and become part of a
                football network connecting players, scouts and agents.
              </p>

              {/* Benefits */}
              <div className="mt-10 space-y-3">

                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                    <Target className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Build your football profile
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Showcase your experience, skills and potential.
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10">
                    <Trophy className="h-5 w-5 text-amber-300" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Get discovered
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Put your talent in front of the right people.
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                    <Handshake className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      Connect with football professionals
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Players, scouts and agents in one ecosystem.
                    </p>
                  </div>

                </div>

              </div>

              {/* Trust */}
              <div className="mt-8 flex items-center gap-2 text-xs text-white/25">
                <ShieldCheck className="h-4 w-4 text-emerald-400/70" />
                Secure account creation
              </div>

            </div>

          </div>

          {/* =================================================
              SIGNUP CARD
          ================================================= */}

          <div className="w-full max-w-md justify-self-center lg:max-w-none">

            {/* Back */}
            <Link
              href="/"
              className="group mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-emerald-400"
            >

              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition-all group-hover:border-emerald-400/20 group-hover:bg-emerald-400/[0.06]">

                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />

              </span>

              Back

            </Link>

            <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b110d]/95 shadow-[0_30px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">

              {/* Accent */}
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-300" />

              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-400/[0.05] blur-3xl" />

              <div className="relative p-7 sm:p-9">

                {/* Mobile Logo */}
                <div className="mb-7 flex flex-col items-center lg:hidden">

                  <div className="relative mb-4">

                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />

                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                      <img
                        src="/player-fynder-logo.png"
                        alt="PlayerFynder Logo"
                        className="h-14 w-14 object-contain"
                      />
                    </div>

                  </div>

                  <p className="text-xl font-black text-white">
                    Player<span className="text-emerald-400">Fynder</span>
                  </p>

                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Football Scouting Platform
                  </p>

                </div>

                {/* Header */}
                <div className="mb-7 text-center">

                  <div className="mb-3 flex items-center gap-2">

                    <div className="h-px flex-1 bg-white/[0.07]" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                      Create account
                    </span>

                    <div className="h-px flex-1 bg-white/[0.07]" />

                  </div>

                  <h1 className="text-3xl font-black tracking-[-0.03em] text-white">
                    Join PlayerFynder
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-white/35">
                    Start your football journey as a{' '}
                    <span className="font-semibold text-emerald-400">
                      {roleLabel}
                    </span>
                  </p>

                </div>

                {/* Role selector */}
                <div className="mb-6">

                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-white/50">
                    Choose your role
                  </p>

                  <div className="grid grid-cols-3 gap-2">

                    {/* Player */}
                    <Link
                      href="/signup?role=player"
                      className={`group rounded-2xl border p-3 text-center transition-all ${
                        role === 'player'
                          ? 'border-emerald-400/40 bg-emerald-400/[0.08] shadow-lg shadow-emerald-500/[0.05]'
                          : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]'
                      }`}
                    >

                      <div
                        className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${
                          role === 'player'
                            ? 'bg-emerald-400/15'
                            : 'bg-white/[0.05]'
                        }`}
                      >
                        <Trophy
                          className={`h-4 w-4 ${
                            role === 'player'
                              ? 'text-emerald-400'
                              : 'text-white/35'
                          }`}
                        />
                      </div>

                      <p
                        className={`text-xs font-bold ${
                          role === 'player'
                            ? 'text-emerald-300'
                            : 'text-white/45'
                        }`}
                      >
                        Player
                      </p>

                    </Link>

                    {/* Agent */}
                    <Link
                      href="/signup?role=agent"
                      className={`group rounded-2xl border p-3 text-center transition-all ${
                        role === 'agent'
                          ? 'border-amber-300/40 bg-amber-300/[0.07] shadow-lg shadow-amber-500/[0.04]'
                          : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]'
                      }`}
                    >

                      <div
                        className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${
                          role === 'agent'
                            ? 'bg-amber-300/10'
                            : 'bg-white/[0.05]'
                        }`}
                      >
                        <Handshake
                          className={`h-4 w-4 ${
                            role === 'agent'
                              ? 'text-amber-300'
                              : 'text-white/35'
                          }`}
                        />
                      </div>

                      <p
                        className={`text-xs font-bold ${
                          role === 'agent'
                            ? 'text-amber-200'
                            : 'text-white/45'
                        }`}
                      >
                        Agent
                      </p>

                    </Link>

                    {/* Scout */}
                    <Link
                      href="/signup?role=scout"
                      className={`group rounded-2xl border p-3 text-center transition-all ${
                        role === 'scout'
                          ? 'border-emerald-400/40 bg-emerald-400/[0.08] shadow-lg shadow-emerald-500/[0.05]'
                          : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]'
                      }`}
                    >

                      <div
                        className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${
                          role === 'scout'
                            ? 'bg-emerald-400/15'
                            : 'bg-white/[0.05]'
                        }`}
                      >
                        <Target
                          className={`h-4 w-4 ${
                            role === 'scout'
                              ? 'text-emerald-400'
                              : 'text-white/35'
                          }`}
                        />
                      </div>

                      <p
                        className={`text-xs font-bold ${
                          role === 'scout'
                            ? 'text-emerald-300'
                            : 'text-white/45'
                        }`}
                      >
                        Scout
                      </p>

                    </Link>

                  </div>

                </div>

                {/* Error */}
                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-400/[0.07] p-4 text-sm text-red-300">

                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-400/10">
                      <AlertCircle className="h-4 w-4" />
                    </div>

                    <span className="leading-5">
                      {error}
                    </span>

                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleSignUp}
                  className="space-y-5"
                >

                  {/* Email */}
                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-white/55"
                    >
                      Email address
                    </label>

                    <div className="group relative">

                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition-colors group-focus-within:text-emerald-400" />

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/20 hover:border-white/[0.14] focus:border-emerald-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-400/[0.07]"
                        placeholder="your@email.com"
                        required
                      />

                    </div>

                  </div>

                  {/* Password */}
                  <div>

                    <label
                      htmlFor="password"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-white/55"
                    >
                      Password
                    </label>

                    <div className="group relative">

                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition-colors group-focus-within:text-emerald-400" />

                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-white/20 hover:border-white/[0.14] focus:border-emerald-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-400/[0.07]"
                        placeholder="Create a password"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex h-13 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-[#041007] shadow-lg shadow-emerald-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >

                    <span className="relative z-10 flex items-center gap-2">

                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-[#041007]" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Sign Up as {roleLabel}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}

                    </span>

                    {!loading && (
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    )}

                  </button>

                </form>

                {/* Account confirmation note */}
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">

                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/70" />

                  <p className="text-[11px] leading-5 text-white/30">
                    After creating your account, check your email to
                    confirm your address before completing your profile.
                  </p>

                </div>

                {/* Sign in */}
                <div className="mt-7 border-t border-white/[0.07] pt-6 text-center">

                  <p className="text-sm text-white/35">
                    Already have an account?{' '}

                    <Link
                      href="/login"
                      className="font-bold text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>

                </div>

                {/* Security */}
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/25">

                  <ShieldCheck className="h-4 w-4 text-emerald-400/70" />

                  <span>
                    Secure account creation
                  </span>

                </div>

              </div>
            </div>

            {/* Footer */}
            <p className="mt-5 text-center text-xs text-white/20">
              © PlayerFynder. All rights reserved.
            </p>

          </div>

        </div>
      </div>
    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050806]">

          <div className="flex flex-col items-center gap-5">

            <div className="relative">

              <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl" />

              <img
                src="/player-fynder-logo.png"
                alt="PlayerFynder"
                className="relative h-16 w-16 animate-pulse object-contain"
              />

            </div>

            <div className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-400" />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
              PlayerFynder
            </p>

          </div>

        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}