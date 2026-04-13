'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Eye, Star, Calendar, TrendingUp } from 'lucide-react'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get scout profile
    const { data: scout } = await supabase
      .from('scouts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (scout) {
      const { data } = await supabase
        .from('scouting_reports')
        .select('*, players(name, position, age, nationality)')
        .eq('scout_id', scout.id)
        .order('created_at', { ascending: false })

      if (data) setReports(data)
    }

    setLoading(false)
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'sign_immediately': return 'text-green-600 bg-green-100'
      case 'trial_recommended': return 'text-blue-600 bg-blue-100'
      case 'monitor_further': return 'text-yellow-600 bg-yellow-100'
      case 'not_recommended': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case 'sign_immediately': return 'Sign Immediately'
      case 'trial_recommended': return 'Trial Recommended'
      case 'monitor_further': return 'Monitor Further'
      case 'not_recommended': return 'Not Recommended'
      default: return rec
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
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition border-l-4 border-green-500">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{report.players?.name}</h3>
                    <p className="text-gray-600">
                      {report.players?.position} • Age {report.players?.age} • {report.players?.nationality || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(report.recommendation)}`}>
                    {getRecommendationLabel(report.recommendation)}
                  </span>
                </div>

                {/* Ratings */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Speed:</span>
                    <span className="font-semibold">{report.speed_rating}/10</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Shooting:</span>
                    <span className="font-semibold">{report.shooting_rating}/10</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Passing:</span>
                    <span className="font-semibold">{report.passing_rating}/10</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Dribbling:</span>
                    <span className="font-semibold">{report.dribbling_rating}/10</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Defending:</span>
                    <span className="font-semibold">{report.defending_rating}/10</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Physical:</span>
                    <span className="font-semibold">{report.physical_rating}/10</span>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">Overall Rating:</span>
                    <span className="text-xl font-bold text-blue-600">{report.overall_rating}/10</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Notes */}
                {report.strengths && (
                  <div className="mt-3 text-sm">
                    <p className="text-gray-500">Strengths:</p>
                    <p className="text-gray-700">{report.strengths}</p>
                  </div>
                )}
                {report.weaknesses && (
                  <div className="mt-2 text-sm">
                    <p className="text-gray-500">Weaknesses:</p>
                    <p className="text-gray-700">{report.weaknesses}</p>
                  </div>
                )}

                <Link
                  href={`/dashboard/players/${report.player_id}?scoutMode=true`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition"
                >
                  <Eye className="w-4 h-4" />
                  Edit Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}