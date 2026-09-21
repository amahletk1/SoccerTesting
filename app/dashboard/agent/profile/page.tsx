
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Camera,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Save,
  Edit2,
  X,
  User,
  Briefcase,
  Users,
  Trophy,
  Award,
  Clock,
  FileText,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  UploadCloud,
  FileIcon,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

export default function AgentProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadingLicense, setUploadingLicense] = useState(false)
  const [editing, setEditing] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [stats, setStats] = useState({
    totalPlayers: 0,
    successfulDeals: 0,
    activeEngagements: 0,
    profileViews: 0,
  })

  const [formData, setFormData] = useState({
    name: '',
    agency: '',
    license_number: '',
    years_experience: '',
    phone: '',
    email: '',
    website: '',
    location: '',
    bio: '',
    specializations: [] as string[],
    languages: [] as string[],
  })

  const [newDocument, setNewDocument] = useState({
    type: 'license',
    description: '',
  })

  const [newSpecialization, setNewSpecialization] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAgentData()
  }, [])

  const fetchAgentData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!agent) {
      router.push('/dashboard')
      return
    }

    setProfile(agent)

    setFormData({
      name: agent.name || '',
      agency: agent.agency || '',
      license_number: agent.license_number || '',
      years_experience: agent.years_experience?.toString() || '',
      phone: agent.phone || '',
      email: agent.email || '',
      website: agent.website || '',
      location: agent.location || '',
      bio: agent.bio || '',
      specializations: agent.specializations || [],
      languages: agent.languages || [],
    })

    const { data: clientData } = await supabase
      .from('players')
      .select(
        'id, name, position, age, profile_picture, current_club'
      )
      .eq('agent_id', agent.id)
      .limit(5)

    if (clientData) {
      setClients(clientData)

      setStats((prev) => ({
        ...prev,
        totalPlayers: clientData.length,
      }))
    }

    const { data: docData } = await supabase
      .from('agent_documents')
      .select('*')
      .eq('agent_id', agent.id)
      .order('uploaded_at', { ascending: false })

    if (docData) {
      setDocuments(docData)
    }

    const { data: engagements } = await supabase
      .from('engagements')
      .select('status')
      .eq('agent_id', agent.id)

    if (engagements) {
      setStats((prev) => ({
        ...prev,
        activeEngagements: engagements.filter(
          (e) => e.status === 'pending'
        ).length,
        successfulDeals: engagements.filter(
          (e) => e.status === 'accepted'
        ).length,
      }))
    }

    setHasUnsavedChanges(false)
    setLoading(false)
  }

  const handleProfilePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file || !profile) return

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/profile.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('agent-profiles')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploading(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('agent-profiles')
      .getPublicUrl(fileName)

    await supabase
      .from('agents')
      .update({ profile_picture: publicUrl })
      .eq('id', profile.id)

    setProfile({
      ...profile,
      profile_picture: publicUrl,
    })

    alert('Profile picture updated!')
    setUploading(false)
  }

  const handleLicenseUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file || !profile) return

    setUploadingLicense(true)

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file')
      setUploadingLicense(false)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      setUploadingLicense(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/license-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('agent-documents')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploadingLicense(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('agent-documents')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('agents')
      .update({
        license_document_url: publicUrl,
      })
      .eq('id', profile.id)

    if (updateError) {
      alert(
        'Error saving license document: ' +
          updateError.message
      )
    } else {
      setProfile({
        ...profile,
        license_document_url: publicUrl,
      })

      alert(
        'License document uploaded! Awaiting verification.'
      )
    }

    setUploadingLicense(false)
  }

  const saveProfileData = async () => {
    const { error } = await supabase
      .from('agents')
      .update({
        name: formData.name,
        agency: formData.agency,
        license_number: formData.license_number,
        years_experience: formData.years_experience
          ? parseInt(formData.years_experience)
          : null,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        location: formData.location,
        bio: formData.bio,
        specializations: formData.specializations,
        languages: formData.languages,
      })
      .eq('id', profile.id)

    if (error) {
      alert('Error saving profile: ' + error.message)
      return false
    }

    return true
  }

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file || !profile) return

    if (hasUnsavedChanges) {
      const confirmSave = confirm(
        'You have unsaved changes. Save before uploading document?'
      )

      if (confirmSave) {
        const saved = await saveProfileData()

        if (!saved) {
          setUploadingDoc(false)
          return
        }

        setHasUnsavedChanges(false)
        alert('Profile saved! Now uploading document...')
      } else {
        setUploadingDoc(false)
        return
      }
    }

    setUploadingDoc(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/documents/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('agent-documents')
      .upload(fileName, file)

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploadingDoc(false)
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('agent-documents')
      .getPublicUrl(fileName)

    await supabase.from('agent_documents').insert({
      agent_id: profile.id,
      document_url: publicUrl,
      document_type: newDocument.type,
      description: newDocument.description,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
    })

    alert('Document uploaded! Pending verification.')

    setNewDocument({
      type: 'license',
      description: '',
    })

    const { data: docData } = await supabase
      .from('agent_documents')
      .select('*')
      .eq('agent_id', profile.id)
      .order('uploaded_at', {
        ascending: false,
      })

    if (docData) {
      setDocuments(docData)
    }

    setUploadingDoc(false)
  }

  const addSpecialization = () => {
    if (
      newSpecialization.trim() &&
      !formData.specializations.includes(
        newSpecialization.trim()
      )
    ) {
      setFormData({
        ...formData,
        specializations: [
          ...formData.specializations,
          newSpecialization.trim(),
        ],
      })

      setHasUnsavedChanges(true)
      setNewSpecialization('')
    }
  }

  const removeSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specializations:
        formData.specializations.filter(
          (s) => s !== spec
        ),
    })

    setHasUnsavedChanges(true)
  }

  const addLanguage = () => {
    if (
      newLanguage.trim() &&
      !formData.languages.includes(newLanguage.trim())
    ) {
      setFormData({
        ...formData,
        languages: [
          ...formData.languages,
          newLanguage.trim(),
        ],
      })

      setHasUnsavedChanges(true)
      setNewLanguage('')
    }
  }

  const removeLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(
        (l) => l !== lang
      ),
    })

    setHasUnsavedChanges(true)
  }

  const handleUpdateProfile = async () => {
    setLoading(true)

    const { error } = await supabase
      .from('agents')
      .update({
        name: formData.name,
        agency: formData.agency,
        license_number: formData.license_number,
        years_experience: formData.years_experience
          ? parseInt(formData.years_experience)
          : null,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        location: formData.location,
        bio: formData.bio,
        specializations: formData.specializations,
        languages: formData.languages,
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Update error:', error)
      alert('Error updating profile: ' + error.message)
    } else {
      console.log('Update successful!')
      setEditing(false)
      setHasUnsavedChanges(false)
      alert('Profile updated!')
      fetchAgentData()
    }

    setLoading(false)
  }

  const handleFormChange = (
    field: string,
    value: any
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    })

    setHasUnsavedChanges(true)
  }

  const getVerificationBadge = () => {
    const status =
      profile?.verification_status || 'pending'

    switch (status) {
      case 'verified':
        return {
          text: 'Verified Agent',
          color:
            'bg-green-50 text-green-700 border-green-200',
          icon: CheckCircle,
        }

      case 'rejected':
        return {
          text: 'Verification Rejected',
          color:
            'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
        }

      default:
        return {
          text: 'Verification Pending',
          color:
            'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertCircle,
        }
    }
  }

  const getDocumentStatusBadge = (
    status: string
  ) => {
    switch (status) {
      case 'verified':
        return {
          text: 'Verified',
          color:
            'bg-green-50 text-green-700 border-green-200',
        }

      case 'rejected':
        return {
          text: 'Rejected',
          color:
            'bg-red-50 text-red-700 border-red-200',
        }

      default:
        return {
          text: 'Pending',
          color:
            'bg-amber-50 text-amber-700 border-amber-200',
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-red-600 animate-spin" />
          </div>
          <p className="text-sm text-gray-500">
            Loading your profile...
          </p>
        </div>
      </div>
    )
  }

  const verificationBadge =
    getVerificationBadge()

  const VerificationIcon =
    verificationBadge.icon

  return (
    <div className="min-h-screen pb-12">
      {/* Page Heading */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span>Agent Dashboard</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                My Profile
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-950">
              My Agent Profile
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your professional identity and
              representation details.
            </p>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center justify-center gap-2 bg-gray-950 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Unsaved Changes */}
      {hasUnsavedChanges && editing && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>

            <div>
              <p className="text-sm font-semibold text-amber-900">
                Unsaved changes
              </p>
              <p className="text-xs text-amber-700">
                Save your profile before leaving this page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gray-950 shadow-sm">
        <div className="absolute inset-0">
          <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-red-600/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />

          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,.15)_25%,rgba(255,255,255,.15)_26%,transparent_26%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_51%,transparent_51%)] bg-[length:48px_48px]" />
        </div>

        <div className="relative px-6 py-7 md:px-8 md:py-9">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.name}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl">
                  <Building2 className="w-14 h-14 text-white/80" />
                </div>
              )}

              <label
                htmlFor="profile-picture"
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer border-4 border-gray-950 shadow-lg transition"
                title="Change profile picture"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
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

            {/* Identity */}
            <div className="min-w-0 flex-1 text-white">
              {editing ? (
                <div className="space-y-3 max-w-xl">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      handleFormChange(
                        'name',
                        e.target.value
                      )
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xl md:text-2xl font-bold text-white placeholder:text-white/40 outline-none focus:border-white/50"
                    placeholder="Full name"
                  />

                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) =>
                      handleFormChange(
                        'agency',
                        e.target.value
                      )
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/50"
                    placeholder="Agency name"
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                      {profile?.name ||
                        'Agent Name'}
                    </h2>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${verificationBadge.color}`}
                    >
                      <VerificationIcon className="w-3.5 h-3.5" />
                      {verificationBadge.text}
                    </span>
                  </div>

                  <p className="text-white/70 mt-2 text-base">
                    {profile?.agency ||
                      'Independent Football Agent'}
                  </p>
                </>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {profile?.location ||
                    'Location not set'}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {profile?.years_experience
                    ? `${profile.years_experience}+ years experience`
                    : 'Experience not set'}
                </span>

                {profile?.license_number && (
                  <span className="inline-flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Licensed
                  </span>
                )}
              </div>
            </div>

            {/* Editing actions */}
            {editing && (
              <div className="flex md:flex-col gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditing(false)
                    fetchAgentData()
                    setHasUnsavedChanges(false)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/10 transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>

                <button
                  onClick={handleUpdateProfile}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Save All
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
        {[
          {
            label: 'Players Represented',
            value: stats.totalPlayers,
            icon: Users,
            accent: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Successful Deals',
            value: stats.successfulDeals,
            icon: Trophy,
            accent: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Active Engagements',
            value: stats.activeEngagements,
            icon: Clock,
            accent: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Profile Views',
            value: stats.profileViews,
            icon: Eye,
            accent: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.label}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-gray-950">
                    {stat.value}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    {stat.label}
                  </p>
                </div>

                <div
                  className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <Icon
                    className={`w-5 h-5 ${stat.accent}`}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Contact */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-red-600" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-950">
                    Contact Information
                  </h3>
                  <p className="text-xs text-gray-500">
                    How clubs and players can reach you
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {[
                {
                  label: 'Email Address',
                  icon: Mail,
                  field: 'email',
                  type: 'email',
                  value: formData.email,
                  placeholder: 'agent@example.com',
                },
                {
                  label: 'Phone Number',
                  icon: Phone,
                  field: 'phone',
                  type: 'tel',
                  value: formData.phone,
                  placeholder: '+27 123 456 789',
                },
                {
                  label: 'Website',
                  icon: Globe,
                  field: 'website',
                  type: 'url',
                  value: formData.website,
                  placeholder: 'https://yourwebsite.com',
                },
                {
                  label: 'Location',
                  icon: MapPin,
                  field: 'location',
                  type: 'text',
                  value: formData.location,
                  placeholder:
                    'Johannesburg, South Africa',
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.field}>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </label>

                    {editing ? (
                      <input
                        type={item.type}
                        value={item.value}
                        onChange={(e) =>
                          handleFormChange(
                            item.field,
                            e.target.value
                          )
                        }
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition"
                        placeholder={item.placeholder}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-800 break-words">
                        {profile?.[item.field] ||
                          'Not set'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Professional */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-950">
                    Professional Details
                  </h3>
                  <p className="text-xs text-gray-500">
                    Licensing and experience
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  License Number
                </label>

                {editing ? (
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) =>
                      handleFormChange(
                        'license_number',
                        e.target.value
                      )
                    }
                    className="mt-2 w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    placeholder="FIFA Agent License Number"
                  />
                ) : (
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {profile?.license_number ||
                      'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Years of Experience
                </label>

                {editing ? (
                  <input
                    type="number"
                    min="0"
                    value={formData.years_experience}
                    onChange={(e) =>
                      handleFormChange(
                        'years_experience',
                        e.target.value
                      )
                    }
                    className="mt-2 w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    placeholder="e.g. 8"
                  />
                ) : (
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {profile?.years_experience
                      ? `${profile.years_experience} years`
                      : 'Not provided'}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <label
                  htmlFor="license-upload"
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 hover:border-red-300 hover:bg-red-50/50 cursor-pointer transition ${
                    uploadingLicense
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  }`}
                >
                  <UploadCloud className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {uploadingLicense
                      ? 'Uploading...'
                      : 'Upload License'}
                  </span>
                </label>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleLicenseUpload}
                  disabled={uploadingLicense}
                  className="hidden"
                  id="license-upload"
                />

                {profile?.license_document_url && (
                  <a
                    href={profile.license_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="w-4 h-4 text-blue-600" />
                      View license document
                    </span>

                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                  </a>
                )}

                <p className="text-[11px] text-gray-400 mt-2">
                  PDF, JPG or PNG · Maximum 10MB
                </p>
              </div>

              {profile?.license_verified && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />

                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      License verified
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Verified on{' '}
                      {new Date(
                        profile.license_verified_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Specializations */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <Award className="w-4 h-4 text-red-600" />
              </div>

              <div>
                <h3 className="font-bold text-gray-950">
                  Specializations
                </h3>
                <p className="text-xs text-gray-500">
                  Your areas of expertise
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.specializations.length === 0 &&
                !editing && (
                  <p className="text-sm text-gray-500">
                    No specializations added
                  </p>
                )}

              {formData.specializations.map(
                (spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-full text-xs font-semibold"
                  >
                    {spec}

                    {editing && (
                      <button
                        onClick={() =>
                          removeSpecialization(
                            spec
                          )
                        }
                        className="hover:text-red-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                )
              )}
            </div>

            {editing && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newSpecialization}
                  onChange={(e) =>
                    setNewSpecialization(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Contract Negotiations"
                  className="min-w-0 flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500"
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    addSpecialization()
                  }
                />

                <button
                  onClick={addSpecialization}
                  className="px-4 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>

              <div>
                <h3 className="font-bold text-gray-950">
                  Languages
                </h3>
                <p className="text-xs text-gray-500">
                  Languages you communicate in
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.languages.length === 0 &&
                !editing && (
                  <p className="text-sm text-gray-500">
                    No languages added
                  </p>
                )}

              {formData.languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-semibold"
                >
                  {lang}

                  {editing && (
                    <button
                      onClick={() =>
                        removeLanguage(lang)
                      }
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {editing && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) =>
                    setNewLanguage(e.target.value)
                  }
                  placeholder="e.g. English, Spanish"
                  className="min-w-0 flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500"
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    addLanguage()
                  }
                />

                <button
                  onClick={addLanguage}
                  className="px-4 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-2 space-y-5">
          {/* Biography */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-950">
                    Professional Biography
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tell clubs and players about your
                    experience
                  </p>
                </div>
              </div>

              <Sparkles className="w-5 h-5 text-red-500" />
            </div>

            <div className="p-5">
              {editing ? (
                <>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      handleFormChange(
                        'bio',
                        e.target.value
                      )
                    }
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 leading-relaxed outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 resize-y"
                    placeholder="Write about your agency, experience, successful deals, philosophy..."
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    Share your background, expertise and
                    approach to player representation.
                  </p>
                </>
              ) : (
                <div className="rounded-xl bg-gray-50 p-5">
                  <p className="text-sm md:text-base text-gray-700 leading-7 whitespace-pre-line">
                    {profile?.bio ||
                      'No professional biography has been added yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Clients */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-950">
                    Clients Represented
                  </h3>
                  <p className="text-xs text-gray-500">
                    Players currently connected to your
                    profile
                  </p>
                </div>
              </div>

              {clients.length > 0 && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {clients.length}
                </span>
              )}
            </div>

            <div className="p-5">
              {clients.length > 0 ? (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition"
                    >
                      {client.profile_picture ? (
                        <img
                          src={client.profile_picture}
                          alt={client.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-950 truncate">
                          {client.name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {client.position ||
                            'Position not set'}
                          <span className="mx-1.5">
                            •
                          </span>
                          {client.current_club ||
                            'Free Agent'}
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/players/${client.id}`}
                        className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                      >
                        View Profile
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 rounded-xl bg-gray-50">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">
                    No clients yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Players you represent will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-950">
                    Verification Documents
                  </h3>
                  <p className="text-xs text-gray-500">
                    Documents submitted for verification
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 md:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      Document Type
                    </label>

                    <select
                      value={newDocument.type}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          type: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500"
                      disabled={uploadingDoc}
                    >
                      <option value="license">
                        License Certificate
                      </option>
                      <option value="id">
                        ID/Passport
                      </option>
                      <option value="certificate">
                        Business Certificate
                      </option>
                      <option value="other">
                        Other Document
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      Description
                    </label>

                    <input
                      type="text"
                      value={newDocument.description}
                      onChange={(e) =>
                        setNewDocument({
                          ...newDocument,
                          description:
                            e.target.value,
                        })
                      }
                      placeholder="Optional description"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500"
                      disabled={uploadingDoc}
                    />
                  </div>
                </div>

                <label className="mt-4 flex flex-col items-center justify-center min-h-32 border-2 border-dashed border-gray-300 rounded-xl bg-white hover:border-red-300 hover:bg-red-50/30 cursor-pointer transition">
                  <UploadCloud className="w-7 h-7 text-gray-400 mb-2" />

                  <p className="text-sm font-semibold text-gray-700">
                    {uploadingDoc
                      ? 'Uploading document...'
                      : 'Click to upload document'}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    PDF, JPG or PNG · Maximum 10MB
                  </p>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    disabled={uploadingDoc}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-5">
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />

                    <p className="text-sm font-semibold text-gray-700">
                      No documents uploaded
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Your verification documents will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const docStatus =
                        getDocumentStatusBadge(
                          doc.status
                        )

                      return (
                        <div
                          key={doc.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                              <FileIcon className="w-4 h-4 text-gray-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 capitalize truncate">
                                {doc.document_type}
                              </p>

                              {doc.description && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {doc.description}
                                </p>
                              )}

                              <p className="text-[11px] text-gray-400 mt-1">
                                {new Date(
                                  doc.uploaded_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex self-start sm:self-auto items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${docStatus.color}`}
                          >
                            {docStatus.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile save bar while editing */}
      {editing && (
        <div className="fixed bottom-4 left-4 right-4 md:hidden z-40">
          <div className="bg-gray-950 rounded-2xl p-2 shadow-2xl flex gap-2">
            <button
              onClick={() => {
                setEditing(false)
                fetchAgentData()
                setHasUnsavedChanges(false)
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

            <button
              onClick={handleUpdateProfile}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              Save All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

