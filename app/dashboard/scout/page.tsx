'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Target, FileText, Star, Clock, TrendingUp, Award, 
  Users, CheckCircle, Calendar, BarChart3, Eye
} from 'lucide-react'

export default function ScoutDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myReports, setMyReports] = useState<any[]>([])
  const [myShortlist, setMyShortlist] = useState<any[]>([])
  const [stats, setStats] = useState({
    playersScouted: 0,
    reportsWritten: 0,
    averageRating: 0,
    pendingReviews: 0,
    thisMonthReports: 0,
    topRating: 0,
    topPlayer: '',
    mostScoutedPosition: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
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
        // Get my reports
        const { data: reports } = await supabase
          .from('scouting_reports')
          .select('*, players(name, position, age, nationality)')
          .eq('scout_id', scout.id)
          .order('created_at', { ascending: false })
        
        if (reports) {
          setMyReports(reports.slice(0, 5))
          
          // Calculate stats
          const thisMonth = new Date().getMonth()
          const thisMonthReports = reports.filter(r => new Date(r.created_at).getMonth() === thisMonth)
          
          const avgRating = reports.length > 0 
            ? reports.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / reports.length
            : 0
          
          const topRated = reports.reduce((max, r) => 
            (r.overall_rating > (max.overall_rating || 0)) ? r : max, {})
          
          // Count positions
          const positionCount: any = {}
          reports.forEach(r => {
            const pos = r.players?.position
            if (pos) positionCount[pos] = (positionCount[pos] || 0) + 1
          })
          const topPosition = Object.keys(positionCount).reduce((a, b) => 
            positionCount[a] > positionCount[b] ? a : b, '')
          
          setStats({
            playersScouted: reports.length,
            reportsWritten: reports.length,
            averageRating: Math.round(avgRating * 10) / 10,
            pendingReviews: 0,
            thisMonthReports: thisMonthReports.length,
            topRating: topRated.overall_rating || 0,
            topPlayer: topRated.players?.name || '',
            mostScoutedPosition: topPosition || 'Forward'
          })
        }

        // Get my shortlist (players I've shortlisted)
        const { data: shortlist } = await supabase
          .from('shortlists')
          .select('*, players(name, position, age, nationality)')
          .eq('agent_id', scout.id)
          .limit(6)
        
        if (shortlist) setMyShortlist(shortlist)
      }
      setLoading(false)
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Target className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Scout Hub</h1>
            <p className="text-white/80 mt-1">Welcome back, {profile?.name?.split(' ')[0] || 'Scout'}!</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{profile?.club_name || 'Independent Scout'}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Member since {new Date(profile?.created_at).getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* My Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Players Scouted</p>
          <p className="text-2xl font-bold text-red-600">{stats.playersScouted}</p>
          <p className="text-xs text-gray-400 mt-1">Total evaluated</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Reports Written</p>
          <p className="text-2xl font-bold text-green-600">{stats.reportsWritten}</p>
          <p className="text-xs text-green-600 mt-1">+{stats.thisMonthReports} this month</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Avg. Rating Given</p>
          <p className="text-2xl font-bold text-blue-600">{stats.averageRating}/10</p>
          <p className="text-xs text-gray-400 mt-1">Player performance</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm">Top Rating</p>
          <p className="text-2xl font-bold text-purple-600">{stats.topRating}/10</p>
          <p className="text-xs text-gray-400 mt-1 truncate">{stats.topPlayer || 'No ratings yet'}</p>
        </div>
      </div>

      {/* My Performance Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">My Performance</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Reports per month</p>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (stats.thisMonthReports / 10) * 100)}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{stats.thisMonthReports} reports this month</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Most scouted position</p>
            <p className="text-lg font-semibold">{stats.mostScoutedPosition}</p>
            <p className="text-xs text-gray-400">You scout {stats.mostScoutedPosition}s most often</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Scouting streak</p>
            <p className="text-lg font-semibold">{stats.reportsWritten > 0 ? 'Active' : 'Start scouting'}</p>
            <p className="text-xs text-gray-400">Keep writing reports to maintain streak</p>
          </div>
        </div>
      </div>

      {/* My Recent Reports */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">My Recent Reports</h2>
          </div>
          <Link href="/dashboard/reports" className="text-sm text-green-600 hover:underline">
            View all ({stats.reportsWritten}) →
          </Link>
        </div>
        {myReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No reports written yet</p>
            <Link href="/dashboard/scouting" className="text-sm text-green-600 hover:underline mt-2 inline-block">
              Start scouting →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-semibold text-gray-900">{report.players?.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{report.players?.position}</span>
                    <span>•</span>
                    <span>Age {report.players?.age}</span>
                    <span>•</span>
                    <span>{report.players?.nationality || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{report.overall_rating}/10</span>
                  </div>
                  <Link
                    href={`/dashboard/players/${report.player_id}?scoutMode=true`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Shortlist */}
      {myShortlist.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">My Shortlist</h2>
            </div>
            <Link href="/dashboard/shortlist" className="text-sm text-yellow-600 hover:underline">
              View all ({myShortlist.length}) →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myShortlist.slice(0, 3).map((item) => (
              <div key={item.id} className="border rounded-lg p-3 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{item.players?.name}</p>
                    <p className="text-xs text-gray-500">{item.players?.position} • Age {item.players?.age}</p>
                  </div>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
                <Link
                  href={`/dashboard/players/${item.player_id}`}
                  className="mt-2 text-xs text-blue-600 hover:underline inline-block"
                >
                  View Profile →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro Tips Card */}
      <div className="bg-gradient-to-r from-red-50 via-blue-50 to-red-50 rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Scout Success Tips</h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span className="text-gray-600">Watch 3+ matches before rating</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span className="text-gray-600">Compare to professional benchmarks</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            <span className="text-gray-600">Document strengths AND weaknesses</span>
          </div>
        </div>
      </div>
    </div>
  )
}