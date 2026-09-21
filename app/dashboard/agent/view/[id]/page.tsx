'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  Clock,
  CheckCircle,
  MessageSquare,
  Star,
  Building2,
  Shield,
  User,
  Sparkles,
  BadgeCheck,
  ExternalLink
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

      if (player) {
        setCurrentPlayerId(player.id)
      }
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
      <div className="min-h-screen bg-[#070b09] text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <Building2 className="absolute inset-0 m-auto w-5 h-5 text-emerald-400" />
          </div>

          <p className="text-sm text-slate-400">
            Loading agent profile...
          </p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#070b09] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <Building2 className="w-9 h-9 text-slate-500" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Agent not found
          </h1>

          <p className="text-slate-400 text-sm mb-7">
            The agent profile you are looking for could not be found.
          </p>

          <Link
            href="/dashboard/agents"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Agents Directory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b09] text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-72 left-1/3 w-[700px] h-[700px] rounded-full bg-emerald-500/[0.055] blur-3xl" />
        <div className="absolute top-1/2 -right-72 w-[600px] h-[600px] rounded-full bg-yellow-500/[0.025] blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Back navigation */}
        <Link
          href="/dashboard/agents"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </span>
          <span>Back to Agents Directory</span>
        </Link>

        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b120f]/95 shadow-2xl shadow-black/30">

          {/* Cover */}
          <div className="relative h-44 sm:h-52 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#0c2117] to-[#080d0b]" />

            {/* Green glow */}
            <div className="absolute -top-32 -left-20 w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-3xl" />

            {/* Gold glow */}
            <div className="absolute -bottom-48 right-0 w-[450px] h-[450px] rounded-full bg-yellow-500/10 blur-3xl" />

            {/* Pitch-inspired lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-300/30" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-emerald-300/30" />
              <div className="absolute left-0 top-1/2 w-1/4 h-px bg-emerald-300/20" />
              <div className="absolute right-0 top-1/2 w-1/4 h-px bg-emerald-300/20" />
            </div>

            <div className="absolute top-5 left-5 sm:left-7 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-black/30 border border-emerald-400/20 backdrop-blur-sm flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-emerald-400" />
              </div>

              <span className="text-xs uppercase tracking-[0.18em] font-semibold text-emerald-300/80">
                PlayerFynder Agent
              </span>
            </div>

            {agent.verification_status === 'verified' && (
              <div className="absolute top-5 right-5 sm:right-7 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-sm">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300">
                  Verified Agent
                </span>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative px-5 sm:px-8 pb-7">
            <div className="flex flex-col lg:flex-row lg:items-end gap-5 -mt-16">

              {/* Avatar */}
              <div className="relative shrink-0 self-center lg:self-auto">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-yellow-500 opacity-70 blur-[2px]" />

                <div className="relative rounded-full p-1 bg-[#080d0a]">
                  {agent.profile_picture ? (
                    <img
                      src={agent.profile_picture}
                      alt={agent.name}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#10251a] to-[#0b130f] border border-white/10 flex items-center justify-center">
                      <Building2 className="w-14 h-14 text-emerald-400/70" />
                    </div>
                  )}
                </div>

                {agent.verification_status === 'verified' && (
                  <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[#080d0a] flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>

              {/* Main identity */}
              <div className="flex-1 text-center lg:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {agent.name}
                  </h1>

                  {agent.verification_status === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wide">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <p className="text-slate-400 text-sm sm:text-base">
                  {agent.agency || 'Independent Football Agent'}
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4">
                  {agent.location && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.035] border border-white/10 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {agent.location}
                    </div>
                  )}

                  {agent.years_experience && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.035] border border-white/10 text-xs text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-yellow-400" />
                      {agent.years_experience} years experience
                    </div>
                  )}

                  {agent.license_number && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.035] border border-white/10 text-xs text-slate-300">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Licensed
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {currentPlayerId && (
                <div className="flex justify-center lg:pb-1">
                  <Link
                    href={`/dashboard/player/messages?agent=${agent.id}`}
                    className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message Agent
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================
            CONTENT
        ========================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mt-6">

          {/* =======================================================
              LEFT COLUMN
          ======================================================== */}
          <div className="space-y-5">

            {/* Contact */}
            <section className="rounded-2xl border border-white/10 bg-[#0b120f]/90 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-white">
                    Contact
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Professional contact details
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {agent.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-white/[0.035] flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                        Email
                      </p>
                      <p className="text-sm text-slate-200 break-all">
                        {agent.email}
                      </p>
                    </div>
                  </div>
                )}

                {agent.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-white/[0.035] flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                        Phone
                      </p>
                      <p className="text-sm text-slate-200">
                        {agent.phone}
                      </p>
                    </div>
                  </div>
                )}

                {agent.website && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-white/[0.035] flex items-center justify-center">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                        Website
                      </p>

                      <a
                        href={agent.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-400 hover:text-emerald-300 break-all inline-flex items-center gap-1 transition-colors"
                      >
                        {agent.website}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>
                )}

                {!agent.email && !agent.phone && !agent.website && (
                  <div className="py-5 text-center">
                    <Mail className="w-7 h-7 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500">
                      No contact information available
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Professional */}
            <section className="rounded-2xl border border-white/10 bg-[#0b120f]/90 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center">
                  <Award className="w-4 h-4 text-yellow-400" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-white">
                    Professional
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Agent credentials
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {agent.license_number && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      License Number
                    </p>

                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="text-sm text-slate-200 font-mono">
                        {agent.license_number}
                      </p>
                    </div>
                  </div>
                )}

                {agent.years_experience && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Experience
                    </p>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-yellow-400" />
                      <p className="text-sm text-slate-200">
                        {agent.years_experience} years
                      </p>
                    </div>
                  </div>
                )}

                {!agent.license_number && !agent.years_experience && (
                  <div className="py-5 text-center">
                    <Award className="w-7 h-7 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500">
                      No professional information available
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Specializations */}
            {agent.specializations && agent.specializations.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-[#0b120f]/90 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                    <Star className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Specializations
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Areas of expertise
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {agent.specializations.map((spec: string) => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-300 text-xs font-medium"
                      >
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Languages */}
            {agent.languages && agent.languages.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-[#0b120f]/90 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-yellow-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Languages
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Communication
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map((lang: string) => (
                      <span
                        key={lang}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* =======================================================
              RIGHT COLUMN
          ======================================================== */}
          <div className="lg:col-span-2 space-y-5">

            {/* About */}
            <section className="rounded-2xl border border-white/10 bg-[#0b120f]/90 overflow-hidden">
              <div className="px-5 sm:px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-white">
                      About the Agent
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Professional profile
                    </p>
                  </div>
                </div>

                <Sparkles className="w-5 h-5 text-yellow-400/70" />
              </div>

              <div className="p-5 sm:p-6">
                {agent.bio ? (
                  <p className="text-sm sm:text-base text-slate-300 leading-7 whitespace-pre-wrap">
                    {agent.bio}
                  </p>
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.035] border border-white/10 flex items-center justify-center mb-4">
                      <User className="w-6 h-6 text-slate-600" />
                    </div>

                    <p className="text-sm text-slate-500">
                      No biography provided.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Professional Snapshot */}
            <section className="rounded-2xl border border-white/10 bg-[#0b120f]/90 overflow-hidden">
              <div className="px-5 sm:px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-yellow-400" />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-white">
                      Professional Snapshot
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Key details at a glance
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.06]">
                <div className="bg-[#0b120f] p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-2">
                    Agency
                  </p>

                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-slate-200">
                      {agent.agency || 'Independent Agent'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#0b120f] p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-2">
                    Location
                  </p>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-slate-200">
                      {agent.location || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#0b120f] p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-2">
                    Experience
                  </p>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <p className="text-sm font-semibold text-slate-200">
                      {agent.years_experience
                        ? `${agent.years_experience} years`
                        : 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#0b120f] p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-2">
                    Verification
                  </p>

                  <div className="flex items-center gap-2">
                    {agent.verification_status === 'verified' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <p className="text-sm font-semibold text-emerald-300">
                          Verified
                        </p>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 text-slate-500" />
                        <p className="text-sm font-semibold text-slate-400">
                          Not verified
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* CTA */}
            {currentPlayerId && (
              <section className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-950/70 via-[#0b1711] to-[#0b120f] p-5 sm:p-6">
                <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-yellow-500/5 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
                        Connect
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">
                      Interested in working with this agent?
                    </h3>

                    <p className="text-sm text-slate-400">
                      Start a conversation directly through PlayerFynder.
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/player/messages?agent=${agent.id}`}
                    className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-500/10"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message Agent
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  )
}