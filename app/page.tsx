'use client'

import Link from 'next/link'
import {
  Shield,
  Trophy,
  Users,
  UserPlus,
  Briefcase,
  Target,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Eye,
  BarChart3,
  Sparkles,
  Search,
  MessageCircle,
  TrendingUp,
  Star,
  Zap,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080F0F] text-white">

      {/* =====================================================
          BACKGROUND ATMOSPHERE
          ===================================================== */}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">

        <div className="absolute -left-[300px] -top-[250px] h-[700px] w-[700px] rounded-full bg-[#00E676]/[0.08] blur-[140px]" />

        <div className="absolute -right-[300px] top-[15%] h-[650px] w-[650px] rounded-full bg-[#F6B93B]/[0.045] blur-[140px]" />

        <div className="absolute bottom-[-350px] left-[35%] h-[700px] w-[700px] rounded-full bg-[#00E676]/[0.045] blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

      </div>


      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#080F0F]/90 backdrop-blur-2xl">

        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* LOGO */}

          <Link href="/" className="group flex items-center gap-3">

            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#00E676]/20 bg-[#0D1717]">

              <div className="absolute inset-0 rounded-xl bg-[#00E676]/10 blur-md opacity-0 transition-opacity group-hover:opacity-100" />

              <img
                src="/player-fynder-logo.png"
                alt="PlayerFynder"
                className="relative h-9 w-9 object-contain"
              />

            </div>

            <div>

              <div className="text-lg font-black tracking-tight">
                Player<span className="text-[#00E676]">Fynder</span>
              </div>

              <div className="hidden text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 sm:block">
                Football Talent Network
              </div>

            </div>

          </Link>


          {/* DESKTOP NAVIGATION */}

          <div className="hidden items-center gap-1 lg:flex">

            {/* PLAYER */}

            <Link
              href="/signup?role=player"
              className="group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/60 transition-all hover:bg-[#00E676]/[0.06] hover:text-[#00E676]"
            >

              <UserPlus className="h-4 w-4" />

              Join as Player

            </Link>


            {/* AGENT */}

            <Link
              href="/signup?role=agent"
              className="group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/60 transition-all hover:bg-[#00E676]/[0.06] hover:text-[#00E676]"
            >

              <Briefcase className="h-4 w-4" />

              Join as Agent

            </Link>


            {/* SCOUT */}

            <Link
              href="/signup?role=scout"
              className="group inline-flex items-center gap-2 rounded-xl border border-[#F6B93B]/25 bg-[#F6B93B]/[0.04] px-4 py-2.5 text-sm font-bold text-[#F6B93B] transition-all hover:border-[#F6B93B]/60 hover:bg-[#F6B93B]/[0.09]"
            >

              <Target className="h-4 w-4" />

              Join as Scout

            </Link>


            {/* SIGN IN */}

            <Link
              href="/login"
              className="group ml-2 inline-flex items-center gap-2 rounded-xl border border-[#00E676]/50 bg-[#00E676] px-5 py-2.5 text-sm font-black text-[#06100B] shadow-[0_0_25px_rgba(0,230,118,.12)] transition-all hover:bg-[#16F486] hover:shadow-[0_0_30px_rgba(0,230,118,.25)]"
            >

              Sign In

              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

            </Link>

          </div>


          {/* MOBILE SIGN IN */}

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00E676] px-4 py-2.5 text-sm font-black text-[#06100B] lg:hidden"
          >

            Sign In

            <ArrowRight className="h-4 w-4" />

          </Link>

        </div>

      </nav>


      <main className="relative z-10">


        {/* =====================================================
            HERO
            ===================================================== */}

        <section className="relative overflow-hidden">

          <div className="pointer-events-none absolute right-[-220px] top-[40px] h-[650px] w-[650px] rounded-full border border-[#00E676]/[0.07]" />

          <div className="pointer-events-none absolute right-[-140px] top-[120px] h-[500px] w-[500px] rounded-full border border-[#F6B93B]/[0.05]" />


          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">

            <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.05fr]">


              {/* =================================================
                  HERO CONTENT
                  ================================================= */}

              <div className="relative z-20 text-center lg:text-left">

                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#00E676]/20 bg-[#00E676]/[0.05] px-4 py-2">

                  <span className="relative flex h-2 w-2">

                    <span className="absolute h-full w-full animate-ping rounded-full bg-[#00E676] opacity-50" />

                    <span className="relative h-2 w-2 rounded-full bg-[#00E676]" />

                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00E676]">
                    Africa's Football Talent Network
                  </span>

                </div>


                <h1 className="text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[78px]">

                  <span className="block">
                    Your Talent.
                  </span>

                  <span className="block text-white/90">
                    Your Journey.
                  </span>

                  <span className="mt-2 block text-[#00E676]">
                    Your Opportunity.
                  </span>

                </h1>


                <div className="mt-8 flex justify-center lg:justify-start">

                  <div className="h-1 w-24 rounded-full bg-[#00E676] shadow-[0_0_20px_rgba(0,230,118,.55)]" />

                </div>


                <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-white/55 sm:text-lg lg:mx-0">

                  Connecting African footballers with scouts, agents and
                  opportunities that can take talent from local fields to
                  global stages.

                </p>


                {/* HERO BUTTONS */}

                <div className="mt-9 flex flex-col gap-3 sm:flex-row lg:max-w-xl">

                  {/* PLAYER */}

                  <Link
                    href="/signup?role=player"
                    className="group inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#00E676] px-6 text-sm font-black text-[#06100B] shadow-[0_12px_40px_rgba(0,230,118,.2)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#16F486] hover:shadow-[0_18px_45px_rgba(0,230,118,.3)]"
                  >

                    <UserPlus className="h-5 w-5" />

                    Join as Player

                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

                  </Link>


                  {/* SCOUT */}

                  <Link
                    href="/signup?role=scout"
                    className="group inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-[#F6B93B]/40 bg-white/[0.03] px-6 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:border-[#F6B93B] hover:bg-[#F6B93B]/[0.07]"
                  >

                    <Target className="h-5 w-5 text-[#F6B93B]" />

                    Join as Scout

                    <ArrowRight className="h-4 w-4 text-[#F6B93B] transition-transform group-hover:translate-x-1" />

                  </Link>

                </div>


                {/* AGENT */}

                <div className="mt-3">

                  <Link
                    href="/signup?role=agent"
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition-colors hover:text-[#00E676]"
                  >

                    <Briefcase className="h-4 w-4 text-[#00E676]" />

                    Are you a football agent?

                    <span className="text-[#00E676]">
                      Join the network
                    </span>

                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />

                  </Link>

                </div>


                <div className="mt-10 flex items-center justify-center gap-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30 lg:justify-start">

                  <span className="text-[#00E676]">
                    Dream
                  </span>

                  <span>•</span>

                  <span>Scout</span>

                  <span>•</span>

                  <span>Connect</span>

                  <span>•</span>

                  <span>Achieve</span>

                </div>

              </div>


              {/* =================================================
                  HERO VISUAL
                  ================================================= */}

              <div className="relative mx-auto min-h-[500px] w-full max-w-[620px]">

                <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00E676]/[0.07] blur-[100px]" />


                {/* AFRICAN PATTERN */}

                <div
                  className="absolute right-0 top-0 h-44 w-44 rounded-[30px] border border-[#F6B93B]/10 opacity-60"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(246,185,59,.08) 13px, transparent 14px), repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(0,230,118,.06) 13px, transparent 14px)',
                  }}
                />


                {/* DASHBOARD */}

                <div className="absolute left-0 top-12 w-[86%] rotate-[-3deg] overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#0C1716] shadow-[0_35px_90px_rgba(0,0,0,.6)] transition-transform duration-500 hover:rotate-0">

                  <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00E676]/10">

                        <img
                          src="/player-fynder-logo.png"
                          alt=""
                          className="h-7 w-7 object-contain"
                        />

                      </div>

                      <div>

                        <div className="text-xs font-black">
                          PLAYER<span className="text-[#00E676]">FYNDER</span>
                        </div>

                        <div className="text-[8px] uppercase tracking-[0.15em] text-white/30">
                          Scout Network
                        </div>

                      </div>

                    </div>


                    <div className="flex items-center gap-2 rounded-full bg-[#00E676]/[0.07] px-3 py-1.5">

                      <span className="h-1.5 w-1.5 rounded-full bg-[#00E676]" />

                      <span className="text-[8px] font-bold text-[#00E676]">
                        VERIFIED
                      </span>

                    </div>

                  </div>


                  <div className="p-5 sm:p-6">

                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">

                      <Search className="h-4 w-4 text-white/25" />

                      <span className="text-[10px] text-white/30">
                        Search players, scouts, opportunities...
                      </span>

                    </div>


                    <div className="mt-5 rounded-2xl border border-[#00E676]/15 bg-gradient-to-br from-[#00E676]/[0.08] to-transparent p-5">

                      <div className="flex items-start justify-between">

                        <div>

                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#00E676]">
                            Featured Opportunity
                          </p>

                          <h3 className="mt-2 text-xl font-black text-white">
                            Youth Talent
                            <br />
                            Discovery
                          </h3>

                          <p className="mt-2 max-w-[220px] text-[10px] leading-5 text-white/40">
                            Discover emerging African football talent ready
                            for the next opportunity.
                          </p>

                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F6B93B]/20 bg-[#F6B93B]/[0.07]">

                          <Trophy className="h-5 w-5 text-[#F6B93B]" />

                        </div>

                      </div>


                      <div className="mt-5 flex items-center gap-2">

                        <span className="rounded-lg bg-[#00E676] px-3 py-2 text-[9px] font-black text-[#06100B]">
                          Explore Talent
                        </span>

                        <span className="rounded-lg border border-white/10 px-3 py-2 text-[9px] font-semibold text-white/50">
                          View Network
                        </span>

                      </div>

                    </div>


                    <div className="mt-5 flex items-center justify-between">

                      <div>

                        <p className="text-xs font-bold text-white">
                          Top Players
                        </p>

                        <p className="mt-1 text-[9px] text-white/30">
                          Talent getting noticed
                        </p>

                      </div>

                      <span className="text-[9px] font-bold text-[#00E676]">
                        View All
                      </span>

                    </div>


                    <div className="mt-3 grid grid-cols-3 gap-2">

                      {[1, 2, 3].map((player) => (

                        <div
                          key={player}
                          className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
                        >

                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#172820] to-[#0A1110] ring-1 ring-[#00E676]/10">

                            <Users className="h-5 w-5 text-[#00E676]/60" />

                          </div>

                          <div className="mt-2 text-center">

                            <div className="text-[9px] font-bold text-white">
                              Player {player}
                            </div>

                            <div className="mt-1 flex items-center justify-center gap-1">

                              <Star className="h-2.5 w-2.5 fill-[#F6B93B] text-[#F6B93B]" />

                              <span className="text-[8px] text-white/40">
                                8.{player + 5}
                              </span>

                            </div>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                </div>


                {/* GROWTH CARD */}

                <div className="absolute bottom-8 right-0 w-[54%] rotate-[4deg] rounded-2xl border border-white/[0.1] bg-[#101C1B] p-4 shadow-[0_25px_60px_rgba(0,0,0,.5)] transition-transform duration-500 hover:rotate-0">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00E676]/10">

                      <TrendingUp className="h-5 w-5 text-[#00E676]" />

                    </div>

                    <div>

                      <p className="text-[9px] uppercase tracking-[0.15em] text-white/30">
                        Player Growth
                      </p>

                      <p className="mt-1 text-lg font-black text-white">
                        +24.8%
                      </p>

                    </div>

                  </div>


                  <div className="mt-4 flex items-end gap-1">

                    {[30, 42, 36, 55, 48, 68, 62, 82, 75].map(
                      (height, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-[#00E676]/60"
                          style={{ height: `${height / 2}px` }}
                        />
                      )
                    )}

                  </div>

                </div>


                {/* VERIFIED CARD */}

                <div className="absolute left-[-18px] top-[65%] flex items-center gap-2 rounded-xl border border-[#00E676]/20 bg-[#0D1717] px-3 py-2.5 shadow-2xl">

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00E676]/10">

                    <Shield className="h-4 w-4 text-[#00E676]" />

                  </div>

                  <div>

                    <p className="text-[9px] font-bold text-white">
                      Verified Network
                    </p>

                    <p className="text-[8px] text-white/30">
                      Trusted professionals
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURE STRIP
            ===================================================== */}

        <section className="border-y border-[#00E676]/10 bg-[#050B0B]">

          <div className="mx-auto max-w-7xl">

            <div className="grid divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-6">

              {[
                {
                  icon: Target,
                  title: 'Discover Opportunities',
                  text: 'Trials, scholarships, contracts and more.',
                  accent: 'green',
                },
                {
                  icon: Eye,
                  title: 'Get Noticed',
                  text: 'Professional profiles, videos and stats.',
                  accent: 'green',
                },
                {
                  icon: Users,
                  title: 'Connect',
                  text: 'Direct connections with football professionals.',
                  accent: 'green',
                },
                {
                  icon: BarChart3,
                  title: 'Track Your Growth',
                  text: 'Performance and progress tracking.',
                  accent: 'gold',
                },
                {
                  icon: Shield,
                  title: 'Safe & Verified',
                  text: 'Verified users and trusted networking.',
                  accent: 'green',
                },
                {
                  icon: Globe2,
                  title: 'Africa to the World',
                  text: 'Local talent. Global opportunities.',
                  accent: 'gold',
                },
              ].map((item) => {

                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="group px-5 py-7 transition-colors hover:bg-white/[0.015] lg:px-6"
                  >

                    <div
                      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full border ${
                        item.accent === 'gold'
                          ? 'border-[#F6B93B] text-[#F6B93B]'
                          : 'border-[#00E676] text-[#00E676]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <p className="text-sm font-bold text-white">
                      {item.title}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/35">
                      {item.text}
                    </p>

                  </div>
                )

              })}

            </div>

          </div>

        </section>


        {/* =====================================================
            STATS
            ===================================================== */}

        <section className="relative overflow-hidden bg-[#080F0F] px-4 py-20 sm:px-6 lg:px-8">

          <div className="absolute left-1/2 top-0 h-px w-64 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#00E676] to-transparent" />

          <div className="mx-auto max-w-6xl">

            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#00E676]">
                  Growing the network
                </p>

                <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">

                  From African
                  <br />

                  <span className="text-[#00E676]">
                    fields
                  </span>{' '}
                  to the
                  <br />
                  world.

                </h2>

                <p className="mt-5 max-w-md text-sm leading-6 text-white/40">

                  PlayerFynder is built to help football talent become visible,
                  discover opportunities and connect with the people who can
                  help take their careers forward.

                </p>

              </div>


              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.08]">

                <div className="bg-[#0D1717] p-7 sm:p-9">

                  <p className="text-4xl font-black text-[#00E676] sm:text-5xl">
                    15+
                  </p>

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                    African Countries
                  </p>

                </div>


                <div className="bg-[#0D1717] p-7 sm:p-9">

                  <p className="text-4xl font-black text-[#F6B93B] sm:text-5xl">
                    500+
                  </p>

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                    Verified Scouts
                  </p>

                </div>


                <div className="bg-[#0D1717] p-7 sm:p-9">

                  <p className="text-4xl font-black text-[#00E676] sm:text-5xl">
                    1K+
                  </p>

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                    Active Players
                  </p>

                </div>


                <div className="bg-[#0D1717] p-7 sm:p-9">

                  <p className="text-4xl font-black text-[#F6B93B] sm:text-5xl">
                    50+
                  </p>

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                    Partner Clubs
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            WHY PLAYERFYNDER
            ===================================================== */}

        <section className="relative bg-[#050B0B] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">

          <div className="mx-auto max-w-6xl">

            <div className="mb-14 max-w-2xl">

              <div className="flex items-center gap-3">

                <div className="h-px w-10 bg-[#00E676]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#00E676]">
                  Why PlayerFynder
                </span>

              </div>

              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">

                More than a game.

                <br />

                <span className="text-[#00E676]">
                  A pathway to opportunity.
                </span>

              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 text-white/40">

                Everything is built around one goal — making football talent
                easier to discover, connect and develop.

              </p>

            </div>


            <div className="grid gap-5 md:grid-cols-3">


              {/* CARD 1 */}

              <div className="group relative min-h-[320px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0D1717] p-7 transition-all duration-300 hover:-translate-y-2 hover:border-[#00E676]/30 hover:shadow-[0_25px_70px_rgba(0,0,0,.35)]">

                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#00E676]/[0.07] blur-3xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#00E676]/20 bg-[#00E676]/[0.06] text-[#00E676]">
                    <Shield className="h-7 w-7" />
                  </div>

                  <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00E676]">
                    01
                  </p>

                  <h3 className="mt-2 text-2xl font-black">

                    Verified
                    <br />
                    Network

                  </h3>

                  <p className="mt-4 text-sm leading-6 text-white/40">

                    Trusted professionals connecting with football talent
                    through a professional scouting network.

                  </p>

                  <div className="mt-7 flex items-center gap-2 text-xs font-bold text-[#00E676]">

                    <CheckCircle2 className="h-4 w-4" />

                    Trusted professionals

                  </div>

                </div>

              </div>


              {/* CARD 2 */}

              <div className="group relative min-h-[320px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0D1717] p-7 transition-all duration-300 hover:-translate-y-2 hover:border-[#F6B93B]/30 hover:shadow-[0_25px_70px_rgba(0,0,0,.35)]">

                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F6B93B]/[0.06] blur-3xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F6B93B]/20 bg-[#F6B93B]/[0.06] text-[#F6B93B]">
                    <Trophy className="h-7 w-7" />
                  </div>

                  <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F6B93B]">
                    02
                  </p>

                  <h3 className="mt-2 text-2xl font-black">

                    Curated
                    <br />
                    Talent

                  </h3>

                  <p className="mt-4 text-sm leading-6 text-white/40">

                    Discover African football players and talent ready to be
                    noticed by the right professionals.

                  </p>

                  <div className="mt-7 flex items-center gap-2 text-xs font-bold text-[#F6B93B]">

                    <Star className="h-4 w-4" />

                    African football talent

                  </div>

                </div>

              </div>


              {/* CARD 3 */}

              <div className="group relative min-h-[320px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0D1717] p-7 transition-all duration-300 hover:-translate-y-2 hover:border-[#00E676]/30 hover:shadow-[0_25px_70px_rgba(0,0,0,.35)]">

                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#00E676]/[0.06] blur-3xl transition-transform duration-500 group-hover:scale-150" />

                <div className="relative">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#00E676]/20 bg-[#00E676]/[0.06] text-[#00E676]">
                    <Users className="h-7 w-7" />
                  </div>

                  <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00E676]">
                    03
                  </p>

                  <h3 className="mt-2 text-2xl font-black">

                    Direct
                    <br />
                    Access

                  </h3>

                  <p className="mt-4 text-sm leading-6 text-white/40">

                    Bring players, agents and scouts together through one
                    football talent platform.

                  </p>

                  <div className="mt-7 flex items-center gap-2 text-xs font-bold text-[#00E676]">

                    <MessageCircle className="h-4 w-4" />

                    Connect directly

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            JOURNEY
            ===================================================== */}

        <section className="relative overflow-hidden bg-[#080F0F] px-4 py-20 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-6xl">

            <div className="rounded-[32px] border border-white/[0.08] bg-[#0D1717] p-7 sm:p-10 lg:p-14">

              <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F6B93B]">
                    The PlayerFynder Journey
                  </p>

                  <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">

                    Talent deserves
                    <br />
                    to be seen.

                  </h2>

                  <p className="mt-5 text-sm leading-6 text-white/40">

                    Build your profile, showcase your ability, connect with
                    football professionals and move closer to your next
                    opportunity.

                  </p>

                </div>


                <div className="relative">

                  <div className="absolute left-5 top-5 hidden h-[calc(100%-40px)] w-px bg-gradient-to-b from-[#00E676] via-[#00E676]/30 to-transparent sm:block" />


                  <div className="space-y-7">


                    <div className="relative flex gap-5">

                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00E676]/30 bg-[#0D1717] text-[#00E676]">
                        <UserPlus className="h-4 w-4" />
                      </div>

                      <div>

                        <p className="text-sm font-bold">
                          Build your football profile
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/35">
                          Present your football journey professionally.
                        </p>

                      </div>

                    </div>


                    <div className="relative flex gap-5">

                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F6B93B]/30 bg-[#0D1717] text-[#F6B93B]">
                        <Eye className="h-4 w-4" />
                      </div>

                      <div>

                        <p className="text-sm font-bold">
                          Get discovered
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/35">
                          Put your talent in front of the right people.
                        </p>

                      </div>

                    </div>


                    <div className="relative flex gap-5">

                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00E676]/30 bg-[#0D1717] text-[#00E676]">
                        <Users className="h-4 w-4" />
                      </div>

                      <div>

                        <p className="text-sm font-bold">
                          Connect
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/35">
                          Build relationships with scouts and agents.
                        </p>

                      </div>

                    </div>


                    <div className="relative flex gap-5">

                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F6B93B]/30 bg-[#0D1717] text-[#F6B93B]">
                        <Zap className="h-4 w-4" />
                      </div>

                      <div>

                        <p className="text-sm font-bold">
                          Chase the opportunity
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/35">
                          Take the next step in your football journey.
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
            ===================================================== */}

        <section className="px-4 pb-16 sm:px-6 lg:px-8">

          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-[#00E676]/20 bg-gradient-to-br from-[#10201A] via-[#0D1717] to-[#0A1110]">

            <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#00E676]/10 blur-[100px]" />

            <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#F6B93B]/10 blur-[100px]" />


            <div
              className="absolute right-0 top-0 h-full w-1/2 opacity-[0.04]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 18px, #00E676 19px, transparent 20px), repeating-linear-gradient(-45deg, transparent, transparent 18px, #F6B93B 19px, transparent 20px)',
              }}
            />


            <div className="relative px-6 py-16 text-center sm:px-12 sm:py-20">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#00E676]/20 bg-[#00E676]/[0.07]">

                <Sparkles className="h-7 w-7 text-[#00E676]" />

              </div>


              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-[#00E676]">
                The next opportunity could be yours
              </p>


              <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">

                Dream bigger.

                <br />

                <span className="text-[#00E676]">
                  Get discovered.
                </span>

              </h2>


              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/40 sm:text-base">

                Join a growing football talent network connecting Africa's
                players with scouts, agents and opportunities around the world.

              </p>


              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">


                {/* PLAYER */}

                <Link
                  href="/signup?role=player"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E676] px-8 py-3.5 text-sm font-black text-[#06100B] transition-all hover:-translate-y-1 hover:bg-[#19F085] hover:shadow-[0_18px_45px_rgba(0,230,118,.25)]"
                >

                  <UserPlus className="h-5 w-5" />

                  Join as Player

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

                </Link>


                {/* AGENT */}

                <Link
                  href="/signup?role=agent"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-8 py-3.5 text-sm font-bold text-white transition-all hover:border-[#00E676]/40 hover:bg-[#00E676]/[0.05]"
                >

                  <Briefcase className="h-5 w-5 text-[#00E676]" />

                  Join as Agent

                  <ArrowRight className="h-4 w-4 text-[#00E676] transition-transform group-hover:translate-x-1" />

                </Link>


                {/* SCOUT */}

                <Link
                  href="/signup?role=scout"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#F6B93B]/30 bg-white/[0.03] px-8 py-3.5 text-sm font-bold text-white transition-all hover:border-[#F6B93B] hover:bg-[#F6B93B]/[0.05]"
                >

                  <Target className="h-5 w-5 text-[#F6B93B]" />

                  Join as Scout

                  <ArrowRight className="h-4 w-4 text-[#F6B93B] transition-transform group-hover:translate-x-1" />

                </Link>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="border-t border-white/[0.07] bg-[#050B0B]">

        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">

          <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">


            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0D1717]">

                <img
                  src="/player-fynder-logo.png"
                  alt="PlayerFynder"
                  className="h-7 w-7 object-contain"
                />

              </div>

              <div>

                <p className="text-sm font-black">
                  Player<span className="text-[#00E676]">Fynder</span>
                </p>

                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/25">
                  Africa's Football Talent Network
                </p>

              </div>

            </div>


            <p className="text-xs text-white/25">
              © 2024 PlayerFynder. Connecting Africa's football talent to the world.
            </p>


            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-[#00E676] shadow-[0_0_10px_#00E676]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
                Dream • Scout • Connect • Achieve
              </span>

            </div>

          </div>

        </div>

      </footer>

    </div>
  )
}