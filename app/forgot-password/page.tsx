'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  KeyRound,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
      setMessage('Password reset link sent! Check your email.')
    }

    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060a08] px-4 py-10 sm:px-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-amber-500/[0.045] blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-emerald-400/[0.025] blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link
          href="/login"
          className="group mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Login
        </Link>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b110e]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Premium accent */}
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-300 to-amber-400" />

          <div className="p-7 sm:p-9">
            {/* Brand */}
            <div className="mb-8 text-center">
              <div className="relative mx-auto mb-6 inline-flex">
                <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 blur-2xl" />

                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-[#101813] shadow-xl">
                  <img
                    src="/player-fynder-logo.png"
                    alt="PlayerFynder Logo"
                    className="h-14 w-14 object-contain"
                  />
                </div>
              </div>

              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-emerald-400/40" />

                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">
                  Account Recovery
                </span>

                <span className="h-px w-8 bg-amber-400/40" />
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Forgot{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300 bg-clip-text text-transparent">
                  Password?
                </span>
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
                No worries. Enter your email address and we'll send you
                a secure link to reset your password.
              </p>
            </div>

            {/* Success message */}
            {message && (
              <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-emerald-300">
                      Reset link sent
                    </p>

                    <p className="mt-1 text-sm leading-5 text-emerald-400/70">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/[0.07] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-300">
                      Unable to send reset link
                    </p>

                    <p className="mt-1 text-sm leading-5 text-red-400/70">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!sent ? (
              <form
                onSubmit={handleResetPassword}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                  >
                    Email Address
                  </label>

                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-emerald-400" />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.09] bg-white/[0.035] py-3.5 pl-12 pr-4 text-white outline-none placeholder:text-slate-600 transition-all focus:border-emerald-400/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-emerald-400/[0.06]"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3.5 font-bold text-[#06100a] shadow-lg shadow-emerald-500/15 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-emerald-300 hover:shadow-xl hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#06100a]/20 border-t-[#06100a]" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            ) : (
              /* Success state */
              <div className="text-center">
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 blur-xl" />

                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.08]">
                    <Mail className="h-7 w-7 text-emerald-400" />
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white">
                  Check your inbox
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  We've sent a password reset link to
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-emerald-300">
                  {email}
                </p>

                <Link
                  href="/login"
                  className="group mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/20 hover:bg-white/[0.08]"
                >
                  Return to Login
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}

            {/* Security note */}
            <div className="mt-7 border-t border-white/[0.06] pt-6">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Your account security is important to us</span>
              </div>
            </div>

            {/* Login */}
            <div className="mt-5 text-center">
              <p className="text-sm text-slate-500">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-slate-600">
            <KeyRound className="h-3.5 w-3.5 text-amber-400/70" />
            <span>Secure account recovery</span>
          </div>

          <p className="mt-2 text-xs text-slate-700">
            © PlayerFynder. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}