'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CompleteProfilePage() {
  const [role, setRole] = useState<'player' | 'agent' | 'scout'>('player')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [position, setPosition] = useState('')
  const [nationality, setNationality] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [agency, setAgency] = useState('')
  const [clubName, setClubName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alreadyHasProfile, setAlreadyHasProfile] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const storedRole = localStorage.getItem('selectedRole')
    if (storedRole === 'player' || storedRole === 'agent' || storedRole === 'scout') {
      setRole(storedRole)
      localStorage.removeItem('selectedRole')
    }
    
    checkExistingProfile()
  }, [])

  const checkExistingProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (adminData) {
      router.push('/dashboard')
      return
    }

    // Check existing profiles
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

    const { data: scout } = await supabase
      .from('scouts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (scout) {
      setAlreadyHasProfile(true)
      setTimeout(() => router.push('/dashboard/scout'), 2000)
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

    if (role === 'player') {
      const { error } = await supabase
        .from('players')
        .update({
          name: name,
          age: parseInt(age),
          position: position,
          nationality: nationality,
          height_cm: height ? parseInt(height) : null,
          weight_kg: weight ? parseInt(weight) : null,
          status: 'pending'
        })
        .eq('user_id', user.id)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        alert('Player profile submitted! Waiting for admin approval.')
        router.push('/dashboard')
      }
    } else if (role === 'agent') {
      const { error } = await supabase
        .from('agents')
        .update({
          name: name,
          agency: agency || null,
        })
        .eq('user_id', user.id)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        alert('Agent profile created!')
        router.push('/dashboard')
      }
    } else if (role === 'scout') {
      const { error } = await supabase
        .from('scouts')
        .update({
          name: name,
          club_name: clubName || null,
        })
        .eq('user_id', user.id)

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        alert('Scout profile created! You can now scout players.')
        router.push('/dashboard/scout')
      }
    }
    setLoading(false)
  }

  if (alreadyHasProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">You already have a profile. Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">Complete Your Profile</h1>
          <p className="text-gray-600 text-center mt-2">Tell us about yourself</p>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">I am a:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole('player')}
                className={`flex-1 py-2 rounded-lg border-2 transition ${
                  role === 'player' 
                    ? 'border-red-600 bg-red-50 text-red-700' 
                    : 'border-gray-300 text-gray-600 hover:border-red-400'
                }`}
              >
                ⚽ Player
              </button>
              <button
                type="button"
                onClick={() => setRole('agent')}
                className={`flex-1 py-2 rounded-lg border-2 transition ${
                  role === 'agent' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >
                🤝 Agent
              </button>
              <button
                type="button"
                onClick={() => setRole('scout')}
                className={`flex-1 py-2 rounded-lg border-2 transition ${
                  role === 'scout' 
                    ? 'border-green-600 bg-green-50 text-green-700' 
                    : 'border-gray-300 text-gray-600 hover:border-green-400'
                }`}
              >
                🎯 Scout
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Your age"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Position *</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="kg"
                  />
                </div>
              </div>
            </>
          ) : role === 'agent' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Agency Name (Optional)</label>
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your agency name"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Club/Organization Name (Optional)</label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Manchester United, Independent Scout"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}