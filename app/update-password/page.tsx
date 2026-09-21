'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  KeyRound,
} from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has a valid reset session
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/forgot-password')
      }
    }

    checkSession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(
        'Password updated successfully! Redirecting to login...'
      )

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050806] px-4 py-10 text-white sm:px-6">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Emerald glow */}
        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.09] blur-[120px]" />

        {/* Gold glow */}
        <div className="absolute -right-48 -bottom-48 h-[550px] w-[550px] rounded-full bg-amber-400/[0.06] blur-[120px]" />

        {/* Center glow */}
        <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.035] blur-[120px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,8,6,0.55)_75%,rgba(5,8,6,0.9)_100%)]" />

      </div>

      <div className="relative w-full max-w-md">

        {/* =====================================================
            BACK
        ===================================================== */}

        <Link
          href="/login"
          className="group mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-emerald-400"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition-all group-hover:border-emerald-400/20 group-hover:bg-emerald-400/[0.06]">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </span>

          Back to Login
        </Link>

        {/* =====================================================
            MAIN CARD
        ===================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b110d]/95 shadow-[0_30px_100px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl">

          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-300" />

          {/* Card glow */}
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-400/[0.05] blur-3xl" />

          <div className="relative p-7 sm:p-9">

            {/* =================================================
                BRAND / ICON
            ================================================= */}

            <div className="mb-8 flex flex-col items-center">

              <div className="relative mb-5">

                <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl" />

                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] shadow-lg shadow-emerald-500/10">

                  <KeyRound className="h-7 w-7 text-emerald-400" />

                </div>

              </div>

              <div className="mb-2 flex items-center gap-2">

                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Account Security
                </p>

              </div>

              <h1 className="text-center text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                Create New Password
              </h1>

              <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-white/35">
                Choose a strong password to keep your PlayerFynder
                account secure.
              </p>

            </div>

            {/* =================================================
                SUCCESS
            ================================================= */}

            {message && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.07] p-4 text-sm text-emerald-300">

                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
                  <CheckCircle className="h-4 w-4" />
                </div>

                <span className="leading-5">
                  {message}
                </span>

              </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

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

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleUpdatePassword}
              className="space-y-5"
            >

              {/* New password */}
              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-white/55"
                >
                  New Password
                </label>

                <div className="group relative">

                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition-colors group-focus-within:text-emerald-400" />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-white/20 hover:border-white/[0.14] focus:border-emerald-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-400/[0.07]"
                    placeholder="Enter your new password"
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

                <p className="mt-2 text-xs text-white/25">
                  Minimum 6 characters
                </p>

              </div>

              {/* Confirm password */}
              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-white/55"
                >
                  Confirm Password
                </label>

                <div className="group relative">

                  <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition-colors group-focus-within:text-emerald-400" />

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none transition-all placeholder:text-white/20 hover:border-white/[0.14] focus:border-emerald-400/50 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-400/[0.07]"
                    placeholder="Confirm your new password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                </div>

              </div>

              {/* Password match indicator */}
              {password && confirmPassword && (
                <div
                  className={`flex items-center gap-2 text-xs ${
                    password === confirmPassword
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" />
                      Passwords do not match
                    </>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative mt-2 flex h-13 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-[#041007] shadow-lg shadow-emerald-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >

                <span className="relative z-10 flex items-center gap-2">

                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-[#041007]" />
                      Updating...
                    </>
                  ) : (
                    <>
                      Update Password
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}

                </span>

                {!loading && (
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                )}

              </button>

            </form>

            {/* =================================================
                SECURITY FOOTER
            ================================================= */}

            <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/[0.07] pt-6 text-xs text-white/25">

              <ShieldCheck className="h-4 w-4 text-emerald-400/70" />

              <span>
                Your password is securely managed by PlayerFynder
              </span>

            </div>

          </div>
        </section>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-white/20">
          PlayerFynder · Football Talent Discovery Platform
        </p>

      </div>
    </main>
  )
}