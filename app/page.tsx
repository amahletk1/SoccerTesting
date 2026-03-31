'use client'

import Link from 'next/link'
import { Shield, Trophy, Users, ArrowRight, UserPlus, Briefcase } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      <div className="relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center relative">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg mb-8">
            <img 
              src="/player-fynder-logo.png" 
              alt="PlayerFynder Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <span className="text-sm font-semibold text-gray-600">Elite Scouting Network</span>
              <div className="flex gap-1 mt-1">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="w-2 h-2 bg-black rounded-full"></div>
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
              PlayerFynder
            </span>
            <br />
            <span className="text-gray-900">Elite Football Talent</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Connect with verified agents and sporting directors. Showcase your talent to the world's top scouts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup?role=player"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <UserPlus className="mr-2 w-5 h-5" />
              Apply as Player
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/signup?role=agent"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Briefcase className="mr-2 w-5 h-5" />
              Join as Agent
            </Link>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-red-500">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Scouts</h3>
              <p className="text-gray-600">All agents and players are thoroughly vetted</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-black">
              <div className="w-14 h-14 bg-gradient-to-br from-black to-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trophy className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Curated Talent</h3>
              <p className="text-gray-600">Access the most promising football talents</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-blue-500">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Exclusive Access</h3>
              <p className="text-gray-600">Direct engagement between agents and players</p>
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/login"
              className="text-gray-500 hover:text-red-600 transition font-medium"
            >
              Already have an account? Sign In →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}