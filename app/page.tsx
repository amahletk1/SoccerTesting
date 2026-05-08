'use client'

import Link from 'next/link'
import { Shield, Trophy, Users, ArrowRight, UserPlus, Briefcase, Target, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-blue-50">
      
      {/* Top Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="/player-fynder-logo.png" 
              alt="PlayerFynder" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-gray-800">PlayerFynder</span>
          </div>
          <Link href="/login" className="text-gray-600 hover:text-red-600 transition text-sm">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        {/* Hero Section with Logo */}
        <div className="text-center">
          
          {/* Large Logo with Soccer Ball Animation */}
          <div className="flex justify-center mb-4 relative">
            {/* Bouncing Soccer Ball */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
              <div className="animate-bounce-soccer">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-lg">
                  {/* Soccer ball pattern */}
                  <div className="w-10 h-10 bg-white rounded-full relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black transform -translate-y-1/2"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black transform -translate-x-1/2"></div>
                    <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-black rounded-full"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-black rounded-full"></div>
                    <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-black rounded-full"></div>
                    <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-black rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mt-6">
              <img 
                src="/player-fynder-logo.png" 
                alt="PlayerFynder Logo" 
                className="w-24 h-24 md:w-32 md:h-32 object-contain"
              />
            </div>
          </div>

          {/* Title with soccer ball accent */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 mt-4">
            Player<span className="text-red-600">Fynder</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-4">
            Window to Africa's Talent
          </p>
          
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-12 h-1 bg-red-600 rounded-full"></div>
            <div className="w-12 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-12 h-1 bg-black rounded-full"></div>
          </div>

          {/* Description */}
          <p className="text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            The premier platform connecting African football talent with verified 
            agents, scouts, and clubs worldwide.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              href="/signup?role=player"
              className="group bg-red-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Join as Player
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/signup?role=agent"
              className="group bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Join as Agent
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              href="/signup?role=scout"
              className="group bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              Join as Scout
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-20">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-red-600">15+</p>
              <p className="text-xs text-gray-500">African Countries</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-blue-600">500+</p>
              <p className="text-xs text-gray-500">Verified Scouts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-red-600">1K+</p>
              <p className="text-xs text-gray-500">Active Players</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-blue-600">50+</p>
              <p className="text-xs text-gray-500">Partner Clubs</p>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Verified Network</h3>
              <p className="text-sm text-gray-500">Trusted professionals</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Curated Talent</h3>
              <p className="text-sm text-gray-500">Top African players</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-800">Direct Access</h3>
              <p className="text-sm text-gray-500">Connect instantly</p>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-16">
            <Link href="/login" className="text-gray-400 hover:text-red-600 transition text-sm">
              Already have an account? Sign in →
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              © 2024 PlayerFynder. Connecting Africa's football talent to the world.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}