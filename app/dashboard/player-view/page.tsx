'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  MapPin, Calendar, TrendingUp, Award, Heart, Eye, 
  CheckCircle, Video, User, Trophy, Activity, 
  Share2, MessageCircle, ThumbsUp, Star, Users
} from 'lucide-react'

export default function PlayerViewPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
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
      .select('*, player_stats(*)')
      .eq('user_id', user.id)
      .single()

    if (!player) {
      router.push('/dashboard')
      return
    }

    setProfile(player)
    setStats(player.player_stats?.[0])

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
  const otherMedia = media.filter(m => !m.url.includes('profile'))

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
            <h1 className="text-3xl md:text-4xl font-bold">{profile?.name}</h1>
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
          <p className="text-2xl font-bold text-gray-900">{stats?.matches_played || 0}</p>
          <p className="text-xs text-gray-500">Matches Played</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-yellow-500">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats?.goals || 0}</p>
          <p className="text-xs text-gray-500">Goals Scored</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-blue-500">
          <Heart className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats?.assists || 0}</p>
          <p className="text-xs text-gray-500">Assists</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center border-b-4 border-purple-500">
          <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">0</p>
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
                <span className="font-medium">{profile?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Position</span>
                <span className="font-medium">{profile?.position}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Age</span>
                <span className="font-medium">{profile?.age} years</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Nationality</span>
                <span className="font-medium">{profile?.nationality}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Height / Weight</span>
                <span className="font-medium">
                  {profile?.height_cm ? `${profile.height_cm} cm` : '—'} / {profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-green-600">Approved</span>
              </div>
            </div>
          </div>

          {/* Performance Ratings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Performance Rating
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pace</span>
                  <span className="font-semibold">85/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 rounded-full h-2" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Shooting</span>
                  <span className="font-semibold">82/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 rounded-full h-2" style={{ width: '82%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Passing</span>
                  <span className="font-semibold">78/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 rounded-full h-2" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Dribbling</span>
                  <span className="font-semibold">88/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 rounded-full h-2" style={{ width: '88%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Defending</span>
                  <span className="font-semibold">45/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 rounded-full h-2" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Physical</span>
                  <span className="font-semibold">80/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 rounded-full h-2" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Achievements
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Top Scorer - Youth League 2023</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Player of the Tournament - Regional Cup 2024</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Captain - National U20 Team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Media Gallery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Career Statistics Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Career Statistics
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Season</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Apps</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Goals</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Assists</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3 text-sm">2024/25</td>
                    <td className="px-4 py-3 text-center text-sm">{stats?.matches_played || 0}</td>
                    <td className="px-4 py-3 text-center text-sm">{stats?.goals || 0}</td>
                    <td className="px-4 py-3 text-center text-sm">{stats?.assists || 0}</td>
                    <td className="px-4 py-3 text-center text-sm">7.8</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 text-sm">2023/24</td>
                    <td className="px-4 py-3 text-center text-sm">24</td>
                    <td className="px-4 py-3 text-center text-sm">12</td>
                    <td className="px-4 py-3 text-center text-sm">8</td>
                    <td className="px-4 py-3 text-center text-sm">7.5</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm">2022/23</td>
                    <td className="px-4 py-3 text-center text-sm">18</td>
                    <td className="px-4 py-3 text-center text-sm">7</td>
                    <td className="px-4 py-3 text-center text-sm">5</td>
                    <td className="px-4 py-3 text-center text-sm">7.2</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                <p className="text-sm text-gray-400 mt-1">Check back later for精彩 highlights</p>
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
                        alt="Player highlight"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                      <ThumbsUp className="w-6 h-6 text-white cursor-pointer hover:text-blue-400" />
                      <MessageCircle className="w-6 h-6 text-white cursor-pointer hover:text-green-400" />
                      <Share2 className="w-6 h-6 text-white cursor-pointer hover:text-purple-400" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      {item.type === 'video' ? '🎥 Highlight' : '📸 Action Shot'}
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