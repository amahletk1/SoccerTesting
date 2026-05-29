'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, Eye, Award, Calendar, Search, Target, 
  Activity, Shield, Zap, Heart, ChevronRight, XCircle, RefreshCw
} from 'lucide-react'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchReports()
  }, [])

  const checkAdminAndFetchReports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Verify user is admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!adminData) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await fetchReports()
    } catch (err) {
      console.error('Error checking admin:', err)
      router.push('/dashboard')
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('scouting_reports')
      .select(`
        *,
        player:players(id, name, position, age, nationality, profile_picture),
        scout:scouts(id, name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
    } else {
      setReports(data || [])
    }
    setLoading(false)
  }

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'sign_immediately': return 'Sign Immediately'
      case 'trial_recommended': return 'Trial Recommended'
      case 'monitor_further': return 'Monitor Further'
      default: return 'Not Recommended'
    }
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'sign_immediately': return 'bg-green-100 text-green-700 border-green-200'
      case 'trial_recommended': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'monitor_further': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-red-100 text-red-700 border-red-200'
    }
  }

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'sign_immediately': return Target
      case 'trial_recommended': return Activity
      case 'monitor_further': return Eye
      default: return XCircle
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600'
    if (rating >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredReports = reports.filter(report =>
    report.player?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.scout?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            All Scouting Reports
          </h1>
          <p className="text-gray-600 mt-1">View and manage all scout evaluations</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Total Reports</p>
          <p className="text-2xl font-bold text-blue-600">{reports.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Sign Immediately</p>
          <p className="text-2xl font-bold text-green-600">
            {reports.filter(r => r.recommendation === 'sign_immediately').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">Trial Recommended</p>
          <p className="text-2xl font-bold text-yellow-600">
            {reports.filter(r => r.recommendation === 'trial_recommended').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm">Active Scouts</p>
          <p className="text-2xl font-bold text-purple-600">
            {new Set(reports.map(r => r.scout_id)).size}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by player or scout name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No scouting reports found</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-red-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const RecommendationIcon = getRecommendationIcon(report.recommendation)
            const recommendationColor = getRecommendationColor(report.recommendation)
            
            return (
              <div key={report.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {report.player?.profile_picture ? (
                      <img src={report.player.profile_picture} alt={report.player.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold">{report.player?.name}</h3>
                      <p className="text-gray-300 text-xs">
                        {report.player?.position} • Age {report.player?.age}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${recommendationColor}`}>
                      <RecommendationIcon className="w-3 h-3" />
                      {getRecommendationText(report.recommendation)}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Scout Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Scouted by</p>
                      <p className="font-semibold text-gray-900">{report.scout?.name || 'Unknown Scout'}</p>
                    </div>

                    {/* Overall Rating */}
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Overall Rating</p>
                      <p className={`text-2xl font-bold ${getRatingColor(report.overall_rating)}`}>
                        {report.overall_rating}/10
                      </p>
                    </div>

                    {/* Nationality */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Nationality</p>
                      <p className="font-medium text-gray-900">{report.player?.nationality || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Ratings Grid */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Speed</p>
                      <p className={`text-lg font-bold ${getRatingColor(report.speed_rating)}`}>{report.speed_rating}/10</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Shooting</p>
                      <p className={`text-lg font-bold ${getRatingColor(report.shooting_rating)}`}>{report.shooting_rating}/10</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Passing</p>
                      <p className={`text-lg font-bold ${getRatingColor(report.passing_rating)}`}>{report.passing_rating}/10</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Dribbling</p>
                      <p className={`text-lg font-bold ${getRatingColor(report.dribbling_rating)}`}>{report.dribbling_rating}/10</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Defending</p>
                      <p className={`text-lg font-bold ${getRatingColor(report.defending_rating)}`}>{report.defending_rating}/10</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Physical</p>
                      <p className={`text-lg font-bold ${getRatingColor(report.physical_rating)}`}>{report.physical_rating}/10</p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.strengths && (
                      <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                        <p className="text-xs font-semibold text-green-700 mb-1">💪 Strengths</p>
                        <p className="text-sm text-gray-700">{report.strengths}</p>
                      </div>
                    )}
                    {report.weaknesses && (
                      <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-500">
                        <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Areas for Improvement</p>
                        <p className="text-sm text-gray-700">{report.weaknesses}</p>
                      </div>
                    )}
                  </div>

                  {/* Additional Notes */}
                  {report.notes && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">📝 Additional Notes</p>
                      <p className="text-sm text-gray-700">{report.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t flex justify-end">
                    <Link
                      href={`/dashboard/players/${report.player_id}`}
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      View Player Profile
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}