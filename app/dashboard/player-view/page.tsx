'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  MapPin, Calendar, TrendingUp, Award, Heart, Eye, 
  CheckCircle, Video, User, Trophy, Activity, 
  Share2, MessageCircle, ThumbsUp, Briefcase, DollarSign
} from 'lucide-react'

export default function PlayerViewPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [seasonStats, setSeasonStats] = useState<any[]>([])
  const [careerHistory, setCareerHistory] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [achievements, setAchievements] = useState<string[]>([])
  const [performanceRatings, setPerformanceRatings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchPlayerData()
  }, [])

  const fetchPlayerData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get player profile
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!player) {
      router.push('/dashboard')
      return
    }

    setProfile(player)
    
    // Load achievements from profile
    if (player.achievements && Array.isArray(player.achievements)) {
      setAchievements(player.achievements)
    }
    
    // Load performance ratings from profile
    if (player.performance_ratings) {
      setPerformanceRatings(player.performance_ratings)
    }

    // Get season stats
    const { data: seasonData } = await supabase
      .from('season_stats')
      .select('*')
      .eq('player_id', player.id)
      .order('season', { ascending: false })
    
    if (seasonData) setSeasonStats(seasonData)

    // Get career history
    const { data: careerData } = await supabase
      .from('career_history')
      .select('*')
      .eq('player_id', player.id)
      .order('start_date', { ascending: false })
    
    if (careerData) setCareerHistory(careerData)

    // Get player media (videos and images)
    const { data: mediaData } = await supabase
      .from('media')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })

    if (mediaData) setMedia(mediaData)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Separate profile picture from other media
  const otherMedia = media.filter(m => !m.url?.includes('profile'))

  // Calculate total stats from all seasons
  const totalGoals = seasonStats.reduce((sum, stat) => sum + (stat.goals || 0), 0)
  const totalAssists = seasonStats.reduce((sum, stat) => sum + (stat.assists || 0), 0)
  const totalAppearances = seasonStats.reduce((sum, stat) => sum + (stat.appearances || 0), 0)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section with Profile Picture */}
      <div className="relative bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          {/* Profile Picture */}
          <div className="relative">
            {profile?.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.name}
                className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-2xl"
              />
            ) : (
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white/20 border-4 border-white shadow-2xl flex items-center justify-center">
                <User className="w-20 h-20 text-white" />
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
              <CheckCircle className="w-3 h-3" />
              Verified Player
            </div>
          </div>

          {/* Player Info */}
          <div className="text-center md:text-left text-white">
            <h1 className="text-3xl md:text-4xl font-bold">{profile?.name || 'Player Name'}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-white/80">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile?.nationality || 'Location not set'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Age {profile?.age || '?'}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {profile?.position || 'Position not set'}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
              <button className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Contact Agent
              </button>
              <button className="bg-white/20 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-red-500">
          <TrendingUp className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalAppearances || 0}</p>
          <p className="text-xs text-gray-500">Matches Played</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-yellow-500">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalGoals || 0}</p>
          <p className="text-xs text-gray-500">Goals Scored</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-blue-500">
          <Heart className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalAssists || 0}</p>
          <p className="text-xs text-gray-500">Assists</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-purple-500">
          <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{profile?.views_count || 0}</p>
          <p className="text-xs text-gray-500">Profile Views</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Left Column - Personal Info */}
        <div className="space-y-6">
          {/* About Player */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" />
              About the Player
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Full Name</span>
                <span className="font-medium">{profile?.name || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Position</span>
                <span className="font-medium">{profile?.position || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Age</span>
                <span className="font-medium">{profile?.age ? `${profile.age} years` : '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Nationality</span>
                <span className="font-medium">{profile?.nationality || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Preferred Foot</span>
                <span className="font-medium">{profile?.preferred_foot || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Height / Weight</span>
                <span className="font-medium">
                  {profile?.height_cm ? `${profile.height_cm} cm` : '—'} / {profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Jersey Number</span>
                <span className="font-medium">{profile?.jersey_number || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Current Club</span>
                <span className="font-medium">{profile?.current_club || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Market Value</span>
                <span className="font-medium">{profile?.market_value ? `€${(profile.market_value / 1000000).toFixed(1)}M` : '-'}</span>
              </div>
            </div>
          </div>

          {/* Performance Ratings */}
          {performanceRatings && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Performance Rating
              </h2>
              <div className="space-y-4">
                {Object.entries(performanceRatings).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{key}</span>
                      <span className="font-semibold">{value}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 rounded-full h-2" style={{ width: `${value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Achievements
              </h2>
              <div className="space-y-2">
                {achievements.map((achievement, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {profile?.bio && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Biography
              </h2>
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Right Column - Stats and Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Season Statistics Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Season Statistics
            </h2>
            {seasonStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No season statistics added yet.</p>
                <p className="text-sm mt-1">Go to Edit Profile → Season Stats to add your performance data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-semibold">Season</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold">Competition</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold">Club</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold">Apps</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold">Goals</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold">Assists</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonStats.map((stat, idx) => (
                      <tr key={stat.id} className={idx !== seasonStats.length - 1 ? 'border-b' : ''}>
                        <td className="px-3 py-2 text-sm font-medium">{stat.season}</td>
                        <td className="px-3 py-2 text-center text-sm">{stat.competition || '-'}</td>
                        <td className="px-3 py-2 text-center text-sm">{stat.club || '-'}</td>
                        <td className="px-3 py-2 text-center text-sm">{stat.appearances || 0}</td>
                        <td className="px-3 py-2 text-center text-sm text-green-600 font-semibold">{stat.goals || 0}</td>
                        <td className="px-3 py-2 text-center text-sm text-blue-600 font-semibold">{stat.assists || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Career History */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-600" />
              Career History
            </h2>
            {careerHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No career history added yet.</p>
                <p className="text-sm mt-1">Go to Edit Profile → Career History to add your club history.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {careerHistory.map((entry) => (
                  <div key={entry.id} className="flex gap-4 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                      {entry.club_name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{entry.club_name}</h4>
                      <p className="text-sm text-gray-500">{entry.league} • {entry.country}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {entry.start_date ? new Date(entry.start_date).getFullYear() : '?'} - {entry.end_date ? new Date(entry.end_date).getFullYear() : 'Present'}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>{entry.appearances || 0} Apps</span>
                        <span className="text-green-600">{entry.goals || 0} Goals</span>
                        <span className="text-blue-600">{entry.assists || 0} Assists</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Media Gallery */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              Highlight Gallery
            </h2>
            {otherMedia.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No highlight videos or images yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload media in your profile page</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherMedia.map((item) => (
                  <div key={item.id} className="relative group">
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.title || "Player highlight"}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    {item.title && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                        {item.title}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                      <ThumbsUp className="w-6 h-6 text-white cursor-pointer hover:text-blue-400" />
                      <MessageCircle className="w-6 h-6 text-white cursor-pointer hover:text-green-400" />
                      <Share2 className="w-6 h-6 text-white cursor-pointer hover:text-purple-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}