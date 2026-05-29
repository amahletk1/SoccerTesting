'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Camera, Building2, Phone, Mail, Globe, MapPin, 
  Save, Edit2, X, User, Briefcase, Users, Trophy, 
  Award, Clock, FileText, Eye, Shield, CheckCircle, 
  XCircle, AlertCircle, UploadCloud, FileIcon
} from 'lucide-react'

export default function AgentProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [editing, setEditing] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [stats, setStats] = useState({
    totalPlayers: 0,
    successfulDeals: 0,
    activeEngagements: 0,
    profileViews: 0
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
    languages: [] as string[]
  })

  const [newDocument, setNewDocument] = useState({ type: 'license', description: '' })
  const [newSpecialization, setNewSpecialization] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAgentData()
  }, [])

  const fetchAgentData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
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
      languages: agent.languages || []
    })

    // Get clients
    const { data: clientData } = await supabase
      .from('players')
      .select('id, name, position, age, profile_picture, current_club')
      .eq('agent_id', agent.id)
      .limit(5)
    
    if (clientData) {
      setClients(clientData)
      setStats(prev => ({ ...prev, totalPlayers: clientData.length }))
    }

    // Get documents
    const { data: docData } = await supabase
      .from('agent_documents')
      .select('*')
      .eq('agent_id', agent.id)
      .order('uploaded_at', { ascending: false })
    
    if (docData) setDocuments(docData)

    // Get engagement stats
    const { data: engagements } = await supabase
      .from('engagements')
      .select('status')
      .eq('agent_id', agent.id)
    
    if (engagements) {
      setStats(prev => ({ 
        ...prev, 
        activeEngagements: engagements.filter(e => e.status === 'pending').length,
        successfulDeals: engagements.filter(e => e.status === 'accepted').length
      }))
    }

    setHasUnsavedChanges(false)
    setLoading(false)
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const { data: { publicUrl } } = supabase.storage
      .from('agent-profiles')
      .getPublicUrl(fileName)

    await supabase
      .from('agents')
      .update({ profile_picture: publicUrl })
      .eq('id', profile.id)

    setProfile({ ...profile, profile_picture: publicUrl })
    alert('Profile picture updated!')
    setUploading(false)
  }

  const saveProfileData = async () => {
    const { error } = await supabase
      .from('agents')
      .update({
        name: formData.name,
        agency: formData.agency,
        license_number: formData.license_number,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        location: formData.location,
        bio: formData.bio,
        specializations: formData.specializations,
        languages: formData.languages
      })
      .eq('id', profile.id)

    if (error) {
      alert('Error saving profile: ' + error.message)
      return false
    }
    return true
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmSave = confirm('You have unsaved changes. Save before uploading document?')
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

    const { data: { publicUrl } } = supabase.storage
      .from('agent-documents')
      .getPublicUrl(fileName)

    await supabase
      .from('agent_documents')
      .insert({
        agent_id: profile.id,
        document_url: publicUrl,
        document_type: newDocument.type,
        description: newDocument.description,
        status: 'pending',
        uploaded_at: new Date().toISOString()
      })

    alert('Document uploaded! Pending verification.')
    setNewDocument({ type: 'license', description: '' })
    
    // Refresh documents list without resetting form
    const { data: docData } = await supabase
      .from('agent_documents')
      .select('*')
      .eq('agent_id', profile.id)
      .order('uploaded_at', { ascending: false })
    
    if (docData) setDocuments(docData)
    
    setUploadingDoc(false)
  }

  const addSpecialization = () => {
    if (newSpecialization.trim() && !formData.specializations.includes(newSpecialization.trim())) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, newSpecialization.trim()]
      })
      setHasUnsavedChanges(true)
      setNewSpecialization('')
    }
  }

  const removeSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter(s => s !== spec)
    })
    setHasUnsavedChanges(true)
  }

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage.trim()]
      })
      setHasUnsavedChanges(true)
      setNewLanguage('')
    }
  }

  const removeLanguage = (lang: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter(l => l !== lang)
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
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        location: formData.location,
        bio: formData.bio,
        specializations: formData.specializations,
        languages: formData.languages
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

  const handleFormChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    setHasUnsavedChanges(true)
  }

  const getVerificationBadge = () => {
    const status = profile?.verification_status || 'pending'
    switch (status) {
      case 'verified': return { text: 'Verified', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'rejected': return { text: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
      default: return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle }
    }
  }

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return { text: 'Verified', color: 'bg-green-100 text-green-700' }
      case 'rejected': return { text: 'Rejected', color: 'bg-red-100 text-red-700' }
      default: return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const verificationBadge = getVerificationBadge()
  const VerificationIcon = verificationBadge.icon

  return (
    <div className="max-w-7xl mx-auto">
      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && editing && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4 rounded">
          <p className="text-sm text-yellow-700">You have unsaved changes. Click "Save All" to save your changes.</p>
        </div>
      )}

      {/* Header */}
      <div className="relative">
        <div className="h-32 md:h-40 bg-gradient-to-r from-blue-600 via-black to-red-600 rounded-t-2xl"></div>
        
        <div className="absolute -bottom-12 left-6 md:left-8">
          <div className="relative">
            {profile?.profile_picture ? (
              <img src={profile.profile_picture} alt={profile.name} className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <Building2 className="w-12 h-12 text-blue-600" />
              </div>
            )}
            <label htmlFor="profile-picture" className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
              <Camera className="w-3 h-3" />
            </label>
            <input id="profile-picture" type="file" accept="image/*" onChange={handleProfilePictureUpload} disabled={uploading} className="hidden" />
          </div>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          {editing ? (
            <>
              <button onClick={() => {
                setEditing(false)
                fetchAgentData()
                setHasUnsavedChanges(false)
              }} className="flex items-center gap-2 bg-gray-200 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-300 transition">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleUpdateProfile} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-700 transition">
                <Save className="w-4 h-4" /> Save All
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 hover:bg-white transition shadow-md">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Agent Info */}
      <div className="bg-white rounded-b-2xl shadow-md pt-16 pb-4 px-6">
        {editing ? (
          <div className="space-y-2">
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => handleFormChange('name', e.target.value)} 
              className="text-2xl md:text-3xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-blue-500 outline-none w-full" 
              placeholder="Your Name" 
            />
            <input 
              type="text" 
              value={formData.agency} 
              onChange={(e) => handleFormChange('agency', e.target.value)} 
              className="text-lg text-gray-600 border-b-2 border-gray-200 focus:border-blue-500 outline-none w-full" 
              placeholder="Agency Name" 
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile?.name || 'Agent Name'}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${verificationBadge.color}`}>
                <VerificationIcon className="w-3 h-3" />
                {verificationBadge.text}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{profile?.agency || 'Independent Agent'}</p>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm flex-wrap">
          <MapPin className="w-4 h-4" />
          <span>{profile?.location || 'Location not set'}</span>
          <span className="mx-1">•</span>
          <Briefcase className="w-4 h-4" />
          <span>{profile?.years_experience ? `${profile.years_experience}+ years` : 'Experience not set'}</span>
          {profile?.license_number && (
            <>
              <span className="mx-1">•</span>
              <Shield className="w-4 h-4" />
              <span>License: {profile.license_number}</span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow p-4 text-center border-b-4 border-blue-500">
          <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</p>
          <p className="text-xs text-gray-500">Players Represented</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center border-b-4 border-green-500">
          <Trophy className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.successfulDeals}</p>
          <p className="text-xs text-gray-500">Successful Deals</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center border-b-4 border-yellow-500">
          <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.activeEngagements}</p>
          <p className="text-xs text-gray-500">Active Engagements</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center border-b-4 border-purple-500">
          <Eye className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.profileViews}</p>
          <p className="text-xs text-gray-500">Profile Views</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                {editing ? (
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => handleFormChange('email', e.target.value)} 
                    className="flex-1 px-2 py-1 border rounded" 
                    placeholder="Email"
                  />
                ) : (
                  <span className="text-gray-700">{profile?.email || 'Not set'}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                {editing ? (
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => handleFormChange('phone', e.target.value)} 
                    className="flex-1 px-2 py-1 border rounded" 
                    placeholder="Phone"
                  />
                ) : (
                  <span className="text-gray-700">{profile?.phone || 'Not set'}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-400" />
                {editing ? (
                  <input 
                    type="url" 
                    value={formData.website} 
                    onChange={(e) => handleFormChange('website', e.target.value)} 
                    className="flex-1 px-2 py-1 border rounded" 
                    placeholder="Website"
                  />
                ) : (
                  <span className="text-gray-700">{profile?.website || 'Not set'}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                {editing ? (
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => handleFormChange('location', e.target.value)} 
                    className="flex-1 px-2 py-1 border rounded" 
                    placeholder="Location (e.g., Johannesburg, SA)"
                  />
                ) : (
                  <span className="text-gray-700">{profile?.location || 'Location not set'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information (License & Experience) */}
          {editing && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Professional Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input 
                    type="text" 
                    value={formData.license_number} 
                    onChange={(e) => handleFormChange('license_number', e.target.value)} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    placeholder="License Number" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input 
                    type="number" 
                    value={formData.years_experience} 
                    onChange={(e) => handleFormChange('years_experience', e.target.value)} 
                    className="w-full px-3 py-2 border rounded-lg" 
                    placeholder="Years of Experience" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Specializations */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              Specializations
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.specializations.map((spec) => (
                <span key={spec} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {spec}
                  {editing && <button onClick={() => removeSpecialization(spec)} className="hover:text-red-600"><X className="w-3 h-3" /></button>}
                </span>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  value={newSpecialization} 
                  onChange={(e) => setNewSpecialization(e.target.value)} 
                  placeholder="Add specialization" 
                  className="flex-1 px-3 py-2 border rounded-lg text-sm" 
                  onKeyPress={(e) => e.key === 'Enter' && addSpecialization()} 
                />
                <button onClick={addSpecialization} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm">Add</button>
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" />
              Languages
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.languages.map((lang) => (
                <span key={lang} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {lang}
                  {editing && <button onClick={() => removeLanguage(lang)} className="hover:text-red-600"><X className="w-3 h-3" /></button>}
                </span>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  value={newLanguage} 
                  onChange={(e) => setNewLanguage(e.target.value)} 
                  placeholder="Add language" 
                  className="flex-1 px-3 py-2 border rounded-lg text-sm" 
                  onKeyPress={(e) => e.key === 'Enter' && addLanguage()} 
                />
                <button onClick={addLanguage} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm">Add</button>
              </div>
            )}
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Verification Documents
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <select 
                value={newDocument.type} 
                onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg mb-2" 
                disabled={uploadingDoc}
              >
                <option value="license">License Certificate</option>
                <option value="id">ID/Passport</option>
                <option value="certificate">Business Certificate</option>
                <option value="other">Other Document</option>
              </select>
              <input 
                type="text" 
                value={newDocument.description} 
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })} 
                placeholder="Description (optional)" 
                className="w-full px-3 py-2 border rounded-lg mb-2" 
                disabled={uploadingDoc} 
              />
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Click to upload document</p>
                </div>
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png" 
                  onChange={handleDocumentUpload} 
                  disabled={uploadingDoc} 
                  className="hidden" 
                />
              </label>
              {uploadingDoc && (
                <div className="mt-2 text-center text-sm text-blue-600">Uploading...</div>
              )}
            </div>

            {documents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const docStatus = getDocumentStatusBadge(doc.status)
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileIcon className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 capitalize">{doc.document_type}</p>
                          <p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${docStatus.color}`}>{docStatus.text}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Biography
            </h3>
            {editing ? (
              <textarea 
                value={formData.bio} 
                onChange={(e) => handleFormChange('bio', e.target.value)} 
                rows={5} 
                className="w-full px-3 py-2 border rounded-lg" 
                placeholder="Tell about your agency..." 
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">{profile?.bio || 'No bio added yet.'}</p>
            )}
          </div>

          {/* Clients */}
          {clients.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Clients Represented
              </h3>
              <div className="space-y-3">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {client.profile_picture ? (
                      <img src={client.profile_picture} alt={client.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.position} • {client.current_club || 'Free Agent'}</p>
                    </div>
                    <Link href={`/dashboard/players/${client.id}`} className="text-blue-600 hover:underline text-sm">View Profile</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}