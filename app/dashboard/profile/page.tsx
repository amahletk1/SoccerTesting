'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Camera,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Save,
  Edit2,
  X,
  Video,
  Upload,
  Trash2,
  User,
  CheckCircle,
  Plus,
  Trash,
  Briefcase,
  FileText,
} from 'lucide-react'

// All countries list
const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
  'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain',
  'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
]

const positions = [
  'Forward',
  'False 9',
  'Winger',
  'Midfielder',
  'Defender',
  'Goalkeeper'
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [seasonStats, setSeasonStats] = useState<any[]>([])
  const [careerHistory, setCareerHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [savingSection, setSavingSection] = useState<string | null>(null)

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
    bio: '',
    highest_level_played: '',
    national_team_representation: '',
    transfermarkt_url: '',
    scouting_platform_links: [] as string[],
    agent_history: '',
    trials_history: '',
    cv_url: '',
    video_highlight_url: ''
  })

  const [achievements, setAchievements] = useState<string[]>([])
  const [newAchievement, setNewAchievement] = useState('')

  const [performanceRatings, setPerformanceRatings] = useState({
    pace: 85,
    shooting: 82,
    passing: 78,
    dribbling: 88,
    defending: 45,
    physical: 80
  })

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

  const [newCareerEntry, setNewCareerEntry] = useState({
    club_name: '',
    league: '',
    country: '',
    start_date: '',
    end_date: '',
    is_current: false,
    transfer_type: 'permanent',
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
      bio: player.bio || '',
      highest_level_played: player.highest_level_played || '',
      national_team_representation: player.national_team_representation || '',
      transfermarkt_url: player.transfermarkt_url || '',
      scouting_platform_links: player.scouting_platform_links || [],
      agent_history: player.agent_history || '',
      trials_history: player.trials_history || '',
      cv_url: player.cv_url || '',
      video_highlight_url: player.video_highlight_url || ''
    })

    if (player.achievements && Array.isArray(player.achievements)) {
      setAchievements(player.achievements)
    }

    if (player.performance_ratings) {
      setPerformanceRatings(player.performance_ratings)
    }

    const { data: seasonData } = await supabase
      .from('season_stats')
      .select('*')
      .eq('player_id', player.id)
      .order('season', { ascending: false })

    if (seasonData) setSeasonStats(seasonData)

    const { data: careerData } = await supabase
      .from('career_history')
      .select('*')
      .eq('player_id', player.id)
      .order('start_date', { ascending: false })

    if (careerData) setCareerHistory(careerData)

    const { data: mediaData } = await supabase
      .from('media')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })

    if (mediaData) setMedia(mediaData)

    setLoading(false)
  }

  const handleProfilePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const handleCVUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file || !profile) return

    setUploadingCV(true)

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or DOCX file')
      setUploadingCV(false)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      setUploadingCV(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/cv.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('player-documents')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploadingCV(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('player-documents')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('players')
      .update({ cv_url: publicUrl })
      .eq('id', profile.id)

    if (updateError) {
      alert('Error saving CV: ' + updateError.message)
    } else {
      setFormData({ ...formData, cv_url: publicUrl })
      alert('CV uploaded successfully!')
    }

    setUploadingCV(false)
  }

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file || !profile) return

    setUploading(true)

    const maxSize = file.type.startsWith('video')
      ? 50 * 1024 * 1024
      : 5 * 1024 * 1024

    if (file.size > maxSize) {
      alert(
        `File size must be less than ${
          maxSize / (1024 * 1024)
        }MB`
      )
      setUploading(false)
      return
    }

    const title = prompt(
      'Enter a title for this media:',
      'Highlight'
    )

    if (!title) {
      setUploading(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`
    const fileType = file.type.startsWith('video')
      ? 'video'
      : 'image'

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

  const handleDeleteMedia = async (
    mediaId: string,
    mediaUrl: string
  ) => {
    if (!confirm('Delete this media?')) return

    const urlParts = mediaUrl.split('/')
    const filePath = urlParts
      .slice(urlParts.indexOf('player-media') + 1)
      .join('/')

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

  const saveBasicInfo = async () => {
    setSavingSection('basic')

    const dateOfBirth =
      formData.date_of_birth &&
      formData.date_of_birth.trim() !== ''
        ? formData.date_of_birth
        : null

    const { error } = await supabase
      .from('players')
      .update({
        name: formData.name || null,
        date_of_birth: dateOfBirth,
        position: formData.position || null,
        nationality: formData.nationality || null,
        height_cm: formData.height_cm
          ? parseFloat(formData.height_cm)
          : null,
        weight_kg: formData.weight_kg
          ? parseInt(formData.weight_kg)
          : null,
        preferred_foot: formData.preferred_foot || null,
        jersey_number: formData.jersey_number
          ? parseInt(formData.jersey_number)
          : null,
        highest_level_played:
          formData.highest_level_played || null,
        national_team_representation:
          formData.national_team_representation || null,
        transfermarkt_url:
          formData.transfermarkt_url || null,
        scouting_platform_links:
          formData.scouting_platform_links || [],
        agent_history:
          formData.agent_history || null,
        trials_history:
          formData.trials_history || null,
        video_highlight_url:
          formData.video_highlight_url || null,
      })
      .eq('id', profile.id)

    if (error) {
      alert('Error saving basic info: ' + error.message)
    } else {
      alert('Basic information saved!')
      fetchProfileData()
    }

    setSavingSection(null)
  }

  const saveClubInfo = async () => {
    setSavingSection('club')

    const clubSince =
      formData.current_club_since &&
      formData.current_club_since.trim() !== ''
        ? formData.current_club_since
        : null

    const contractUntil =
      formData.contract_until &&
      formData.contract_until.trim() !== ''
        ? formData.contract_until
        : null

    const { error } = await supabase
      .from('players')
      .update({
        current_club: formData.current_club || null,
        current_club_since: clubSince,
        contract_until: contractUntil,
        market_value: formData.market_value
          ? parseFloat(formData.market_value)
          : null,
      })
      .eq('id', profile.id)

    if (error) {
      alert('Error saving club info: ' + error.message)
    } else {
      alert('Club information saved!')
      fetchProfileData()
    }

    setSavingSection(null)
  }

  const saveAgentInfo = async () => {
    setSavingSection('agent')

    const { error } = await supabase
      .from('players')
      .update({
        agent_name: formData.agent_name || null,
        agent_contact: formData.agent_contact || null,
      })
      .eq('id', profile.id)

    if (error) {
      alert('Error saving agent info: ' + error.message)
    } else {
      alert('Agent information saved!')
      fetchProfileData()
    }

    setSavingSection(null)
  }

  const saveBio = async () => {
    setSavingSection('bio')

    const { error } = await supabase
      .from('players')
      .update({
        bio: formData.bio || null,
      })
      .eq('id', profile.id)

    if (error) {
      alert('Error saving bio: ' + error.message)
    } else {
      alert('Bio saved!')
      fetchProfileData()
    }

    setSavingSection(null)
  }

  const saveAchievements = async () => {
    setSavingSection('achievements')

    const { error } = await supabase
      .from('players')
      .update({
        achievements: achievements,
      })
      .eq('id', profile.id)

    if (error) {
      alert('Error saving achievements: ' + error.message)
    } else {
      alert('Achievements saved!')
      fetchProfileData()
    }

    setSavingSection(null)
  }

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([
        ...achievements,
        newAchievement.trim()
      ])
      setNewAchievement('')
    }
  }

  const removeAchievement = (index: number) => {
    setAchievements(
      achievements.filter((_, i) => i !== index)
    )
  }

  const addSeasonStat = async () => {
    if (
      !newSeasonStat.season ||
      !newSeasonStat.competition ||
      !newSeasonStat.club
    ) {
      alert(
        'Please fill in season, competition, and club'
      )
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
        start_date: newCareerEntry.start_date || null,
        end_date: newCareerEntry.is_current
          ? null
          : (newCareerEntry.end_date || null),
        is_current: newCareerEntry.is_current,
        transfer_type: newCareerEntry.transfer_type,
        transfer_fee: newCareerEntry.transfer_fee
          ? parseFloat(newCareerEntry.transfer_fee)
          : null,
        appearances: newCareerEntry.appearances,
        goals: newCareerEntry.goals,
        assists: newCareerEntry.assists
      })

    if (error) {
      alert('Error adding career entry: ' + error.message)
    } else {
      alert('Career entry added!')

      setNewCareerEntry({
        club_name: '',
        league: '',
        country: '',
        start_date: '',
        end_date: '',
        is_current: false,
        transfer_type: 'permanent',
        transfer_fee: '',
        appearances: 0,
        goals: 0,
        assists: 0
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

  const handleFormChange = (
    field: string,
    value: any
  ) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#070b09]">
        <div className="text-center">
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Loading your profile...
          </p>
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-white/[0.08] bg-[#080d0a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10'

  const labelClass =
    'mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500'

  const cardClass =
    'rounded-2xl border border-white/[0.07] bg-[#0b100d] shadow-[0_18px_50px_rgba(0,0,0,0.18)]'

  const sectionHeaderClass =
    'flex flex-col gap-3 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between'

  const saveButton = (section: string, handler: () => void) => (
    <button
      onClick={handler}
      disabled={savingSection === section}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-[#061009] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="h-4 w-4" />
      {savingSection === section
        ? 'Saving...'
        : 'Save Section'}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#070b09] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
        <div className="absolute right-0 top-[30%] h-[420px] w-[420px] rounded-full bg-amber-400/[0.035] blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 lg:px-6 lg:py-6">

        {/* ================= HERO ================= */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b100d] shadow-2xl">

          <div className="relative h-40 overflow-hidden sm:h-52 lg:h-60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,.30),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(245,158,11,.16),transparent_25%),linear-gradient(115deg,#07100b,#101812,#060908)]" />

            <div className="absolute inset-0 opacity-20">
              <div className="absolute -right-20 top-10 h-48 w-48 rounded-full border border-emerald-400/30" />
              <div className="absolute right-8 top-0 h-64 w-64 rounded-full border border-emerald-400/10" />
            </div>

            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b100d] to-transparent" />

            <div className="absolute right-4 top-4">
              {editing ? (
                <button
                  onClick={() => {
                    setEditing(false)
                    fetchProfileData()
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-black/60"
                >
                  <X className="h-4 w-4" />
                  Done Editing
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:border-emerald-400/30 hover:bg-black/60"
                >
                  <Edit2 className="h-4 w-4 text-emerald-400" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end">

              <div className="relative shrink-0">
                {profile?.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={profile.name}
                    className="h-28 w-28 rounded-2xl border-4 border-[#0b100d] object-cover shadow-2xl sm:h-36 sm:w-36"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-[#0b100d] bg-[#111914] shadow-2xl sm:h-36 sm:w-36">
                    <User className="h-12 w-12 text-emerald-400" />
                  </div>
                )}

                <label
                  htmlFor="profile-picture"
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-4 border-[#0b100d] bg-emerald-500 text-[#061009] shadow-lg transition hover:bg-emerald-400"
                >
                  <Camera className="h-4 w-4" />
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

              <div className="min-w-0 flex-1 pb-1">
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value
                      })
                    }
                    className="w-full border-b border-white/10 bg-transparent py-1 text-2xl font-black tracking-tight text-white outline-none focus:border-emerald-500 sm:text-3xl"
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                      {profile?.name}
                    </h1>

                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      Player
                    </span>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                    {profile?.nationality || 'Location not set'}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-400" />
                    Age {profile?.age || '?'}
                  </span>

                  {profile?.position && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-semibold text-slate-300">
                      {profile.position}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABS ================= */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d]">
          <nav className="flex overflow-x-auto">
            {[
              ['profile', 'Profile'],
              ['stats', 'Season Stats'],
              ['career', 'Career History'],
              ['media', `Media (${media.length})`]
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`relative whitespace-nowrap px-5 py-4 text-xs font-bold transition sm:px-7 ${
                  activeTab === value
                    ? 'text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}

                {activeTab === value && (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.7)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="py-5 sm:py-6">

          {/* ================= PROFILE ================= */}
          {activeTab === 'profile' && (
            <div className="space-y-5">

              {editing ? (
                <>
                  {/* BASIC INFORMATION */}
                  <div className={cardClass}>
                    <div className={sectionHeaderClass}>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          Basic Information
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          Core player profile details
                        </p>
                      </div>
                      {saveButton('basic', saveBasicInfo)}
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name: e.target.value
                            })
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Date of Birth</label>
                        <input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              date_of_birth: e.target.value
                            })
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Position</label>
                        <select
                          value={formData.position}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              position: e.target.value
                            })
                          }
                          className={inputClass}
                        >
                          <option value="">Select Position</option>
                          {positions.map(pos => (
                            <option key={pos} value={pos}>
                              {pos}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Preferred Foot</label>
                        <select
                          value={formData.preferred_foot}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              preferred_foot: e.target.value
                            })
                          }
                          className={inputClass}
                        >
                          <option value="Left">Left</option>
                          <option value="Right">Right</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Nationality</label>
                        <select
                          value={formData.nationality}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nationality: e.target.value
                            })
                          }
                          className={inputClass}
                        >
                          <option value="">Select Nationality</option>
                          {countries.map(country => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Jersey Number</label>
                        <input
                          type="number"
                          value={formData.jersey_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              jersey_number: e.target.value
                            })
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Height (meters)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={
                            formData.height_cm
                              ? (
                                  parseFloat(formData.height_cm) / 100
                                ).toFixed(2)
                              : ''
                          }
                          onChange={(e) => {
                            const meters = parseFloat(e.target.value)
                            const cm = meters * 100

                            setFormData({
                              ...formData,
                              height_cm: cm.toString()
                            })
                          }}
                          className={inputClass}
                          placeholder="1.85"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={formData.weight_kg}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              weight_kg: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="75"
                        />
                      </div>
                    </div>
                  </div>

                  {/* APPLICATION DETAILS */}
                  <div className={cardClass}>
                    <div className="border-b border-white/[0.06] px-5 py-5">
                      <h3 className="text-base font-bold text-white">
                        Player Application Details
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Scouting and professional background
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          Highest Level Played
                        </label>
                        <input
                          type="text"
                          value={formData.highest_level_played}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              highest_level_played: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="e.g., Professional, Semi-Pro, Amateur"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          National Team Representation
                        </label>
                        <input
                          type="text"
                          value={
                            formData.national_team_representation
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              national_team_representation:
                                e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="e.g., South Africa U23, 5 caps"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Transfermarkt Profile URL
                        </label>
                        <input
                          type="url"
                          value={formData.transfermarkt_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              transfermarkt_url: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="https://www.transfermarkt.com/..."
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Agent History
                        </label>
                        <input
                          type="text"
                          value={formData.agent_history}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              agent_history: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="Previous agency representation"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          History of Trials Abroad
                        </label>
                        <input
                          type="text"
                          value={formData.trials_history}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              trials_history: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="e.g., Club X, Country, Year"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Video Highlight URL
                        </label>
                        <input
                          type="url"
                          value={formData.video_highlight_url}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              video_highlight_url: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="YouTube, Vimeo, or other video link"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className={labelClass}>
                          Upload CV
                        </label>

                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="file"
                            accept=".pdf,.docx"
                            onChange={handleCVUpload}
                            disabled={uploadingCV}
                            className="hidden"
                            id="cv-upload"
                          />

                          <label
                            htmlFor="cv-upload"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.05] px-4 py-3 text-xs font-semibold text-emerald-400 transition hover:border-emerald-500/50 hover:bg-emerald-500/10"
                          >
                            <FileText className="h-4 w-4" />
                            {uploadingCV
                              ? 'Uploading...'
                              : 'Choose CV'}
                          </label>

                          {formData.cv_url && (
                            <a
                              href={formData.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                            >
                              View Uploaded CV →
                            </a>
                          )}
                        </div>

                        <p className="mt-2 text-[11px] text-slate-600">
                          PDF or DOCX · Maximum 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CLUB */}
                  <div className={cardClass}>
                    <div className={sectionHeaderClass}>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          Club Information
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          Current club and contract details
                        </p>
                      </div>
                      {saveButton('club', saveClubInfo)}
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          Current Club
                        </label>
                        <input
                          type="text"
                          value={formData.current_club}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              current_club: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="e.g., Kaizer Chiefs"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Club Since
                        </label>
                        <input
                          type="date"
                          value={formData.current_club_since}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              current_club_since: e.target.value
                            })
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Contract Until
                        </label>
                        <input
                          type="date"
                          value={formData.contract_until}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contract_until: e.target.value
                            })
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Market Value (€)
                        </label>
                        <input
                          type="number"
                          value={formData.market_value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              market_value: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="e.g., 500000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AGENT */}
                  <div className={cardClass}>
                    <div className={sectionHeaderClass}>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          Agent Information
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          Representation details
                        </p>
                      </div>
                      {saveButton('agent', saveAgentInfo)}
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          Agent Name
                        </label>
                        <input
                          type="text"
                          value={formData.agent_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              agent_name: e.target.value
                            })
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Agent Contact
                        </label>
                        <input
                          type="text"
                          value={formData.agent_contact}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              agent_contact: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder="Email or Phone"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BIO */}
                  <div className={cardClass}>
                    <div className={sectionHeaderClass}>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          Biography
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          Tell scouts about your journey
                        </p>
                      </div>
                      {saveButton('bio', saveBio)}
                    </div>

                    <div className="p-5">
                      <textarea
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bio: e.target.value
                          })
                        }
                        rows={5}
                        className={`${inputClass} resize-none`}
                        placeholder="Tell your story..."
                      />
                    </div>
                  </div>

                  {/* ACHIEVEMENTS */}
                  <div className={cardClass}>
                    <div className={sectionHeaderClass}>
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-bold text-white">
                          <Award className="h-5 w-5 text-amber-400" />
                          Achievements
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          Showcase your biggest accomplishments
                        </p>
                      </div>
                      {saveButton(
                        'achievements',
                        saveAchievements
                      )}
                    </div>

                    <div className="p-5">
                      <div className="space-y-2">
                        {achievements.map(
                          (achievement, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#080d0a] p-3"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                                <Award className="h-4 w-4 text-amber-400" />
                              </div>

                              <span className="flex-1 text-sm text-slate-300">
                                {achievement}
                              </span>

                              <button
                                onClick={() =>
                                  removeAchievement(idx)
                                }
                                className="rounded-lg p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          value={newAchievement}
                          onChange={(e) =>
                            setNewAchievement(e.target.value)
                          }
                          placeholder="Add achievement..."
                          className={inputClass}
                        />

                        <button
                          onClick={addAchievement}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-[#061009] transition hover:bg-emerald-400"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* PLAYER INFORMATION */}
                  <div className={cardClass}>
                    <div className="border-b border-white/[0.06] px-5 py-5">
                      <h3 className="text-base font-bold text-white">
                        Player Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-white/[0.05] md:grid-cols-4">
                      {[
                        ['Position', profile?.position],
                        ['Preferred Foot', profile?.preferred_foot],
                        [
                          'Height',
                          profile?.height_cm
                            ? `${(
                                profile.height_cm / 100
                              ).toFixed(2)}m`
                            : '-'
                        ],
                        [
                          'Weight',
                          profile?.weight_kg
                            ? `${profile.weight_kg}kg`
                            : '-'
                        ],
                        [
                          'Jersey Number',
                          profile?.jersey_number
                        ],
                        [
                          'Highest Level',
                          profile?.highest_level_played
                        ],
                        [
                          'National Team',
                          profile?.national_team_representation
                        ],
                        [
                          'Agent History',
                          profile?.agent_history
                        ]
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="bg-[#0b100d] p-4"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-200">
                            {value || '-'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {profile?.transfermarkt_url && (
                      <div className="border-t border-white/[0.06] p-5">
                        <p className={labelClass}>
                          Transfermarkt Profile
                        </p>

                        <a
                          href={profile.transfermarkt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-sm font-medium text-emerald-400 hover:text-emerald-300"
                        >
                          {profile.transfermarkt_url}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* PERFORMANCE */}
                  <div className={cardClass}>
                    <div className="border-b border-white/[0.06] px-5 py-5">
                      <h3 className="text-base font-bold text-white">
                        Performance Ratings
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Current player assessment
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(
                        performanceRatings
                      ).map(([key, value]) => (
                        <div key={key}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold capitalize text-slate-400">
                              {key}
                            </span>

                            <span className="text-sm font-black text-emerald-400">
                              {value}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300"
                              style={{
                                width: `${value}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CLUB */}
                  <div className={cardClass}>
                    <div className="border-b border-white/[0.06] px-5 py-5">
                      <h3 className="text-base font-bold text-white">
                        Club Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-white/[0.05] md:grid-cols-4">
                      {[
                        ['Current Club', profile?.current_club],
                        [
                          'Club Since',
                          profile?.current_club_since
                            ? new Date(
                                profile.current_club_since
                              ).getFullYear()
                            : '-'
                        ],
                        [
                          'Contract Until',
                          profile?.contract_until
                            ? new Date(
                                profile.contract_until
                              ).getFullYear()
                            : '-'
                        ],
                        [
                          'Market Value',
                          profile?.market_value
                            ? `€${(
                                profile.market_value / 1000000
                              ).toFixed(1)}M`
                            : '-'
                        ]
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="bg-[#0b100d] p-4"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            {label}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-200">
                            {value || '-'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AGENT */}
                  {(profile?.agent_name ||
                    profile?.agent_contact) && (
                    <div className={cardClass}>
                      <div className="border-b border-white/[0.06] px-5 py-5">
                        <h3 className="text-base font-bold text-white">
                          Agent Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                        <div>
                          <p className={labelClass}>
                            Agent Name
                          </p>
                          <p className="text-sm font-semibold text-slate-200">
                            {profile?.agent_name || '-'}
                          </p>
                        </div>

                        <div>
                          <p className={labelClass}>
                            Contact
                          </p>
                          <p className="text-sm font-semibold text-slate-200">
                            {profile?.agent_contact || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACHIEVEMENTS */}
                  {achievements.length > 0 && (
                    <div className={cardClass}>
                      <div className="border-b border-white/[0.06] px-5 py-5">
                        <h3 className="flex items-center gap-2 text-base font-bold text-white">
                          <Award className="h-5 w-5 text-amber-400" />
                          Achievements
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2 p-5">
                        {achievements.map(
                          (achievement, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/[0.06] px-3 py-2 text-xs font-semibold text-amber-300"
                            >
                              <Award className="h-3.5 w-3.5" />
                              {achievement}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* BIO */}
                  {profile?.bio && (
                    <div className={cardClass}>
                      <div className="border-b border-white/[0.06] px-5 py-5">
                        <h3 className="text-base font-bold text-white">
                          Biography
                        </h3>
                      </div>

                      <div className="p-5">
                        <p className="text-sm leading-7 text-slate-400">
                          {profile.bio}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CV */}
                  {profile?.cv_url && (
                    <div className={cardClass}>
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                            <FileText className="h-5 w-5 text-emerald-400" />
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Player CV
                            </h3>
                            <p className="mt-1 text-xs text-slate-600">
                              Professional player document
                            </p>
                          </div>
                        </div>

                        <a
                          href={profile.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/10"
                        >
                          <FileText className="h-4 w-4" />
                          View CV
                        </a>
                      </div>
                    </div>
                  )}

                  {/* VIDEO */}
                  {profile?.video_highlight_url && (
                    <div className={cardClass}>
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10">
                            <Video className="h-5 w-5 text-amber-400" />
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-white">
                              Video Highlights
                            </h3>
                            <p className="mt-1 text-xs text-slate-600">
                              Player highlight reel
                            </p>
                          </div>
                        </div>

                        <a
                          href={profile.video_highlight_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-400/10"
                        >
                          <Video className="h-4 w-4" />
                          Watch Highlights
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ================= SEASON STATS ================= */}
          {activeTab === 'stats' && (
            <div className="space-y-5">

              {editing && (
                <div className={cardClass}>
                  <div className="border-b border-white/[0.06] px-5 py-5">
                    <h3 className="text-base font-bold text-white">
                      Add Season Statistics
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
                    {[
                      ['season', 'Season', 'text', '2023/2024'],
                      ['competition', 'Competition', 'text', 'Premier League'],
                      ['club', 'Club', 'text', 'Club name']
                    ].map(([field, label, type, placeholder]) => (
                      <div key={field}>
                        <label className={labelClass}>
                          {label} *
                        </label>

                        <input
                          type={type}
                          value={(newSeasonStat as any)[field]}
                          onChange={(e) =>
                            setNewSeasonStat({
                              ...newSeasonStat,
                              [field]: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}

                    {[
                      ['appearances', 'Appearances'],
                      ['goals', 'Goals'],
                      ['assists', 'Assists'],
                      ['minutes_played', 'Minutes Played'],
                      ['yellow_cards', 'Yellow Cards'],
                      ['red_cards', 'Red Cards'],
                      ['pass_accuracy', 'Pass Accuracy (%)'],
                      ['shot_accuracy', 'Shot Accuracy (%)']
                    ].map(([field, label]) => (
                      <div key={field}>
                        <label className={labelClass}>
                          {label}
                        </label>

                        <input
                          type="number"
                          value={(newSeasonStat as any)[field]}
                          onChange={(e) =>
                            setNewSeasonStat({
                              ...newSeasonStat,
                              [field]: parseInt(
                                e.target.value
                              )
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      onClick={addSeasonStat}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-[#061009] transition hover:bg-emerald-400"
                    >
                      <Plus className="h-4 w-4" />
                      Add Season Stats
                    </button>
                  </div>
                </div>
              )}

              {seasonStats.length === 0 ? (
                <div className={`${cardClass} p-12 text-center`}>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <TrendingUp className="h-7 w-7 text-emerald-400" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-400">
                    No season statistics added yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {seasonStats.map(stat => (
                    <div
                      key={stat.id}
                      className={cardClass}
                    >
                      <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-black text-emerald-400">
                              {stat.season}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-slate-400">
                            {stat.competition}
                            {stat.club && ` • ${stat.club}`}
                          </p>
                        </div>

                        {editing && (
                          <button
                            onClick={() =>
                              deleteSeasonStat(stat.id)
                            }
                            className="self-start rounded-xl p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-px bg-white/[0.05] sm:grid-cols-3 lg:grid-cols-6">
                        {[
                          ['Appearances', stat.appearances, 'text-white'],
                          ['Goals', stat.goals, 'text-emerald-400'],
                          ['Assists', stat.assists, 'text-sky-400'],
                          ['Minutes', stat.minutes_played, 'text-white'],
                          ['Pass Accuracy', `${stat.pass_accuracy}%`, 'text-amber-400'],
                          ['Shot Accuracy', `${stat.shot_accuracy}%`, 'text-purple-400']
                        ].map(([label, value, color]) => (
                          <div
                            key={label}
                            className="bg-[#0b100d] p-5 text-center"
                          >
                            <p className={`text-2xl font-black ${color}`}>
                              {value}
                            </p>

                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= CAREER ================= */}
          {activeTab === 'career' && (
            <div className="space-y-5">

              {editing && (
                <div className={cardClass}>
                  <div className="border-b border-white/[0.06] px-5 py-5">
                    <h3 className="text-base font-bold text-white">
                      Add Career History
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                    {[
                      ['club_name', 'Club Name', 'e.g., Kaizer Chiefs'],
                      ['league', 'League', 'e.g., DStv Premiership'],
                      ['country', 'Country', 'e.g., South Africa']
                    ].map(([field, label, placeholder]) => (
                      <div key={field}>
                        <label className={labelClass}>
                          {label}
                          {field === 'club_name' && ' *'}
                        </label>

                        <input
                          type="text"
                          value={(newCareerEntry as any)[field]}
                          onChange={(e) =>
                            setNewCareerEntry({
                              ...newCareerEntry,
                              [field]: e.target.value
                            })
                          }
                          className={inputClass}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}

                    <div>
                      <label className={labelClass}>
                        Start Date
                      </label>

                      <input
                        type="date"
                        value={newCareerEntry.start_date}
                        onChange={(e) =>
                          setNewCareerEntry({
                            ...newCareerEntry,
                            start_date: e.target.value
                          })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        End Date
                      </label>

                      <input
                        type="date"
                        value={newCareerEntry.end_date}
                        onChange={(e) =>
                          setNewCareerEntry({
                            ...newCareerEntry,
                            end_date: e.target.value
                          })
                        }
                        disabled={newCareerEntry.is_current}
                        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-40`}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Transfer Type
                      </label>

                      <select
                        value={newCareerEntry.transfer_type}
                        onChange={(e) =>
                          setNewCareerEntry({
                            ...newCareerEntry,
                            transfer_type: e.target.value
                          })
                        }
                        className={inputClass}
                      >
                        <option value="permanent">
                          Permanent Transfer
                        </option>
                        <option value="loan">Loan</option>
                        <option value="free">Free Transfer</option>
                        <option value="youth">Youth Academy</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Transfer Fee (€)
                      </label>

                      <input
                        type="number"
                        value={newCareerEntry.transfer_fee}
                        onChange={(e) =>
                          setNewCareerEntry({
                            ...newCareerEntry,
                            transfer_fee: e.target.value
                          })
                        }
                        className={inputClass}
                        placeholder="e.g., 5000000"
                      />
                    </div>

                    {[
                      ['appearances', 'Appearances'],
                      ['goals', 'Goals'],
                      ['assists', 'Assists']
                    ].map(([field, label]) => (
                      <div key={field}>
                        <label className={labelClass}>
                          {label}
                        </label>

                        <input
                          type="number"
                          value={(newCareerEntry as any)[field]}
                          onChange={(e) =>
                            setNewCareerEntry({
                              ...newCareerEntry,
                              [field]: parseInt(
                                e.target.value
                              )
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-[#080d0a] p-4">
                      <input
                        type="checkbox"
                        id="is_current"
                        checked={newCareerEntry.is_current}
                        onChange={(e) =>
                          setNewCareerEntry({
                            ...newCareerEntry,
                            is_current: e.target.checked,
                            end_date: ''
                          })
                        }
                        className="h-4 w-4 accent-emerald-500"
                      />

                      <span className="text-sm font-semibold text-slate-300">
                        Current Club
                      </span>
                    </label>
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      onClick={addCareerEntry}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-[#061009] transition hover:bg-emerald-400"
                    >
                      <Plus className="h-4 w-4" />
                      Add Career Entry
                    </button>
                  </div>
                </div>
              )}

              {careerHistory.length === 0 ? (
                <div className={`${cardClass} p-12 text-center`}>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10">
                    <Briefcase className="h-7 w-7 text-amber-400" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-400">
                    No career history added yet
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute bottom-5 left-[22px] top-5 w-px bg-gradient-to-b from-emerald-500/50 via-white/10 to-transparent" />

                  <div className="space-y-5">
                    {careerHistory.map(
                      (entry, index) => (
                        <div
                          key={entry.id}
                          className="relative pl-12"
                        >
                          <div className="absolute left-3 top-6 flex h-5 w-5 items-center justify-center rounded-full border-4 border-[#070b09] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,.35)]" />

                          <div className={cardClass}>
                            <div className="p-5">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-black text-white">
                                      {entry.club_name}
                                    </h3>

                                    {entry.is_current && (
                                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                        Current
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {entry.league &&
                                      `${entry.league} • `}
                                    {entry.country}
                                  </p>

                                  <p className="mt-2 text-xs font-semibold text-slate-600">
                                    {entry.start_date &&
                                      new Date(
                                        entry.start_date
                                      ).getFullYear()}{' '}
                                    -
                                    {' '}
                                    {entry.is_current
                                      ? 'Present'
                                      : entry.end_date
                                        ? new Date(
                                            entry.end_date
                                          ).getFullYear()
                                        : ''}
                                  </p>
                                </div>

                                {editing && (
                                  <button
                                    onClick={() =>
                                      deleteCareerEntry(
                                        entry.id
                                      )
                                    }
                                    className="self-start rounded-xl p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                {entry.appearances > 0 && (
                                  <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs font-semibold text-slate-400">
                                    {entry.appearances} apps
                                  </span>
                                )}

                                {entry.goals > 0 && (
                                  <span className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2 text-xs font-semibold text-emerald-400">
                                    {entry.goals} goals
                                  </span>
                                )}

                                {entry.assists > 0 && (
                                  <span className="rounded-lg border border-sky-500/10 bg-sky-500/[0.04] px-3 py-2 text-xs font-semibold text-sky-400">
                                    {entry.assists} assists
                                  </span>
                                )}

                                {entry.transfer_fee &&
                                  entry.transfer_fee > 0 && (
                                    <span className="rounded-lg border border-amber-500/10 bg-amber-500/[0.04] px-3 py-2 text-xs font-semibold text-amber-400">
                                      €
                                      {(
                                        entry.transfer_fee /
                                        1000000
                                      ).toFixed(1)}
                                      M
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= MEDIA ================= */}
          {activeTab === 'media' && (
            <div className="space-y-5">

              {editing && (
                <div className={cardClass}>
                  <div className="p-5">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-white">
                        Upload Media
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Add images or video highlights to your profile
                      </p>
                    </div>

                    <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-[#080d0a] px-5 text-center transition hover:border-emerald-500/30 hover:bg-emerald-500/[0.02]">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                        <Upload className="h-5 w-5 text-emerald-400" />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-300">
                        Click to upload image or video
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Images up to 5MB · Videos up to 50MB
                      </p>

                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>

                    {uploading && (
                      <div className="mt-4 text-center text-xs font-semibold text-emerald-400">
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {media.length === 0 ? (
                <div className={`${cardClass} p-12 text-center`}>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <Video className="h-7 w-7 text-emerald-400" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-400">
                    No media uploaded yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {media.map(item => (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b100d] shadow-xl"
                    >
                      <div className="relative overflow-hidden bg-black">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <video
                            src={item.url}
                            controls
                            className="h-52 w-full object-cover"
                          />
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-bold text-white">
                              {item.title}
                            </h4>

                            <p className="mt-1 text-[11px] text-slate-600">
                              {new Date(
                                item.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          {editing && (
                            <button
                              onClick={() =>
                                handleDeleteMedia(
                                  item.id,
                                  item.url
                                )
                              }
                              className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
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
    </div>
  )
}