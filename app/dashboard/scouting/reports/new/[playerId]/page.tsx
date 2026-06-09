'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, Target, Zap, Shield, Activity,
  Heart, Eye, Award, CheckCircle, XCircle, Send, Building2, X
} from 'lucide-react'

interface CreateReportPageProps {
  params: Promise<{ playerId: string }>
}

export default function CreateScoutingReportPage({ params }: CreateReportPageProps) {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [scoutId, setScoutId] = useState<string | null>(null)
  const [scoutName, setScoutName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Agent selection modal
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [recommendMessage, setRecommendMessage] = useState('')
  const [savedReportId, setSavedReportId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    speed_rating: 5,
    shooting_rating: 5,
    passing_rating: 5,
    dribbling_rating: 5,
    defending_rating: 5,
    physical_rating: 5,
    overall_rating: 5,
    recommendation: 'monitor_further',
    strengths: '',
    weaknesses: '',
    notes: ''
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const unwrapParams = async () => {
      const { playerId } = await params
      setPlayerId(playerId)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (playerId) {
      fetchData()
    }
  }, [playerId])

  const fetchData = async () => {
    setLoading(true)
    
    // Get scout profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    const { data: scout } = await supabase
      .from('scouts')
      .select('id, name')
      .eq('user_id', user.id)
      .single()
    
    if (!scout) {
      router.push('/dashboard/scout')
      return
    }
    
    setScoutId(scout.id)
    setScoutName(scout.name || 'A scout')
    
    // Get player details
    const { data: playerData } = await supabase
      .from('players')
      .select('name, position, age, nationality, profile_picture')
      .eq('id', playerId)
      .single()
    
    setPlayer(playerData)
    
    // Fetch agents for selection
    const { data: agentsData } = await supabase
      .from('agents')
      .select('id, name, agency, specializations')
      .eq('verification_status', 'verified')
      .limit(30)
    
    if (agentsData) setAgents(agentsData)
    
    setLoading(false)
  }

  const handleRatingChange = (field: string, value: number) => {
    setFormData({ ...formData, [field]: value })
    
    if (['speed_rating', 'shooting_rating', 'passing_rating', 'dribbling_rating', 'defending_rating', 'physical_rating'].includes(field)) {
      const avg = Math.round(
        (formData.speed_rating + 
         formData.shooting_rating + 
         formData.passing_rating + 
         formData.dribbling_rating + 
         formData.defending_rating + 
         formData.physical_rating) / 6
      )
      setFormData(prev => ({ ...prev, overall_rating: avg }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    // Save the scouting report
    const { data: report, error: insertError } = await supabase
      .from('scouting_reports')
      .insert({
        scout_id: scoutId,
        player_id: playerId,
        speed_rating: formData.speed_rating,
        shooting_rating: formData.shooting_rating,
        passing_rating: formData.passing_rating,
        dribbling_rating: formData.dribbling_rating,
        defending_rating: formData.defending_rating,
        physical_rating: formData.physical_rating,
        overall_rating: formData.overall_rating,
        recommendation: formData.recommendation,
        strengths: formData.strengths,
        weaknesses: formData.weaknesses,
        notes: formData.notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSavedReportId(report.id)
    
    // Show agent selection modal instead of sending to all agents
    setShowAgentModal(true)
    setSaving(false)
  }

  const sendRecommendations = async () => {
    if (!savedReportId || selectedAgents.length === 0) return
    
    setSaving(true)
    
    const recommendationLabel = getRecommendationLabel(formData.recommendation)
    let successCount = 0
    
    for (const agentId of selectedAgents) {
      // Get agent details
      const { data: agent } = await supabase
        .from('agents')
        .select('id, name, email, user_id')
        .eq('id', agentId)
        .single()
      
      if (agent) {
        // Create email notification
        await supabase
          .from('email_notifications')
          .insert({
            user_id: agent.user_id,
            recipient_email: agent.email,
            recipient_type: 'agent',
            subject: `🔍 New Scouting Report: ${player?.name}`,
            message: `Dear ${agent.name},\n\nScout ${scoutName} has just completed a scouting report on ${player?.name} (${player?.position}).\n\n📊 Overall Rating: ${formData.overall_rating}/10\n💡 Recommendation: ${recommendationLabel}\n\nScout's Note: ${recommendMessage || 'No additional notes'}\n\nLog in to your dashboard to view the full report and consider engaging this player.\n\nBest regards,\nPlayerFynder Team`,
            status: 'pending',
            created_at: new Date().toISOString()
          })
        
        // Create scout recommendation
        await supabase
          .from('scout_recommendations')
          .insert({
            scout_id: scoutId,
            agent_id: agent.id,
            player_id: playerId,
            report_id: savedReportId,
            message: recommendMessage || `I recommend ${player?.name} (Rating: ${formData.overall_rating}/10) - ${recommendationLabel}`,
            status: 'pending',
            created_at: new Date().toISOString()
          })
        
        successCount++
      }
    }
    
    alert(`Scouting report saved! Recommended to ${successCount} agent(s).`)
    setShowAgentModal(false)
    setSelectedAgents([])
    setRecommendMessage('')
    router.push('/dashboard/scouting/reports')
    setSaving(false)
  }

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId))
    } else {
      setSelectedAgents([...selectedAgents, agentId])
    }
  }

  const skipRecommendation = () => {
    alert('Scouting report saved! You can recommend to agents later from your reports page.')
    router.push('/dashboard/scouting/reports')
    setShowAgentModal(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/dashboard/players/${playerId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Player Profile
        </Link>
      </div>

      {/* Player Info Card */}
      <div className="bg-gradient-to-r from-red-600 via-black to-blue-600 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center gap-4">
          {player?.profile_picture ? (
            <img src={player.profile_picture} alt={player.name} className="w-16 h-16 rounded-full object-cover border-2 border-white" />
          ) : (
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">Scouting Report: {player?.name}</h1>
            <p className="text-white/80">{player?.position} • Age {player?.age} • {player?.nationality || 'N/A'}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ratings Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Player Ratings (1-10)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Speed</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.speed_rating}
                  onChange={(e) => handleRatingChange('speed_rating', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-lg">{formData.speed_rating}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shooting</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.shooting_rating}
                  onChange={(e) => handleRatingChange('shooting_rating', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-lg">{formData.shooting_rating}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passing</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.passing_rating}
                  onChange={(e) => handleRatingChange('passing_rating', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-lg">{formData.passing_rating}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dribbling</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.dribbling_rating}
                  onChange={(e) => handleRatingChange('dribbling_rating', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-lg">{formData.dribbling_rating}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Defending</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.defending_rating}
                  onChange={(e) => handleRatingChange('defending_rating', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-lg">{formData.defending_rating}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Physical</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.physical_rating}
                  onChange={(e) => handleRatingChange('physical_rating', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold text-lg">{formData.physical_rating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Overall Assessment
          </h2>
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="10"
                  strokeDasharray={`${(formData.overall_rating / 10) * 251.2} 251.2`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-yellow-600">{formData.overall_rating}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Overall Rating</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'sign_immediately', label: 'Sign Immediately', color: 'green' },
                { value: 'trial_recommended', label: 'Trial Recommended', color: 'blue' },
                { value: 'monitor_further', label: 'Monitor Further', color: 'yellow' },
                { value: 'not_recommended', label: 'Not Recommended', color: 'red' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, recommendation: option.value })}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                    formData.recommendation === option.value
                      ? `bg-${option.color}-600 text-white border-${option.color}-600`
                      : `bg-white text-gray-700 border-gray-300 hover:border-${option.color}-500`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Scouting Notes
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Strengths</label>
              <textarea
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Excellent pace, Strong aerial ability, Good positional awareness..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weaknesses</label>
              <textarea
                value={formData.weaknesses}
                onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Needs to improve weak foot, Decision making under pressure..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Any other observations, potential, areas for development..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/dashboard/players/${playerId}`}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Report'}
          </button>
        </div>
      </form>

      {/* Agent Selection Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Recommend Player to Agents</h2>
                <button 
                  onClick={skipRecommendation}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Player</p>
                <p className="font-semibold text-lg">{player?.name}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-yellow-600 font-semibold">Rating: {formData.overall_rating}/10</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-green-600">{getRecommendationLabel(formData.recommendation)}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message to Agents (Optional)</label>
                <textarea
                  value={recommendMessage}
                  onChange={(e) => setRecommendMessage(e.target.value)}
                  placeholder="Add a personal note about why this player is worth considering..."
                  className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Agents ({selectedAgents.length} selected)
                </label>
                <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
                  {agents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No verified agents available</div>
                  ) : (
                    agents.map((agent) => (
                      <label key={agent.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => toggleAgent(agent.id)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          <p className="text-sm text-gray-500">{agent.agency || 'Independent Agent'}</p>
                        </div>
                        {agent.specializations && agent.specializations.length > 0 && (
                          <div className="flex gap-1">
                            {agent.specializations.slice(0, 2).map((spec: string) => (
                              <span key={spec} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={skipRecommendation}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Skip (Save without recommending)
              </button>
              <button
                onClick={sendRecommendations}
                disabled={selectedAgents.length === 0 || saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {saving ? 'Sending...' : `Send to ${selectedAgents.length} Agent(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}