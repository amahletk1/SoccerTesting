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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const storedRole = localStorage.getItem('selectedRole')
    if (storedRole === 'player' || storedRole === 'agent' || storedRole === 'scout') {
      setRole(storedRole)
      localStorage.removeItem('selectedRole')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('User not found. Please login again.')
      router.push('/login')
      return
    }

    // ========== PLAYER REGISTRATION ==========
    if (role === 'player') {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let result
      if (existingPlayer) {
        result = await supabase
          .from('players')
          .update({
            name: name,
            age: parseInt(age) || null,
            position: position,
            nationality: nationality || null,
            height_cm: height ? parseInt(height) : null,
            weight_kg: weight ? parseInt(weight) : null,
            email: user.email,
            status: 'pending'
          })
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('players')
          .insert([{
            user_id: user.id,
            email: user.email,
            name: name,
            age: parseInt(age) || null,
            position: position,
            nationality: nationality || null,
            height_cm: height ? parseInt(height) : null,
            weight_kg: weight ? parseInt(weight) : null,
            status: 'pending',
            created_at: new Date().toISOString()
          }])
      }

      if (result.error) {
        setError('Failed to save profile: ' + result.error.message)
        setLoading(false)
        return
      }

      // Send notification to PLAYER
      await supabase
        .from('email_notifications')
        .insert({
          user_id: user.id,
          recipient_email: user.email,
          recipient_type: 'player',
          subject: 'Profile Submitted for Approval',
          message: `Dear ${name},\n\nThank you for completing your profile on PlayerFynder!\n\nYour profile has been submitted and is pending admin approval. You will be notified once approved.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      // Send notification to ALL ADMINS
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id, email')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (admin.email) {
            await supabase
              .from('email_notifications')
              .insert({
                user_id: admin.user_id,
                recipient_email: admin.email,
                recipient_type: 'admin',
                subject: 'New Player Registration - Pending Approval',
                message: `A new player "${name}" (${user.email}) has registered and needs approval.\n\nPlease review in the Admin Panel.`,
                status: 'pending',
                created_at: new Date().toISOString()
              })
          }
        }
      }

      alert('Player profile submitted! Waiting for admin approval.')
      router.push('/dashboard')
    }

    // ========== AGENT REGISTRATION ==========
    else if (role === 'agent') {
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let result
      if (existingAgent) {
        result = await supabase
          .from('agents')
          .update({
            name: name,
            agency: agency || null,
            email: user.email,
          })
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('agents')
          .insert([{
            user_id: user.id,
            email: user.email,
            name: name,
            agency: agency || null,
            verification_status: 'pending',
            created_at: new Date().toISOString()
          }])
      }

      if (result.error) {
        setError('Failed to save agent profile: ' + result.error.message)
        setLoading(false)
        return
      }

      // Send notification to AGENT
      await supabase
        .from('email_notifications')
        .insert({
          user_id: user.id,
          recipient_email: user.email,
          recipient_type: 'agent',
          subject: 'Agent Profile Created',
          message: `Dear ${name},\n\nYour agent profile has been created successfully!\n\nYou can now browse players and request engagements.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      // Send notification to ALL ADMINS
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id, email')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (admin.email) {
            await supabase
              .from('email_notifications')
              .insert({
                user_id: admin.user_id,
                recipient_email: admin.email,
                recipient_type: 'admin',
                subject: 'New Agent Registration - Pending Verification',
                message: `A new agent "${name}" (${user.email}) has registered and needs verification.\n\nAgency: ${agency || 'Independent'}\n\nPlease review in the Admin Panel.`,
                status: 'pending',
                created_at: new Date().toISOString()
              })
          }
        }
      }

      alert('Agent profile created!')
      router.push('/dashboard')
    }

    // ========== SCOUT REGISTRATION ==========
    else if (role === 'scout') {
      const { data: existingScout } = await supabase
        .from('scouts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let result
      if (existingScout) {
        result = await supabase
          .from('scouts')
          .update({
            name: name,
            club_name: clubName || null,
            email: user.email,
          })
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('scouts')
          .insert([{
            user_id: user.id,
            email: user.email,
            name: name,
            club_name: clubName || null,
            created_at: new Date().toISOString()
          }])
      }

      if (result.error) {
        setError('Failed to save scout profile: ' + result.error.message)
        setLoading(false)
        return
      }

      // Send notification to SCOUT
      await supabase
        .from('email_notifications')
        .insert({
          user_id: user.id,
          recipient_email: user.email,
          recipient_type: 'scout',
          subject: 'Scout Profile Created',
          message: `Dear ${name},\n\nYour scout profile has been created successfully!\n\nYou can now browse players and create scouting reports.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      // Send notification to ALL ADMINS
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id, email')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (admin.email) {
            await supabase
              .from('email_notifications')
              .insert({
                user_id: admin.user_id,
                recipient_email: admin.email,
                recipient_type: 'admin',
                subject: 'New Scout Registration',
                message: `A new scout "${name}" (${user.email}) has registered.\n\nClub: ${clubName || 'Independent'}\n\nPlease review their profile.`,
                status: 'pending',
                created_at: new Date().toISOString()
              })
          }
        }
      }

      alert('Scout profile created!')
      window.location.href = '/dashboard/scout'
      return
    }

    setLoading(false)
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