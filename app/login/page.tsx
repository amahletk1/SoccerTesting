'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check if already logged in as scout
  useEffect(() => {
    const checkAlreadyLoggedIn = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: scout } = await supabase
          .from('scouts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        if (scout) {
          console.log('Already logged in as scout, redirecting')
          window.location.replace('/dashboard/scout')
        }
      }
    }
    checkAlreadyLoggedIn()
  }, [])

  useEffect(() => {
    const confirmed = searchParams.get('confirmed')
    if (confirmed === 'true') {
      setMessage('Email confirmed! Please log in to complete your profile.')
    }
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('User not found')
      setLoading(false)
      return
    }

    console.log('User ID:', user.id)

    // Check if user is a scout
    const { data: scout } = await supabase
      .from('scouts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (scout) {
      console.log('SCOUT FOUND! Redirecting to /dashboard/scout')
      // Use replace to prevent back button issues
      window.location.replace('/dashboard/scout')
      return  // Important: stop execution
    }

    // Check other roles
    const { data: player } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (player) {
      router.push('/dashboard')
      setLoading(false)
      return
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (agent) {
      router.push('/dashboard')
      setLoading(false)
      return
    }

    router.push('/complete-profile')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-red-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>

        <div className="text-center mb-8">
          <img 
            src="/player-fynder-logo.png" 
            alt="PlayerFynder Logo" 
            className="w-20 h-20 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            PlayerFynder
          </h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
            <Link 
              href="/forgot-password" 
              className="text-sm text-red-600 hover:underline block text-right mt-1"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup?role=player" className="text-red-600 hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}