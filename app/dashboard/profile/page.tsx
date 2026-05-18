'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Camera, MapPin, Calendar, TrendingUp, Award, Heart, Eye, 
  Save, Edit2, X, Video, Upload, Trash2, User, CheckCircle, Clock,
  Plus, Trash, Target, Zap, Shield, Activity as ActivityIcon
} from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  
  // Achievements
  const [achievements, setAchievements] = useState<string[]>([])
  const [newAchievement, setNewAchievement] = useState('')
  
  // Performance Ratings
  const [performanceRatings, setPerformanceRatings] = useState({
    pace: 85,
    shooting: 82,
    passing: 78,
    dribbling: 88,
    defending: 45,
    physical: 80
  })
  
  // Career Statistics
  const [careerStats, setCareerStats] = useState([
    { season: '2024/25', apps: 0, goals: 0, assists: 0, rating: 0 },
    { season: '2023/24', apps: 0, goals: 0, assists: 0, rating: 0 },
    { season: '2022/23', apps: 0, goals: 0, assists: 0, rating: 0 }
  ])
  
  // Basic Info
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    position: '',
    nationality: '',
    height_cm: '',
    weight_kg: '',
    bio: ''
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

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
    setFormData({
      name: player.name || '',
      age: player.age?.toString() || '',
      position: player.position || '',
      nationality: player.nationality || '',
      height_cm: player.height_cm?.toString() || '',
      weight_kg: player.weight_kg?.toString() || '',
      bio: player.bio || ''
    })

    // Load achievements
    if (player.achievements && Array.isArray(player.achievements)) {
      setAchievements(player.achievements)
    }

    // Load performance ratings
    if (player.performance_ratings) {
      setPerformanceRatings(player.performance_ratings)
    }

    // Load career stats
    if (player.career_stats && Array.isArray(player.career_stats)) {
      setCareerStats(player.career_stats)
    }

    // Get player media
    const { data: mediaData } = await supabase
      .from('media')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })

    if (mediaData) setMedia(mediaData)

    setLoading(false)
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      setUploading(false)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      setUploading(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/profile-picture.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('player-profiles')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('player-profiles')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('players')
      .update({ profile_picture: publicUrl })
      .eq('id', profile.id)

    if (updateError) {
      alert('Error saving profile picture: ' + updateError.message)
    } else {
      setProfile({ ...profile, profile_picture: publicUrl })
      alert('Profile picture updated successfully!')
    }
    setUploading(false)
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)

    const maxSize = file.type.startsWith('video') ? 50 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      setUploading(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`
    const fileType = file.type.startsWith('video') ? 'video' : 'image'

    const { error: uploadError } = await supabase.storage
      .from('player-media')
      .upload(fileName, file)

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('player-media')
      .getPublicUrl(fileName)

    const { error: dbError } = await supabase
      .from('media')
      .insert({
        player_id: profile.id,
        type: fileType,
        url: publicUrl
      })

    if (dbError) {
      alert('Error saving media: ' + dbError.message)
    } else {
      alert('Media uploaded successfully!')
      fetchProfileData()
    }
    setUploading(false)
  }

  const handleDeleteMedia = async (mediaId: string, mediaUrl: string) => {
    if (!confirm('Delete this media?')) return

    const urlParts = mediaUrl.split('/')
    const filePath = urlParts.slice(urlParts.indexOf('player-media') + 1).join('/')

    await supabase.storage
      .from('player-media')
      .remove([filePath])

    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)

    if (!error) {
      fetchProfileData()
    }
  }

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([...achievements, newAchievement.trim()])
      setNewAchievement('')
    }
  }

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index))
  }

  const updateCareerStat = (index: number, field: string, value: number) => {
    const updated = [...careerStats]
    updated[index] = { ...updated[index], [field]: value }
    setCareerStats(updated)
  }

  const addSeason = () => {
    const newSeason = `${parseInt(careerStats[0].season.split('/')[0]) - 1}/${parseInt(careerStats[0].season.split('/')[0])}`
    setCareerStats([{ season: newSeason, apps: 0, goals: 0, assists: 0, rating: 0 }, ...careerStats])
  }

  const removeSeason = (index: number) => {
    if (careerStats.length > 1) {
      setCareerStats(careerStats.filter((_, i) => i !== index))
    }
  }

  const updateRating = (key: string, value: number) => {
    setPerformanceRatings({ ...performanceRatings, [key]: value })
  }

  const handleUpdateProfile = async () => {
    setLoading(true)

    const { error } = await supabase
      .from('players')
      .update({
        name: formData.name,
        age: parseInt(formData.age),
        position: formData.position,
        nationality: formData.nationality,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
        bio: formData.bio,
        achievements: achievements,
        performance_ratings: performanceRatings,
        career_stats: careerStats
      })
      .eq('id', profile.id)

    if (error) {
      alert('Error updating profile: ' + error.message)
    } else {
      setProfile({ ...profile, ...formData })
      setEditing(false)
      alert('Profile updated successfully!')
      fetchProfileData()
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cover Photo Section */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-t-2xl"></div>
        
        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-6 md:left-10">
          <div className="relative">
            {profile?.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.name}
                className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-red-100 to-blue-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-red-600" />
                </div>
              </div>
            )}
            <label
              htmlFor="profile-picture"
              className="absolute bottom-2 right-2 bg-red-600 text-white p-2 rounded-full cursor-pointer hover:bg-red-700 transition shadow-lg"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="profile-picture"
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </div>
        
        {/* Edit/Save Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-300 transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition"
              >
                <Save className="w-4 h-4" />
                Save All Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-white transition shadow-md"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="bg-white rounded-b-2xl shadow-md pt-20 pb-6 px-6">
        {editing ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Select Position</option>
                      <option value="Forward">Forward</option>
                      <option value="Midfielder">Midfielder</option>
                      <option value="Defender">Defender</option>
                      <option value="Goalkeeper">Goalkeeper</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Tell us about yourself as a player..."
                  />
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">🏆 Achievements</h3>
              {achievements.map((achievement, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <span className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm">{achievement}</span>
                  <button
                    onClick={() => removeAchievement(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  placeholder="Add achievement (e.g., Top Scorer 2023)"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={addAchievement}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Performance Ratings */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">📊 Performance Ratings (1-100)</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(performanceRatings).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm text-gray-600 capitalize flex justify-between">
                      {key}
                      <span className="font-semibold text-red-600">{value}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => updateRating(key, parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Career Statistics */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">📈 Career Statistics</h3>
                <button
                  onClick={addSeason}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                >
                  + Add Season
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Season</th>
                      <th className="px-3 py-2 text-center">Apps</th>
                      <th className="px-3 py-2 text-center">Goals</th>
                      <th className="px-3 py-2 text-center">Assists</th>
                      <th className="px-3 py-2 text-center">Rating</th>
                      <th className="px-3 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {careerStats.map((stat, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2 font-medium">{stat.season}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={stat.apps}
                            onChange={(e) => updateCareerStat(idx, 'apps', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={stat.goals}
                            onChange={(e) => updateCareerStat(idx, 'goals', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={stat.assists}
                            onChange={(e) => updateCareerStat(idx, 'assists', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={stat.rating}
                            onChange={(e) => updateCareerStat(idx, 'rating', parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {careerStats.length > 1 && (
                            <button
                              onClick={() => removeSeason(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile?.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-gray-500 flex-wrap">
              <MapPin className="w-4 h-4" />
              <span>{profile?.nationality || 'Location not set'}</span>
              <span className="mx-2">•</span>
              <Calendar className="w-4 h-4" />
              <span>Age {profile?.age || '?'}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                {profile?.position || 'Position not set'}
              </span>
              {profile?.status === 'approved' ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified Player
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending Verification
                </span>
              )}
            </div>
            {profile?.bio && (
              <p className="mt-4 text-gray-600">{profile.bio}</p>
            )}

            {/* Achievements Display */}
            {achievements.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-semibold mb-2">🏆 Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((achievement, idx) => (
                    <span key={idx} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      🏆 {achievement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow p-4 text-center border-l-4 border-red-500">
          <TrendingUp className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats?.matches_played || 0}</p>
          <p className="text-xs text-gray-500">Matches Played</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center border-l-4 border-yellow-500">
          <Award className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats?.goals || 0}</p>
          <p className="text-xs text-gray-500">Goals Scored</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center border-l-4 border-blue-500">
          <Heart className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats?.assists || 0}</p>
          <p className="text-xs text-gray-500">Assists</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center border-l-4 border-purple-500">
          <Eye className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-xs text-gray-500">Profile Views</p>
        </div>
      </div>

      {/* Performance Ratings Display (when not editing) */}
      {!editing && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">📊 Performance Ratings</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(performanceRatings).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-red-600">{value}</div>
                <div className="text-xs text-gray-500 capitalize">{key}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Career Statistics Display (when not editing) */}
      {!editing && careerStats.some(stat => stat.apps > 0 || stat.goals > 0 || stat.assists > 0) && (
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">📈 Career Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Season</th>
                  <th className="px-4 py-2 text-center">Apps</th>
                  <th className="px-4 py-2 text-center">Goals</th>
                  <th className="px-4 py-2 text-center">Assists</th>
                  <th className="px-4 py-2 text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {careerStats.map((stat, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2 font-medium">{stat.season}</td>
                    <td className="px-4 py-2 text-center">{stat.apps}</td>
                    <td className="px-4 py-2 text-center">{stat.goals}</td>
                    <td className="px-4 py-2 text-center">{stat.assists}</td>
                    <td className="px-4 py-2 text-center">{stat.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Media Gallery */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">🎥 Highlight Gallery</h2>
          <label className="cursor-pointer text-sm text-red-600 hover:underline flex items-center gap-1">
            <Upload className="w-4 h-4" />
            Upload Media
            <input
              type="file"
              accept="video/*,image/*"
              onChange={handleMediaUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {media.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No media uploaded yet</p>
            <p className="text-xs text-gray-400 mt-1">Upload your first highlight video</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {media.map((item) => (
              <div key={item.id} className="relative group">
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt="Highlight"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <button
                  onClick={() => handleDeleteMedia(item.id, item.url)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-0.5 rounded text-xs">
                  {item.type === 'video' ? '🎥 Video' : '📷 Photo'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}