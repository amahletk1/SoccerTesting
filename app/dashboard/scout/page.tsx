'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Target, FileText, Star, Clock, TrendingUp, Award, 
  Users, CheckCircle, Calendar, BarChart3, Eye, Zap, Trophy,
  UploadCloud
} from 'lucide-react'

export default function ScoutDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myReports, setMyReports] = useState<any[]>([])
  const [playersCount, setPlayersCount] = useState(0)
  const [scoutId, setScoutId] = useState<string>('')
  
  // Qualifications state
  const [qualifications, setQualifications] = useState('')
  const [certificateUrl, setCertificateUrl] = useState('')
  const [uploadingCert, setUploadingCert] = useState(false)
  
  const [stats, setStats] = useState({
    playersScouted: 0,
    reportsWritten: 0,
    averageRating: 0,
    thisMonthReports: 0,
    topRating: 0,
    topPlayer: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Get scout profile
        const { data: scout, error: scoutError } = await supabase
          .from('scouts')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (scoutError || !scout) {
          router.push('/dashboard')
          return
        }

        setProfile(scout)
        setScoutId(scout.id)
        setQualifications(scout.qualifications || '')
        setCertificateUrl(scout.certificate_url || '')

        // Get scout's reports
        const { data: reportsData } = await supabase
          .from('scouting_reports')
          .select(`
            *,
            player:players(id, name, position, age, nationality)
          `)
          .eq('scout_id', scout.id)
          .order('created_at', { ascending: false })

        if (reportsData) {
          setMyReports(reportsData)
          
          const thisMonth = new Date().getMonth()
          const thisMonthReports = reportsData.filter(r => 
            r.created_at && new Date(r.created_at).getMonth() === thisMonth
          )
          
          const avgRating = reportsData.length > 0 
            ? reportsData.reduce((acc, r) => acc + (r.overall_rating || 0), 0) / reportsData.length
            : 0
          
          const topRated = reportsData.length > 0 
            ? reportsData.reduce((max, r) => 
                (r.overall_rating > (max.overall_rating || 0)) ? r : max, {})
            : { overall_rating: 0, player: null }
          
          setStats({
            playersScouted: reportsData.length,
            reportsWritten: reportsData.length,
            averageRating: Math.round(avgRating * 10) / 10,
            thisMonthReports: thisMonthReports.length,
            topRating: topRated.overall_rating || 0,
            topPlayer: topRated.player?.name || '',
          })
        }

        // Get total players count for scouting target
        const { count: playersTotal } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')

        setPlayersCount(playersTotal || 0)

      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboard()
  }, [])

  // Handle certificate upload
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !scoutId) return

    setUploadingCert(true)

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file')
      setUploadingCert(false)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      setUploadingCert(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${scoutId}/certificate-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('scout-certificates')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploadingCert(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('scout-certificates')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('scouts')
      .update({ certificate_url: publicUrl })
      .eq('id', scoutId)

    if (updateError) {
      alert('Error saving certificate: ' + updateError.message)
    } else {
      setCertificateUrl(publicUrl)
      alert('Certificate uploaded successfully!')
    }
    setUploadingCert(false)
  }

  // Save qualifications on blur
  const saveQualifications = async () => {
    const { error } = await supabase
      .from('scouts')
      .update({ qualifications })
      .eq('id', scoutId)
    if (error) console.error('Error saving qualifications:', error)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-green-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Target className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Scout Dashboard</h1>
            <p className="text-white/80 mt-1">Welcome back, {profile?.name?.split(' ')[0] || 'Scout'}!</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {profile?.club_name || 'Independent Scout'}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Qualifications & Certificate Section - NEW */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Qualifications
            </h3>
            <textarea
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              onBlur={saveQualifications}
              placeholder="Enter your qualifications (e.g., UEFA B License, Scouting Diploma)..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <p className="text-xs text-gray-400 mt-1">Qualifications are visible to clubs and agents</p>
          </div>
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate (PDF/Image)</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCertificateUpload}
                disabled={uploadingCert}
                className="hidden"
                id="certificate-upload"
              />
              <label
                htmlFor="certificate-upload"
                className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${uploadingCert ? 'opacity-50' : ''}`}
              >
                <UploadCloud className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">{uploadingCert ? 'Uploading...' : 'Upload Certificate'}</span>
              </label>
              {certificateUrl && (
                <a
                  href={certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  View Certificate
                </a>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, or PNG (Max 10MB)</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Players Scouted</p>
          <p className="text-2xl font-bold text-green-600">{stats.playersScouted}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Reports Written</p>
          <p className="text-2xl font-bold text-blue-600">{stats.reportsWritten}</p>
          <p className="text-xs text-blue-600 mt-1">+{stats.thisMonthReports} this month</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">Avg. Rating Given</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}/10</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm">Available Players</p>
          <p className="text-2xl font-bold text-purple-600">{playersCount}</p>
        </div>
      </div>

      {/* Top Performer Card */}
      {stats.topPlayer && stats.topRating > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold">🏆 Top Rated Discovery</h2>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.topPlayer}</p>
              <p className="text-sm text-gray-500">Your highest rated player</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{stats.topRating}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">/10 rating</p>
            </div>
          </div>
        </div>
      )}

      {/* My Recent Reports */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">My Recent Reports</h2>
          </div>
          <Link href="/dashboard/scouting/reports" className="text-sm text-green-600 hover:underline">
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
            {myReports.slice(0, 5).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-semibold text-gray-900">{report.player?.name || 'Unknown Player'}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{report.player?.position || 'Position N/A'}</span>
                    <span>•</span>
                    <span>Age {report.player?.age || '?'}</span>
                    <span>•</span>
                    <span>{report.player?.nationality || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{report.overall_rating || '?'}/10</span>
                  </div>
                  <Link
                    href={`/dashboard/players/${report.player_id}`}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/scouting"
          className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow p-6 text-white hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <Target className="w-8 h-8 mb-2" />
              <h3 className="text-lg font-semibold">Find Players</h3>
              <p className="text-white/80 text-sm mt-1">Discover new talent</p>
            </div>
            <span className="text-3xl">→</span>
          </div>
        </Link>
        
        <Link
          href="/dashboard/scouting/reports"
          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow p-6 text-white hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <FileText className="w-8 h-8 mb-2" />
              <h3 className="text-lg font-semibold">My Reports</h3>
              <p className="text-white/80 text-sm mt-1">Manage your evaluations</p>
            </div>
            <span className="text-3xl">→</span>
          </div>
        </Link>
      </div>

      {/* Pro Tips Card */}
      <div className="bg-gradient-to-r from-green-50 via-teal-50 to-green-50 rounded-xl shadow p-6">
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