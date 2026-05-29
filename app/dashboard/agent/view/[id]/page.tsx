'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Briefcase, MapPin, Phone, Mail, Globe, 
  Award, Clock, CheckCircle, MessageSquare, Star,
  Building2, Shield, User
} from 'lucide-react'

interface AgentViewPageProps {
  params: Promise<{ id: string }>
}

export default function AgentViewPage({ params }: AgentViewPageProps) {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params
      setAgentId(id)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (agentId) {
      fetchAgentData()
      fetchCurrentPlayer()
    }
  }, [agentId])

  const fetchCurrentPlayer = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (player) setCurrentPlayerId(player.id)
    }
  }

  const fetchAgentData = async () => {
    if (!agentId) return
    
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()
    
    setAgent(agentData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Agent not found</p>
        <Link href="/dashboard/agents" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Agents Directory
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <Link href="/dashboard/agents" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Agents Directory
      </Link>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-800 to-indigo-900"></div>
        
        {/* Profile Section */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-center gap-4 -mt-12">
            {/* Avatar with Profile Picture */}
            <div className="bg-white rounded-full p-1 shadow-lg">
              {agent.profile_picture ? (
                <img 
                  src={agent.profile_picture} 
                  alt={agent.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-blue-600" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
                {agent.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-gray-500">{agent.agency || 'Independent Agent'}</p>
              <div className="flex flex-wrap gap-3 mt-1 justify-center md:justify-start text-sm text-gray-500">
                {agent.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {agent.location}
                  </span>
                )}
                {agent.years_experience && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {agent.years_experience} years
                  </span>
                )}
              </div>
            </div>
            
            {/* Message Button */}
            {currentPlayerId && (
              <Link
                href={`/dashboard/player/messages?agent=${agent.id}`}
                className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Message Agent
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-500" />
              Contact
            </h2>
            <div className="space-y-2 text-sm">
              {agent.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{agent.email}</span>
                </div>
              )}
              {agent.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{agent.phone}</span>
                </div>
              )}
              {agent.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={agent.website} className="text-blue-600 hover:underline">{agent.website}</a>
                </div>
              )}
              {!agent.email && !agent.phone && !agent.website && (
                <p className="text-gray-400">No contact info</p>
              )}
            </div>
          </div>

          {/* Professional Card */}
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              Professional
            </h2>
            <div className="space-y-2 text-sm">
              {agent.license_number && (
                <div>
                  <p className="text-gray-400 text-xs">License Number</p>
                  <p className="text-gray-700 font-mono text-sm">{agent.license_number}</p>
                </div>
              )}
              {agent.years_experience && (
                <div>
                  <p className="text-gray-400 text-xs">Experience</p>
                  <p className="text-gray-700">{agent.years_experience} years</p>
                </div>
              )}
              {!agent.license_number && !agent.years_experience && (
                <p className="text-gray-400">No professional info</p>
              )}
            </div>
          </div>

          {/* Specializations */}
          {agent.specializations && agent.specializations.length > 0 && (
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" />
                Specializations
              </h2>
              <div className="flex flex-wrap gap-2">
                {agent.specializations.map((spec: string) => (
                  <span key={spec} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {agent.languages && agent.languages.length > 0 && (
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-500" />
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {agent.languages.map((lang: string) => (
                  <span key={lang} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Bio */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              About
            </h2>
            {agent.bio ? (
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{agent.bio}</p>
            ) : (
              <p className="text-gray-400">No biography provided.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}