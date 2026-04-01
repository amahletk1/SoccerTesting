'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, Users, Star, LogOut, UserCircle, ShieldCheck, Bell, Search, BarChart3, MessageSquare
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userRole, setUserRole] = useState<'player' | 'agent' | 'admin' | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.replace('/login')
          return
        }

        // Fetch notification count
        const { count } = await supabase
          .from('email_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_email', user.email)
          .eq('status', 'pending')
        
        setNotificationCount(count || 0)

        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (adminData) {
          setUserRole('admin')
          setUserName('Admin')
          setLoading(false)
          return
        }

        // Check if user is player
        const { data: player } = await supabase
          .from('players')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (player) {
          setUserRole('player')
          setUserName(player.name || user.email?.split('@')[0] || 'Player')
          setLoading(false)
          return
        }

        // Check if user is agent
        const { data: agent } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (agent) {
          setUserRole('agent')
          setUserName(agent.name || user.email?.split('@')[0] || 'Agent')
          setLoading(false)
          return
        }

        router.replace('/complete-profile')
      } catch (error) {
        console.error('Error checking user:', error)
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!userRole) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-10">
        {/* Logo Header */}
        <div className="p-6 border-b bg-gradient-to-r from-red-50 to-blue-50">
          <div className="flex items-center gap-3">
            <img 
              src="/player-fynder-logo.png" 
              alt="PlayerFynder Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
                PlayerFynder
              </h1>
              <p className="text-xs text-gray-500">Elite Football Platform</p>
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            <div className="w-8 h-1 bg-red-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-black rounded-full"></div>
          </div>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600">Welcome,</p>
          <p className="font-semibold text-gray-900">{userName}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
            userRole === 'player' ? 'bg-red-100 text-red-700' : 
            userRole === 'agent' ? 'bg-blue-100 text-blue-700' : 
            'bg-black text-white'
          }`}>
            {userRole === 'player' ? 'Player' : userRole === 'agent' ? 'Agent' : 'Admin'}
          </span>
        </div>

        <nav className="mt-4">
          <Link 
            href="/dashboard" 
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Home className="w-5 h-5 mr-3" />
            Dashboard
          </Link>

          <Link 
            href="/dashboard/notifications" 
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Bell className="w-5 h-5 mr-3" />
            Notifications
            {notificationCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {notificationCount}
              </span>
            )}
          </Link>

          {/* MESSAGES LINK - ADDED HERE */}
          <Link 
            href="/dashboard/messages" 
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
          >
            <MessageSquare className="w-5 h-5 mr-3" />
            Messages
          </Link>

          {userRole === 'admin' && (
            <>
              <Link 
                href="/dashboard/overview" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                Analytics
              </Link>
              <Link 
                href="/dashboard/admin" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-black hover:text-white transition"
              >
                <ShieldCheck className="w-5 h-5 mr-3" />
                Admin Panel
              </Link>
            </>
          )}
          
          {userRole === 'agent' && (
            <>
              <Link 
                href="/dashboard/scouting" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <Search className="w-5 h-5 mr-3" />
                Scouting
              </Link>
              <Link 
                href="/dashboard/players" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <Users className="w-5 h-5 mr-3" />
                Browse Players
              </Link>
              <Link 
                href="/dashboard/shortlist" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <Star className="w-5 h-5 mr-3" />
                Shortlist
              </Link>
            </>
          )}

          {userRole === 'player' && (
            <Link 
              href="/dashboard/profile" 
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
            >
              <UserCircle className="w-5 h-5 mr-3" />
              My Profile
            </Link>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}