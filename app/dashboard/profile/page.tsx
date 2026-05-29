'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Camera, MapPin, Calendar, TrendingUp, Award, Heart, Eye, 
  Save, Edit2, X, Video, Upload, Trash2, User, CheckCircle, Clock,
  Plus, Target, Zap, Shield, Activity,
  Briefcase, DollarSign, Phone, Link,
  Globe
} from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [seasonStats, setSeasonStats] = useState<any[]>([])
  const [careerHistory, setCareerHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  // Basic Info
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    date_of_birth: '',
    position: '',
    nationality: '',
    height_cm: '',
    weight_kg: '',
    preferred_foot: 'Right',
    current_club: '',
    current_club_since: '',
    contract_until: '',
    jersey_number: '',
    agent_name: '',
    agent_contact: '',
    market_value: '',
    bio: ''
  })
  
  // Social Links
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    instagram: '',
    facebook: '',
    youtube: '',
    website: ''
  })
  
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
  
  // New Season Stats
  const [newSeasonStat, setNewSeasonStat] = useState({
    season: '',
    competition: '',
    club: '',
    appearances: 0,
    goals: 0,
    assists: 0,
    minutes_played: 0,
    yellow_cards: 0,
    red_cards: 0,
    pass_accuracy: 0,
    shot_accuracy: 0
  })
  
  // New Career History
  const [newCareerEntry, setNewCareerEntry] = useState({
    club_name: '',
    league: '',
    country: '',
    start_date: '',
    end_date: '',
    is_current: false,
    transfer_type: 'Permanent',
    transfer_fee: '',
    appearances: 0,
    goals: 0,
    assists: 0
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
    setFormData({
      name: player.name || '',
      age: player.age?.toString() || '',
      date_of_birth: player.date_of_birth || '',
      position: player.position || '',
      nationality: player.nationality || '',
      height_cm: player.height_cm?.toString() || '',
      weight_kg: player.weight_kg?.toString() || '',
      preferred_foot: player.preferred_foot || 'Right',
      current_club: player.current_club || '',
      current_club_since: player.current_club_since || '',
      contract_until: player.contract_until || '',
      jersey_number: player.jersey_number?.toString() || '',
      agent_name: player.agent_name || '',
      agent_contact: player.agent_contact || '',
      market_value: player.market_value?.toString() || '',
      bio: player.bio || ''
    })

    // Load social links
    if (player.social_links) {
      setSocialLinks(player.social_links)
    }

    // Load achievements
    if (player.achievements && Array.isArray(player.achievements)) {
      setAchievements(player.achievements)
    }

    // Load performance ratings
    if (player.performance_ratings) {
      setPerformanceRatings(player.performance_ratings)
    }

    // Load season stats
    const { data: seasonData } = await supabase
      .from('season_stats')
      .select('*')
      .eq('player_id', player.id)
      .order('season', { ascending: false })
    
    if (seasonData) setSeasonStats(seasonData)

    // Load career history
    const { data: careerData } = await supabase
      .from('career_history')
      .select('*')
      .eq('player_id', player.id)
      .order('start_date', { ascending: false })
    
    if (careerData) setCareerHistory(careerData)

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

    const title = prompt('Enter a title for this media:', 'Highlight')
    if (!title) {
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
        url: publicUrl,
        title: title,
        created_at: new Date().toISOString()
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

  const addSeasonStat = async () => {
    if (!newSeasonStat.season || !newSeasonStat.competition || !newSeasonStat.club) {
      alert('Please fill in season, competition, and club')
      return
    }

    const { error } = await supabase
      .from('season_stats')
      .insert({
        player_id: profile.id,
        season: newSeasonStat.season,
        competition: newSeasonStat.competition,
        club: newSeasonStat.club,
        appearances: newSeasonStat.appearances,
        goals: newSeasonStat.goals,
        assists: newSeasonStat.assists,
        minutes_played: newSeasonStat.minutes_played,
        yellow_cards: newSeasonStat.yellow_cards,
        red_cards: newSeasonStat.red_cards,
        pass_accuracy: newSeasonStat.pass_accuracy,
        shot_accuracy: newSeasonStat.shot_accuracy
      })

    if (error) {
      alert('Error adding season stats: ' + error.message)
    } else {
      alert('Season stats added!')
      setNewSeasonStat({
        season: '', competition: '', club: '', appearances: 0, goals: 0, assists: 0,
        minutes_played: 0, yellow_cards: 0, red_cards: 0, pass_accuracy: 0, shot_accuracy: 0
      })
      fetchProfileData()
    }
  }

  const addCareerEntry = async () => {
    if (!newCareerEntry.club_name) {
      alert('Please enter club name')
      return
    }

    const { error } = await supabase
      .from('career_history')
      .insert({
        player_id: profile.id,
        club_name: newCareerEntry.club_name,
        league: newCareerEntry.league,
        country: newCareerEntry.country,
        start_date: newCareerEntry.start_date,
        end_date: newCareerEntry.is_current ? null : newCareerEntry.end_date,
        is_current: newCareerEntry.is_current,
        transfer_type: newCareerEntry.transfer_type,
        transfer_fee: newCareerEntry.transfer_fee ? parseFloat(newCareerEntry.transfer_fee) : null,
        appearances: newCareerEntry.appearances,
        goals: newCareerEntry.goals,
        assists: newCareerEntry.assists
      })

    if (error) {
      alert('Error adding career entry: ' + error.message)
    } else {
      alert('Career entry added!')
      setNewCareerEntry({
        club_name: '', league: '', country: '', start_date: '', end_date: '',
        is_current: false, transfer_type: 'Permanent', transfer_fee: '',
        appearances: 0, goals: 0, assists: 0
      })
      fetchProfileData()
    }
  }

  const deleteCareerEntry = async (id: string) => {
    if (!confirm('Delete this career entry?')) return

    const { error } = await supabase
      .from('career_history')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchProfileData()
    }
  }

  const deleteSeasonStat = async (id: string) => {
    if (!confirm('Delete this season stat?')) return

    const { error } = await supabase
      .from('season_stats')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchProfileData()
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
        date_of_birth: formData.date_of_birth,
        position: formData.position,
        nationality: formData.nationality,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
        preferred_foot: formData.preferred_foot,
        current_club: formData.current_club,
        current_club_since: formData.current_club_since,
        contract_until: formData.contract_until,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        agent_name: formData.agent_name,
        agent_contact: formData.agent_contact,
        market_value: formData.market_value ? parseFloat(formData.market_value) : null,
        bio: formData.bio,
        social_links: socialLinks,
        achievements: achievements,
        performance_ratings: performanceRatings
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
    <div className="max-w-7xl mx-auto">
      {/* Cover Photo Section */}
      <div className="relative">
        <div className="h-32 md:h-48 bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-t-2xl"></div>
        
        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-6 md:left-10">
          <div className="relative">
            {profile?.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.name}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <User className="w-10 h-10 text-red-600" />
              </div>
            )}
            <label
              htmlFor="profile-picture"
              className="absolute bottom-1 right-1 bg-red-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-red-700 transition shadow-lg"
            >
              <Camera className="w-3 h-3" />
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
                className="flex items-center gap-2 bg-gray-200 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-300 transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-red-700 transition"
              >
                <Save className="w-4 h-4" />
                Save All
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-white transition shadow-md"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Name */}
      <div className="bg-white rounded-b-2xl shadow-md pt-20 pb-4 px-6">
        {editing ? (
          <div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-2xl md:text-3xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-red-500 outline-none"
            />
          </div>
        ) : (
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile?.name}</h1>
        )}
        <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm flex-wrap">
          <MapPin className="w-4 h-4" />
          <span>{profile?.nationality || 'Location not set'}</span>
          <span className="mx-1">•</span>
          <Calendar className="w-4 h-4" />
          <span>Age {profile?.age || '?'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mt-4">
        <nav className="flex gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-1 font-medium text-sm transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 px-1 font-medium text-sm transition ${
              activeTab === 'stats'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Season Stats
          </button>
          <button
            onClick={() => setActiveTab('career')}
            className={`pb-3 px-1 font-medium text-sm transition ${
              activeTab === 'career'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Career History
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`pb-3 px-1 font-medium text-sm transition ${
              activeTab === 'media'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Media ({media.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {editing ? (
              <>
                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <select
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Select Position</option>
                        <option value="Forward">Forward</option>
                        <option value="Midfielder">Midfielder</option>
                        <option value="Defender">Defender</option>
                        <option value="Goalkeeper">Goalkeeper</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Foot</label>
                      <select
                        value={formData.preferred_foot}
                        onChange={(e) => setFormData({ ...formData, preferred_foot: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="Left">Left</option>
                        <option value="Right">Right</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
                      <input
                        type="number"
                        value={formData.jersey_number}
                        onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={formData.height_cm}
                        onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={formData.weight_kg}
                        onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Club Information */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Club Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Club</label>
                      <input
                        type="text"
                        value={formData.current_club}
                        onChange={(e) => setFormData({ ...formData, current_club: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g., Kaizer Chiefs"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Club Since</label>
                      <input
                        type="date"
                        value={formData.current_club_since}
                        onChange={(e) => setFormData({ ...formData, current_club_since: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contract Until</label>
                      <input
                        type="date"
                        value={formData.contract_until}
                        onChange={(e) => setFormData({ ...formData, contract_until: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Market Value (€)</label>
                      <input
                        type="number"
                        value={formData.market_value}
                        onChange={(e) => setFormData({ ...formData, market_value: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g., 500000"
                      />
                    </div>
                  </div>
                </div>

                {/* Agent Information */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Agent Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                      <input
                        type="text"
                        value={formData.agent_name}
                        onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent Contact</label>
                      <input
                        type="text"
                        value={formData.agent_contact}
                        onChange={(e) => setFormData({ ...formData, agent_contact: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Email or Phone"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links - Simplified without icons */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="text"
                        value={socialLinks.website}
                        onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Personal website URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                      <input
                        type="text"
                        value={socialLinks.youtube}
                        onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="YouTube URL"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Biography</h3>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Tell your story..."
                  />
                </div>

                {/* Achievements */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">🏆 Achievements</h3>
                  {achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm">{achievement}</span>
                      <button onClick={() => removeAchievement(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
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
                    <button onClick={addAchievement} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Performance Ratings */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Performance Ratings (1-100)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(performanceRatings).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-sm text-gray-600 capitalize flex justify-between">
                          {key} <span className="font-semibold text-red-600">{value}</span>
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
              </>
            ) : (
              // View mode
              <div className="space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Player Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Position</p>
                      <p className="font-medium">{profile?.position || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Preferred Foot</p>
                      <p className="font-medium">{profile?.preferred_foot || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Height/Weight</p>
                      <p className="font-medium">{profile?.height_cm ? `${profile.height_cm}cm` : '-'} / {profile?.weight_kg ? `${profile.weight_kg}kg` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Jersey Number</p>
                      <p className="font-medium">{profile?.jersey_number || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Club Info Card */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Club Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Current Club</p>
                      <p className="font-medium">{profile?.current_club || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Club Since</p>
                      <p className="font-medium">{profile?.current_club_since ? new Date(profile.current_club_since).getFullYear() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contract Until</p>
                      <p className="font-medium">{profile?.contract_until ? new Date(profile.contract_until).getFullYear() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Market Value</p>
                      <p className="font-medium">{profile?.market_value ? `€${(profile.market_value / 1000000).toFixed(1)}M` : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Agent Info Card */}
                {(profile?.agent_name || profile?.agent_contact) && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Agent Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Agent Name</p>
                        <p className="font-medium">{profile?.agent_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="font-medium">{profile?.agent_contact || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Achievements Display */}
                {achievements.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">🏆 Achievements</h3>
                    <div className="flex flex-wrap gap-2">
                      {achievements.map((achievement, idx) => (
                        <span key={idx} className="bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {achievement}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Ratings Display */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Performance Ratings</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(performanceRatings).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-600">{key}</span>
                          <span className="font-semibold text-red-600">{value}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Links Display - Simplified */}
                {(socialLinks.website || socialLinks.youtube) && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Links</h3>
                    <div className="flex flex-wrap gap-4">
                      {socialLinks.website && (
                        <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition">
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                      {socialLinks.youtube && (
                        <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-800 transition">
                          <div className="w-5 h-5 font-bold text-sm">YT</div>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Bio Display */}
                {profile?.bio && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Biography</h3>
                    <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Season Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Add Season Stat Form */}
            {editing && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Add Season Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Season (e.g., 2023-24)"
                    value={newSeasonStat.season}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, season: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Competition"
                    value={newSeasonStat.competition}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, competition: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Club"
                    value={newSeasonStat.club}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, club: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Appearances"
                    value={newSeasonStat.appearances}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, appearances: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Goals"
                    value={newSeasonStat.goals}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, goals: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Assists"
                    value={newSeasonStat.assists}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, assists: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Minutes Played"
                    value={newSeasonStat.minutes_played}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, minutes_played: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Yellow Cards"
                    value={newSeasonStat.yellow_cards}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, yellow_cards: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Red Cards"
                    value={newSeasonStat.red_cards}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, red_cards: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Pass Accuracy %"
                    value={newSeasonStat.pass_accuracy}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, pass_accuracy: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Shot Accuracy %"
                    value={newSeasonStat.shot_accuracy}
                    onChange={(e) => setNewSeasonStat({ ...newSeasonStat, shot_accuracy: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <button onClick={addSeasonStat} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Add Season Stats
                </button>
              </div>
            )}

            {/* Season Stats List */}
            {seasonStats.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
                No season statistics added yet.
              </div>
            ) : (
              seasonStats.map((stat) => (
                <div key={stat.id} className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-bold text-lg">{stat.season}</h3>
                      <p className="text-red-100 text-sm">{stat.competition} • {stat.club}</p>
                    </div>
                    {editing && (
                      <button onClick={() => deleteSeasonStat(stat.id)} className="text-white hover:text-red-200">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stat.appearances}</p>
                        <p className="text-xs text-gray-500">Appearances</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{stat.goals}</p>
                        <p className="text-xs text-gray-500">Goals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{stat.assists}</p>
                        <p className="text-xs text-gray-500">Assists</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stat.minutes_played}</p>
                        <p className="text-xs text-gray-500">Minutes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{stat.pass_accuracy}%</p>
                        <p className="text-xs text-gray-500">Pass Accuracy</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{stat.shot_accuracy}%</p>
                        <p className="text-xs text-gray-500">Shot Accuracy</p>
                      </div>
                    </div>
                    {(stat.yellow_cards > 0 || stat.red_cards > 0) && (
                      <div className="mt-4 pt-4 border-t flex gap-4 text-sm">
                        {stat.yellow_cards > 0 && <span className="text-yellow-600">🟨 {stat.yellow_cards} Yellow Cards</span>}
                        {stat.red_cards > 0 && <span className="text-red-600">🟥 {stat.red_cards} Red Cards</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Career History Tab */}
        {activeTab === 'career' && (
          <div className="space-y-6">
            {/* Add Career Entry Form */}
            {editing && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Add Career History</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Club Name *"
                    value={newCareerEntry.club_name}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, club_name: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="League"
                    value={newCareerEntry.league}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, league: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={newCareerEntry.country}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, country: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={newCareerEntry.start_date}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, start_date: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    value={newCareerEntry.end_date}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, end_date: e.target.value })}
                    disabled={newCareerEntry.is_current}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newCareerEntry.is_current}
                      onChange={(e) => setNewCareerEntry({ ...newCareerEntry, is_current: e.target.checked, end_date: '' })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Current Club</span>
                  </label>
                  <select
                    value={newCareerEntry.transfer_type}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, transfer_type: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="Permanent">Permanent Transfer</option>
                    <option value="Loan">Loan</option>
                    <option value="Free">Free Transfer</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Transfer Fee (€)"
                    value={newCareerEntry.transfer_fee}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, transfer_fee: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Appearances"
                    value={newCareerEntry.appearances}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, appearances: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Goals"
                    value={newCareerEntry.goals}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, goals: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Assists"
                    value={newCareerEntry.assists}
                    onChange={(e) => setNewCareerEntry({ ...newCareerEntry, assists: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <button onClick={addCareerEntry} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Add Career Entry
                </button>
              </div>
            )}

            {/* Career History List */}
            {careerHistory.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
                No career history added yet.
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                {careerHistory.map((entry, idx) => (
                  <div key={entry.id} className="relative flex gap-4 mb-8">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl z-10 shadow-md">
                      {entry.club_name.charAt(0)}
                    </div>
                    <div className="flex-1 bg-white rounded-xl shadow p-5">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{entry.club_name}</h3>
                          <p className="text-gray-500 text-sm">{entry.league} • {entry.country}</p>
                        </div>
                        {entry.is_current && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Current</span>
                        )}
                        {editing && (
                          <button onClick={() => deleteCareerEntry(entry.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        <span>📅 {new Date(entry.start_date).getFullYear()} - {entry.end_date ? new Date(entry.end_date).getFullYear() : 'Present'}</span>
                        <span>🔄 {entry.transfer_type}</span>
                        {entry.transfer_fee && <span>💰 €{(entry.transfer_fee / 1000000).toFixed(1)}M</span>}
                      </div>
                      <div className="flex gap-6 mt-4 pt-3 border-t">
                        <div><span className="font-bold text-gray-900">{entry.appearances}</span> <span className="text-gray-500 text-sm">Apps</span></div>
                        <div><span className="font-bold text-green-600">{entry.goals}</span> <span className="text-gray-500 text-sm">Goals</span></div>
                        <div><span className="font-bold text-blue-600">{entry.assists}</span> <span className="text-gray-500 text-sm">Assists</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {/* Upload Media */}
            {editing && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Upload Media</h3>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload image or video</p>
                    <p className="text-xs text-gray-400">Images: up to 5MB | Videos: up to 50MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {uploading && (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  </div>
                )}
              </div>
            )}

            {/* Media Gallery */}
            {media.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
                No media uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {media.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow overflow-hidden">
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.title} className="w-full h-48 object-cover" />
                    ) : (
                      <video src={item.url} controls className="w-full h-48 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                        {editing && (
                          <button onClick={() => handleDeleteMedia(item.id, item.url)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}