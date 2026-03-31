'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CompleteProfilePage() {
  const [role, setRole] = useState<'player' | 'agent'>('player')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [position, setPosition] = useState('')
  const [nationality, setNationality] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [agency, setAgency] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyHasProfile, setAlreadyHasProfile] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkExistingProfile()
  }, [])

  const checkExistingProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin - if yes, redirect to dashboard
    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (adminData) {
      router.push('/dashboard')
      return
    }

    // Check if user already has a player profile
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (player) {
      setAlreadyHasProfile(true)
      setTimeout(() => router.push('/dashboard'), 2000)
      return
    }

    // Check if user already has an agent profile
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (agent) {
      setAlreadyHasProfile(true)
      setTimeout(() => router.push('/dashboard'), 2000)
      return
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Double-check if user became admin after creation
    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (adminData) {
      router.push('/dashboard')
      return
    }

    if (role === 'player') {
      const { error } = await supabase.from('players').insert({
        user_id: user.id,
        name: name,
        age: parseInt(age),
        position: position,
        nationality: nationality,
        height_cm: height ? parseInt(height) : null,
        weight_kg: weight ? parseInt(weight) : null,
        status: 'pending'
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        alert('Player profile submitted! Waiting for admin approval.')
        router.push('/dashboard')
      }
    } else {
      const { error } = await supabase.from('agents').insert({
        user_id: user.id,
        name: name,
        agency: agency || null,
        subscription_status: 'inactive'
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        alert('Agent profile created!')
        router.push('/dashboard')
      }
    }
  }

  if (alreadyHasProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">You already have a profile. Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-black flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Complete Your Profile</h1>
        <p className="text-gray-600 text-center mb-6">Tell us about yourself</p>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">I am a:</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('player')}
                className={`flex-1 py-2 rounded-lg border-2 transition ${
                  role === 'player' 
                    ? 'border-green-600 bg-green-50 text-green-700' 
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                ⚽ Player
              </button>
              <button
                type="button"
                onClick={() => setRole('agent')}
                className={`flex-1 py-2 rounded-lg border-2 transition ${
                  role === 'agent' 
                    ? 'border-green-600 bg-green-50 text-green-700' 
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                🤝 Agent
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          {role === 'player' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Age *</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Your age"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Position *</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Position</option>
                  <option value="Forward">Forward</option>
                  <option value="Midfielder">Midfielder</option>
                  <option value="Defender">Defender</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Your country"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="kg"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Agency Name (Optional)</label>
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Your agency name"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}