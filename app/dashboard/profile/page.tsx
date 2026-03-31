'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, Video, Image, Trash2 } from 'lucide-react'

export default function PlayerProfilePage() {
  const [player, setPlayer] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    position: '',
    nationality: '',
    height_cm: '',
    weight_kg: ''
  })
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

    // Fetch player profile
    const { data: playerData } = await supabase
      .from('players')
      .select('*, player_stats(*)')
      .eq('user_id', user.id)
      .single()

    if (playerData) {
      setPlayer(playerData)
      setFormData({
        name: playerData.name || '',
        age: playerData.age?.toString() || '',
        position: playerData.position || '',
        nationality: playerData.nationality || '',
        height_cm: playerData.height_cm?.toString() || '',
        weight_kg: playerData.weight_kg?.toString() || ''
      })

      // Fetch player media
      const { data: mediaData } = await supabase
        .from('media')
        .select('*')
        .eq('player_id', playerData.id)
        .order('created_at', { ascending: false })

      if (mediaData) setMedia(mediaData)
    }

    setLoading(false)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('players')
      .update({
        name: formData.name,
        age: parseInt(formData.age),
        position: formData.position,
        nationality: formData.nationality,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null
      })
      .eq('id', player.id)

    if (error) {
      alert('Error updating profile: ' + error.message)
    } else {
      alert('Profile updated!')
    }
    setLoading(false)
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !player) return

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${player.id}/${Date.now()}.${fileExt}`
    const fileType = file.type.startsWith('video') ? 'video' : 'image'

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('player-media')
      .upload(fileName, file)

    if (uploadError) {
      alert('Upload error: ' + uploadError.message)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('player-media')
      .getPublicUrl(fileName)

    // Save to media table
    const { error: dbError } = await supabase
      .from('media')
      .insert({
        player_id: player.id,
        type: fileType,
        url: publicUrl
      })

    if (dbError) {
      alert('Error saving media: ' + dbError.message)
    } else {
      alert('Media uploaded!')
      fetchPlayerData() // Refresh media list
    }

    setUploading(false)
  }

  const handleDeleteMedia = async (mediaId: string, mediaUrl: string) => {
    if (!confirm('Delete this media?')) return

    // Extract file path from URL
    const urlParts = mediaUrl.split('/')
    const filePath = urlParts.slice(urlParts.indexOf('player-media') + 1).join('/')

    // Delete from storage
    await supabase.storage
      .from('player-media')
      .remove([filePath])

    // Delete from database
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)

    if (error) {
      alert('Error deleting: ' + error.message)
    } else {
      alert('Deleted!')
      fetchPlayerData()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
      <p className="text-gray-600 mb-8">Manage your football profile and highlight reels</p>

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Select Position</option>
                <option value="Forward">Forward</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Defender">Defender</option>
                <option value="Goalkeeper">Goalkeeper</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nationality</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (kg)</label>
              <input
                type="number"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Update Profile
          </button>
        </form>
      </div>

      {/* Media Upload */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Highlight Reels & Photos</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Upload videos or images of your gameplay</p>
          <p className="text-sm text-gray-500 mb-4">MP4, MOV, JPG, PNG (Max 50MB)</p>
          <input
            type="file"
            accept="video/*,image/*"
            onChange={handleMediaUpload}
            disabled={uploading}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer"
          >
            {uploading ? 'Uploading...' : 'Upload Media'}
          </label>
        </div>
      </div>

      {/* Media Gallery */}
      {media.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">My Media ({media.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item) => (
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
                <button
                  onClick={() => handleDeleteMedia(item.id, item.url)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {item.type === 'video' ? <Video className="w-3 h-3 inline mr-1" /> : <Image className="w-3 h-3 inline mr-1" />}
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}