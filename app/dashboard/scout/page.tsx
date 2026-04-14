'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, FileText, TrendingUp, Target, Users, ArrowRight, CheckCircle } from 'lucide-react'

export default function ScoutDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchScoutData()
  }, [])

  const fetchScoutData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get scout profile
    const { data: scout } = await supabase
      .from('scouts')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    setProfile(scout)

    if (scout) {
      // Get approved players
      const { data: approvedPlayers } = await supabase
        .from('players')
        .select('*, player_stats(*)')
        .eq('status', 'approved')
        .limit(10)
      
      if (approvedPlayers) setPlayers(approvedPlayers)

      // Get scout's reports
      const { data: scoutReports } = await supabase
        .from('scouting_reports')
        .select('*, players(name, position)')
        .eq('scout_id', scout.id)
      
      if (scoutReports) setReports(scoutReports)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Target className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome, Scout {profile?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-white/80 mt-1">Discover and evaluate football talent</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.club_name || 'Independent Scout'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Players Discovered</p>
              <p className="text-2xl font-bold text-red-600">{players.length}</p>
            </div>
            <Users className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Reports Written</p>
              <p className="text-2xl font-bold text-green-600">{reports.length}</p>
            </div>
            <FileText className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg. Player Rating</p>
              <p className="text-2xl font-bold text-blue-600">
                {reports.length > 0 
                  ? Math.round(reports.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / reports.length)
                  : 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/dashboard/players?scoutMode=true" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-red-500">
          <Eye className="w-12 h-12 text-red-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Browse Players</h2>
          <p className="text-gray-600">Find and evaluate football talent</p>
          <div className="mt-4 flex items-center text-red-600">
            <span className="text-sm">Start Scouting</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        <Link href="/dashboard/reports" className="block bg-white rounded-xl shadow p-6 hover:shadow-lg transition border-l-4 border-green-500">
          <FileText className="w-12 h-12 text-green-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">My Reports</h2>
          <p className="text-gray-600">View and manage your scouting reports</p>
          <div className="mt-4 flex items-center text-green-600">
            <span className="text-sm">View Reports</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent Players */}
      {players.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            Recent Players to Scout
          </h2>
          <div className="space-y-3">
            {players.slice(0, 5).map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{player.name}</p>
                  <p className="text-sm text-gray-500">{player.position} • Age {player.age}</p>
                </div>
                <Link
                  href={`/dashboard/players/${player.id}?scoutMode=true`}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Write Report
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}