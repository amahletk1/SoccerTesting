'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Target,
  Briefcase,
  ChevronDown,
  Ruler,
  Weight,
  Globe2,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Trophy,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// All countries list - same as profile page
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
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
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
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

// Positions list - same as profile page
const positions = [
  'Forward',
  'False 9',
  'Winger',
  'Midfielder',
  'Defender',
  'Goalkeeper'
]

export default function CompleteProfilePage() {
  const [role, setRole] = useState<'player' | 'agent' | 'scout'>('player')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [position, setPosition] = useState('')
  const [nationality, setNationality] = useState('')
  const [heightMeters, setHeightMeters] = useState('')
  const [weight, setWeight] = useState('')
  const [agency, setAgency] = useState('')
  const [clubName, setClubName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const storedRole = localStorage.getItem('selectedRole')

    if (
      storedRole === 'player' ||
      storedRole === 'agent' ||
      storedRole === 'scout'
    ) {
      setRole(storedRole)
      localStorage.removeItem('selectedRole')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setError('User not found. Please login again.')
      router.push('/login')
      return
    }

    // =====================================================
    // PLAYER REGISTRATION
    // =====================================================

    if (role === 'player') {
      const heightCm = heightMeters
        ? parseFloat(heightMeters) * 100
        : null

      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let result

      if (existingPlayer) {
        result = await supabase
          .from('players')
          .update({
            name: name,
            age: parseInt(age) || null,
            position: position,
            nationality: nationality || null,
            height_cm: heightCm,
            weight_kg: weight ? parseInt(weight) : null,
            email: user.email,
            status: 'pending'
          })
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('players')
          .insert([{
            user_id: user.id,
            email: user.email,
            name: name,
            age: parseInt(age) || null,
            position: position,
            nationality: nationality || null,
            height_cm: heightCm,
            weight_kg: weight ? parseInt(weight) : null,
            status: 'pending',
            created_at: new Date().toISOString()
          }])
      }

      if (result.error) {
        setError('Failed to save profile: ' + result.error.message)
        setLoading(false)
        return
      }

      // Send notification to PLAYER
      await supabase
        .from('email_notifications')
        .insert({
          user_id: user.id,
          recipient_email: user.email,
          recipient_type: 'player',
          subject: 'Profile Submitted for Approval',
          message: `Dear ${name},\n\nThank you for completing your profile on PlayerFynder!\n\nYour profile has been submitted and is pending admin approval. You will be notified once approved.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      // Send notification to ALL ADMINS
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id, email')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (admin.email) {
            await supabase
              .from('email_notifications')
              .insert({
                user_id: admin.user_id,
                recipient_email: admin.email,
                recipient_type: 'admin',
                subject: 'New Player Registration - Pending Approval',
                message: `A new player "${name}" (${user.email}) has registered and needs approval.\n\nPlease review in the Admin Panel.`,
                status: 'pending',
                created_at: new Date().toISOString()
              })
          }
        }
      }

      alert('Player profile submitted! Waiting for admin approval.')
      router.push('/dashboard')
    }

    // =====================================================
    // AGENT REGISTRATION
    // =====================================================

    else if (role === 'agent') {
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let result

      if (existingAgent) {
        result = await supabase
          .from('agents')
          .update({
            name: name,
            agency: agency || null,
            email: user.email,
          })
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('agents')
          .insert([{
            user_id: user.id,
            email: user.email,
            name: name,
            agency: agency || null,
            verification_status: 'pending',
            created_at: new Date().toISOString()
          }])
      }

      if (result.error) {
        setError('Failed to save agent profile: ' + result.error.message)
        setLoading(false)
        return
      }

      // Send notification to AGENT
      await supabase
        .from('email_notifications')
        .insert({
          user_id: user.id,
          recipient_email: user.email,
          recipient_type: 'agent',
          subject: 'Agent Profile Created',
          message: `Dear ${name},\n\nYour agent profile has been created successfully!\n\nYou can now browse players and request engagements.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      // Send notification to ALL ADMINS
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id, email')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (admin.email) {
            await supabase
              .from('email_notifications')
              .insert({
                user_id: admin.user_id,
                recipient_email: admin.email,
                recipient_type: 'admin',
                subject: 'New Agent Registration - Pending Verification',
                message: `A new agent "${name}" (${user.email}) has registered and needs verification.\n\nAgency: ${agency || 'Independent'}\n\nPlease review in the Admin Panel.`,
                status: 'pending',
                created_at: new Date().toISOString()
              })
          }
        }
      }

      alert('Agent profile created!')
      router.push('/dashboard')
    }

    // =====================================================
    // SCOUT REGISTRATION
    // =====================================================

    else if (role === 'scout') {
      const { data: existingScout } = await supabase
        .from('scouts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      let result

      if (existingScout) {
        result = await supabase
          .from('scouts')
          .update({
            name: name,
            club_name: clubName || null,
            email: user.email,
          })
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('scouts')
          .insert([{
            user_id: user.id,
            email: user.email,
            name: name,
            club_name: clubName || null,
            created_at: new Date().toISOString()
          }])
      }

      if (result.error) {
        setError('Failed to save scout profile: ' + result.error.message)
        setLoading(false)
        return
      }

      // Send notification to SCOUT
      await supabase
        .from('email_notifications')
        .insert({
          user_id: user.id,
          recipient_email: user.email,
          recipient_type: 'scout',
          subject: 'Scout Profile Created',
          message: `Dear ${name},\n\nYour scout profile has been created successfully!\n\nYou can now browse players and create scouting reports.\n\nBest regards,\nPlayerFynder Team`,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      // Send notification to ALL ADMINS
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id, email')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          if (admin.email) {
            await supabase
              .from('email_notifications')
              .insert({
                user_id: admin.user_id,
                recipient_email: admin.email,
                recipient_type: 'admin',
                subject: 'New Scout Registration',
                message: `A new scout "${name}" (${user.email}) has registered.\n\nClub: ${clubName || 'Independent'}\n\nPlease review their profile.`,
                status: 'pending',
                created_at: new Date().toISOString()
              })
          }
        }
      }

      alert('Scout profile created!')
      window.location.href = '/dashboard/scout'
      return
    }

    setLoading(false)
  }

  const roleConfig = {
    player: {
      label: 'Player',
      icon: Trophy,
      accent: '#00E676',
      accentSoft: 'rgba(0,230,118,0.10)',
      description: 'Showcase your football talent',
    },
    agent: {
      label: 'Agent',
      icon: Briefcase,
      accent: '#42A5F5',
      accentSoft: 'rgba(66,165,245,0.10)',
      description: 'Represent and discover talent',
    },
    scout: {
      label: 'Scout',
      icon: Target,
      accent: '#F6B93B',
      accentSoft: 'rgba(246,185,59,0.10)',
      description: 'Discover the next generation',
    },
  }

  const currentRole = roleConfig[role]
  const RoleIcon = currentRole.icon

  const inputClass =
    'w-full rounded-xl border border-white/[0.10] bg-white/[0.035] px-4 py-3.5 text-sm text-white placeholder:text-white/25 transition-all duration-200 focus:border-[#00E676]/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-[#00E676]/10'

  const selectClass =
    'w-full appearance-none rounded-xl border border-white/[0.10] bg-[#101c1b] px-4 py-3.5 pr-11 text-sm text-white transition-all duration-200 focus:border-[#00E676]/50 focus:ring-2 focus:ring-[#00E676]/10'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080F0F] text-white">

      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-48 -top-48 h-[550px] w-[550px] rounded-full bg-[#00E676]/[0.055] blur-[130px]" />

        <div className="absolute -right-48 top-[20%] h-[500px] w-[500px] rounded-full bg-[#F6B93B]/[0.035] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }}
        />

      </div>


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="relative z-10 border-b border-white/[0.07] bg-[#080F0F]/85 backdrop-blur-xl">

        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">

          <button
            type="button"
            onClick={() => router.push('/')}
            className="group flex items-center gap-3"
          >

            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#00E676]/20 bg-[#0D1717]">

              <img
                src="/player-fynder-logo.png"
                alt="PlayerFynder"
                className="h-8 w-8 object-contain"
              />

            </div>

            <div className="text-left">

              <div className="text-base font-black tracking-tight">
                Player<span className="text-[#00E676]">Fynder</span>
              </div>

              <div className="hidden text-[8px] font-bold uppercase tracking-[0.18em] text-white/30 sm:block">
                Football Talent Network
              </div>

            </div>

          </button>


          <div className="flex items-center gap-2">

            <span className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 sm:block">
              Profile Setup
            </span>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#00E676]/20 bg-[#00E676]/[0.07]">

              <CheckCircle2 className="h-4 w-4 text-[#00E676]" />

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">

        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">


          {/* =================================================
              LEFT INTRO PANEL
              ================================================= */}

          <div className="lg:sticky lg:top-8">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00E676]/20 bg-[#00E676]/[0.05] px-3.5 py-2">

              <Sparkles className="h-3.5 w-3.5 text-[#00E676]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#00E676]">
                Almost there
              </span>

            </div>


            <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-5xl">

              Complete
              <br />

              your
              <br />

              <span className="text-[#00E676]">
                profile.
              </span>

            </h1>


            <p className="mt-6 max-w-md text-sm leading-6 text-white/40">

              Tell us a little about yourself so PlayerFynder can connect you
              with the right football opportunities.

            </p>


            {/* ROLE PREVIEW */}

            <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0D1717] p-5">

              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                Your selected role
              </p>


              <div className="mt-4 flex items-center gap-4">

                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `${currentRole.accent}40`,
                    backgroundColor: currentRole.accentSoft,
                  }}
                >

                  <RoleIcon
                    className="h-5 w-5"
                    style={{ color: currentRole.accent }}
                  />

                </div>


                <div>

                  <p className="font-bold text-white">
                    {currentRole.label}
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    {currentRole.description}
                  </p>

                </div>

              </div>

            </div>


            {/* STEPS */}

            <div className="mt-7 hidden space-y-4 lg:block">

              <div className="flex items-center gap-3">

                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00E676] text-[10px] font-black text-[#06100B]">
                  1
                </div>

                <span className="text-xs font-semibold text-white/60">
                  Create your profile
                </span>

              </div>


              <div className="ml-3.5 h-5 w-px bg-white/10" />


              <div className="flex items-center gap-3">

                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-[10px] font-black text-white/40">
                  2
                </div>

                <span className="text-xs font-semibold text-white/35">
                  Get discovered
                </span>

              </div>


              <div className="ml-3.5 h-5 w-px bg-white/10" />


              <div className="flex items-center gap-3">

                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-[10px] font-black text-white/40">
                  3
                </div>

                <span className="text-xs font-semibold text-white/35">
                  Connect & grow
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              FORM
              ================================================= */}

          <div className="rounded-[28px] border border-white/[0.08] bg-[#0D1717] p-5 shadow-[0_25px_80px_rgba(0,0,0,.35)] sm:p-7 lg:p-8">

            {/* FORM HEADER */}

            <div className="mb-7 border-b border-white/[0.07] pb-6">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00E676]/[0.08]">

                  <User className="h-5 w-5 text-[#00E676]" />

                </div>

                <div>

                  <h2 className="text-xl font-black">
                    Your information
                  </h2>

                  <p className="mt-1 text-xs text-white/35">
                    Complete the details below to continue.
                  </p>

                </div>

              </div>

            </div>


            {/* ERROR */}

            {error && (

              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#FF5252]/20 bg-[#FF5252]/[0.07] p-4">

                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#FF7373]" />

                <div>

                  <p className="text-sm font-bold text-[#FF9A9A]">
                    Something went wrong
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#FF9A9A]/70">
                    {error}
                  </p>

                </div>

              </div>

            )}


            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >


              {/* =================================================
                  ROLE
                  ================================================= */}

              <div>

                <label className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                  I am a
                </label>


                <div className="grid grid-cols-3 gap-2">


                  {/* PLAYER */}

                  <button
                    type="button"
                    onClick={() => setRole('player')}
                    className="rounded-xl border px-3 py-3.5 transition-all"
                    style={{
                      borderColor:
                        role === 'player'
                          ? 'rgba(0,230,118,.45)'
                          : 'rgba(255,255,255,.08)',
                      background:
                        role === 'player'
                          ? 'rgba(0,230,118,.08)'
                          : 'rgba(255,255,255,.025)',
                    }}
                  >

                    <Trophy
                      className="mx-auto h-5 w-5"
                      style={{
                        color:
                          role === 'player'
                            ? '#00E676'
                            : 'rgba(255,255,255,.35)',
                      }}
                    />

                    <span
                      className="mt-2 block text-xs font-bold"
                      style={{
                        color:
                          role === 'player'
                            ? '#00E676'
                            : 'rgba(255,255,255,.55)',
                      }}
                    >
                      Player
                    </span>

                  </button>


                  {/* AGENT */}

                  <button
                    type="button"
                    onClick={() => setRole('agent')}
                    className="rounded-xl border px-3 py-3.5 transition-all"
                    style={{
                      borderColor:
                        role === 'agent'
                          ? 'rgba(66,165,245,.45)'
                          : 'rgba(255,255,255,.08)',
                      background:
                        role === 'agent'
                          ? 'rgba(66,165,245,.08)'
                          : 'rgba(255,255,255,.025)',
                    }}
                  >

                    <Briefcase
                      className="mx-auto h-5 w-5"
                      style={{
                        color:
                          role === 'agent'
                            ? '#42A5F5'
                            : 'rgba(255,255,255,.35)',
                      }}
                    />

                    <span
                      className="mt-2 block text-xs font-bold"
                      style={{
                        color:
                          role === 'agent'
                            ? '#42A5F5'
                            : 'rgba(255,255,255,.55)',
                      }}
                    >
                      Agent
                    </span>

                  </button>


                  {/* SCOUT */}

                  <button
                    type="button"
                    onClick={() => setRole('scout')}
                    className="rounded-xl border px-3 py-3.5 transition-all"
                    style={{
                      borderColor:
                        role === 'scout'
                          ? 'rgba(246,185,59,.45)'
                          : 'rgba(255,255,255,.08)',
                      background:
                        role === 'scout'
                          ? 'rgba(246,185,59,.08)'
                          : 'rgba(255,255,255,.025)',
                    }}
                  >

                    <Target
                      className="mx-auto h-5 w-5"
                      style={{
                        color:
                          role === 'scout'
                            ? '#F6B93B'
                            : 'rgba(255,255,255,.35)',
                      }}
                    />

                    <span
                      className="mt-2 block text-xs font-bold"
                      style={{
                        color:
                          role === 'scout'
                            ? '#F6B93B'
                            : 'rgba(255,255,255,.55)',
                      }}
                    >
                      Scout
                    </span>

                  </button>

                </div>

              </div>


              {/* =================================================
                  NAME
                  ================================================= */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/45"
                >
                  Full Name <span className="text-[#00E676]">*</span>
                </label>

                <div className="relative">

                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputClass} pl-11`}
                    placeholder="Enter your full name"
                    required
                  />

                </div>

              </div>


              {/* =================================================
                  PLAYER FIELDS
                  ================================================= */}

              {role === 'player' ? (

                <div className="space-y-6">


                  {/* AGE + POSITION */}

                  <div className="grid gap-5 sm:grid-cols-2">


                    <div>

                      <label
                        htmlFor="age"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/45"
                      >
                        Age <span className="text-[#00E676]">*</span>
                      </label>

                      <input
                        id="age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className={inputClass}
                        placeholder="Your age"
                        required
                      />

                    </div>


                    <div>

                      <label
                        htmlFor="position"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/45"
                      >
                        Position <span className="text-[#00E676]">*</span>
                      </label>

                      <div className="relative">

                        <select
                          id="position"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className={selectClass}
                          required
                        >
                          <option value="">
                            Select Position
                          </option>

                          {positions.map((pos) => (
                            <option
                              key={pos}
                              value={pos}
                            >
                              {pos}
                            </option>
                          ))}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                      </div>

                    </div>

                  </div>


                  {/* NATIONALITY */}

                  <div>

                    <label
                      htmlFor="nationality"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/45"
                    >
                      Nationality
                    </label>

                    <div className="relative">

                      <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                      <select
                        id="nationality"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className={`${selectClass} pl-11`}
                      >

                        <option value="">
                          Select Nationality
                        </option>

                        {countries.map((country) => (
                          <option
                            key={country}
                            value={country}
                          >
                            {country}
                          </option>
                        ))}

                      </select>

                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                    </div>

                  </div>


                  {/* HEIGHT + WEIGHT */}

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>

                      <label
                        htmlFor="height"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/45"
                      >
                        Height
                      </label>

                      <div className="relative">

                        <Ruler className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                        <input
                          id="height"
                          type="number"
                          step="0.01"
                          value={heightMeters}
                          onChange={(e) => setHeightMeters(e.target.value)}
                          className={`${inputClass} pl-11 pr-16`}
                          placeholder="1.85"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/25">
                          metres
                        </span>

                      </div>

                    </div>


                    <div>

                      <label
                        htmlFor="weight"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/45"
                      >
                        Weight
                      </label>

                      <div className="relative">

                        <Weight className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                        <input
                          id="weight"
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className={`${inputClass} pl-11 pr-12`}
                          placeholder="75"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/25">
                          kg
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              ) : role === 'agent' ? (

                /* =================================================
                   AGENT
                   ================================================= */

                <div>

                  <label
                    htmlFor="agency"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/45"
                  >
                    Agency Name
                    <span className="ml-2 normal-case tracking-normal text-white/20">
                      Optional
                    </span>
                  </label>

                  <div className="relative">

                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                    <input
                      id="agency"
                      type="text"
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      className={`${inputClass} pl-11`}
                      placeholder="Your agency name"
                    />

                  </div>

                </div>

              ) : (

                /* =================================================
                   SCOUT
                   ================================================= */

                <div>

                  <label
                    htmlFor="club"
                    className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-white/45"
                  >
                    Club / Organization Name
                    <span className="ml-2 normal-case tracking-normal text-white/20">
                      Optional
                    </span>
                  </label>

                  <div className="relative">

                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                    <input
                      id="club"
                      type="text"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      className={`${inputClass} pl-11`}
                      placeholder="e.g. Manchester United, Independent Scout"
                    />

                  </div>

                </div>

              )}


              {/* =================================================
                  SUBMIT
                  ================================================= */}

              <div className="border-t border-white/[0.07] pt-6">

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#00E676] px-6 py-4 text-sm font-black text-[#06100B] shadow-[0_12px_35px_rgba(0,230,118,.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#16F486] hover:shadow-[0_18px_45px_rgba(0,230,118,.24)] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {loading ? (

                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#06100B]/30 border-t-[#06100B]" />

                      Saving...

                    </>

                  ) : (

                    <>
                      Complete Profile

                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

                    </>

                  )}

                </button>


                <p className="mt-4 text-center text-[10px] leading-5 text-white/25">

                  By completing your profile, your information will be saved
                  securely to your PlayerFynder account.

                </p>

              </div>

            </form>

          </div>

        </div>

      </main>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="relative z-10 border-t border-white/[0.06] bg-[#050B0B]">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">

          <p className="text-[10px] text-white/25">
            © 2024 PlayerFynder. Football talent, connected.
          </p>

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-[#00E676]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25">
              Africa to the world
            </span>

          </div>

        </div>

      </footer>

    </div>
  )
}