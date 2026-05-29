'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, Filter, Eye, Star, TrendingUp, Users,
  Calendar, MapPin, Target, BarChart3, ArrowUpDown,
  UserPlus, Briefcase, Activity, Zap, Flame, XCircle
} from 'lucide-react'

export default function MyReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scoutId, setScoutId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchScoutAndReports()
  }, [])

  const fetchScoutAndReports = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: scout } = await supabase
      .from('scouts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!scout) {
      router.push('/dashboard/scout')
      return
    }

    setScoutId(scout.id)
    await fetchReports(scout.id)
  }

  const fetchReports = async (scoutId: string) => {
    const { data } = await supabase
      .from('scouting_reports')
      .select(`
        *,
        player:players(id, name, position, age, nationality, profile_picture)
      `)
      .eq('scout_id', scoutId)
      .order('created_at', { ascending: false })

    if (data) setReports(data)
    setLoading(false)
  }

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'sign_immediately':
        return { text: 'Sign Immediately', color: 'bg-green-100 text-green-700', icon: Target }
      case 'trial_recommended':
        return { text: 'Trial Recommended', color: 'bg-blue-100 text-blue-700', icon: Activity }
      case 'monitor_further':
        return { text: 'Monitor Further', color: 'bg-yellow-100 text-yellow-700', icon: Eye }
      default:
        return { text: 'Not Recommended', color: 'bg-red-100 text-red-700', icon: XCircle }
    }
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
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent mb-2">
        My Scouting Reports
      </h1>
      <p className="text-gray-600 mb-8">View and manage your player evaluations</p>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center border-t-4 border-red-500">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No scouting reports yet</p>
          <p className="text-sm text-gray-400 mt-2">Start scouting players to create reports</p>
          <Link href="/dashboard/players?scoutMode=true" className="inline-block mt-4 text-green-600 hover:underline">
            Browse Players →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.map((report) => {
            const badge = getRecommendationBadge(report.recommendation)
            const BadgeIcon = badge.icon
            
            return (
              <div key={report.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition border-l-4 border-green-500">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {report.player?.profile_picture ? (
                        <img src={report.player.profile_picture} alt={report.player.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Target className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{report.player?.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {report.player?.position} • Age {report.player?.age} • {report.player?.nationality || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />
                      {badge.text}
                    </span>
                  </div>

                  {/* Ratings Summary */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Speed</p>
                      <p className="font-bold text-lg">{report.speed_rating}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Shooting</p>
                      <p className="font-bold text-lg">{report.shooting_rating}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Passing</p>
                      <p className="font-bold text-lg">{report.passing_rating}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Dribbling</p>
                      <p className="font-bold text-lg">{report.dribbling_rating}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Defending</p>
                      <p className="font-bold text-lg">{report.defending_rating}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Physical</p>
                      <p className="font-bold text-lg">{report.physical_rating}/10</p>
                    </div>
                  </div>

                  {/* Overall Rating */}
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">Overall Rating:</span>
                      <span className="text-xl font-bold text-yellow-600">{report.overall_rating}/10</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Strengths Preview */}
                  {report.strengths && (
                    <div className="mt-3 text-sm">
                      <p className="text-gray-500">Strengths:</p>
                      <p className="text-gray-700 line-clamp-2">{report.strengths}</p>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/dashboard/players/${report.player_id}`}
                      className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      View Player
                    </Link>
                    <Link
                      href={`/dashboard/scouting/reports/new/${report.player_id}?edit=${report.id}`}
                      className="flex-1 text-center py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Edit Report
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