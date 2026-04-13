'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<'player' | 'agent' | 'scout'>('player')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'player' || roleParam === 'agent' || roleParam === 'scout') {
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
      // Save the selected role to localStorage
      localStorage.setItem('selectedRole', role)
      
      // Create the appropriate profile
      if (role === 'player') {
        const { error: playerError } = await supabase.from('players').insert({
          user_id: data.user.id,
          name: '',
          age: null,
          position: '',
          status: 'pending',
        })
        if (playerError) console.error('Player insert error:', playerError)
      } else if (role === 'agent') {
        const { error: agentError } = await supabase.from('agents').insert({
          user_id: data.user.id,
          name: '',
          agency: '',
          subscription_status: 'inactive',
        })
        if (agentError) console.error('Agent insert error:', agentError)
      } else if (role === 'scout') {
        const { error: scoutError } = await supabase.from('scouts').insert({
          user_id: data.user.id,
          name: '',
          club_name: '',
        })
        if (scoutError) console.error('Scout insert error:', scoutError)
      }

      alert('Account created! Please check your email to confirm.')
      router.push('/login')
    }
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
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">⚽</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            PlayerFynder
          </h1>
          <p className="text-gray-600 mt-2">
            Join as a <span className="font-semibold text-red-600">{role === 'player' ? 'Player' : role === 'agent' ? 'Agent' : 'Scout'}</span>
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <Link
            href="/signup?role=player"
            className={`flex-1 text-center py-2 rounded-lg border-2 transition ${
              role === 'player'
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-600 hover:border-red-400'
            }`}
          >
            ⚽ Player
          </Link>
          <Link
            href="/signup?role=agent"
            className={`flex-1 text-center py-2 rounded-lg border-2 transition ${
              role === 'agent'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:border-blue-400'
            }`}
          >
            🤝 Agent
          </Link>
          <Link
            href="/signup?role=scout"
            className={`flex-1 text-center py-2 rounded-lg border-2 transition ${
              role === 'scout'
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-gray-300 text-gray-600 hover:border-green-400'
            }`}
          >
            🎯 Scout
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : `Sign Up as ${role === 'player' ? 'Player' : role === 'agent' ? 'Agent' : 'Scout'}`}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-red-600 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}