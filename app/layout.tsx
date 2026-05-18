'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, Users, Star, LogOut, UserCircle, ShieldCheck, Bell, Search, BarChart3, Target, Eye, Edit3, Menu, X
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userRole, setUserRole] = useState<'player' | 'agent' | 'admin' | 'scout' | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

        const { count } = await supabase
          .from('email_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_email', user.email)
          .eq('status', 'pending')
        
        setNotificationCount(count || 0)

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

        const { data: scout } = await supabase
          .from('scouts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (scout) {
          setUserRole('scout')
          setUserName(scout.name || user.email?.split('@')[0] || 'Scout')
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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (sidebarOpen && !target.closest('aside') && !target.closest('button[aria-label="menu"]')) {
        setSidebarOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [sidebarOpen])

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
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-20 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src="/player-fynder-logo.png" 
            alt="PlayerFynder Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-gray-800">PlayerFynder</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="menu"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop always visible, Mobile conditional */}
      <aside className={`
        fixed left-0 top-0 h-full bg-white shadow-lg z-30 transition-transform duration-300 overflow-y-auto
        w-64
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo Header - Desktop */}
        <div className="p-6 border-b bg-gradient-to-r from-red-50 to-blue-50 hidden lg:block">
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

        {/* Mobile Logo Header */}
        <div className="p-4 border-b bg-gradient-to-r from-red-50 to-blue-50 lg:hidden">
          <div className="flex items-center gap-2">
            <img 
              src="/player-fynder-logo.png" 
              alt="PlayerFynder Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
                PlayerFynder
              </h1>
              <p className="text-xs text-gray-500">Elite Football Platform</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600">Welcome,</p>
          <p className="font-semibold text-gray-900 truncate">{userName}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
            userRole === 'player' ? 'bg-red-100 text-red-700' : 
            userRole === 'agent' ? 'bg-blue-100 text-blue-700' : 
            userRole === 'scout' ? 'bg-green-100 text-green-700' :
            'bg-black text-white'
          }`}>
            {userRole === 'player' ? 'Player' : userRole === 'agent' ? 'Agent' : userRole === 'scout' ? 'Scout' : 'Admin'}
          </span>
        </div>

        <nav className="mt-4 pb-20">
          <Link 
            href="/dashboard" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Home className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm">Dashboard</span>
          </Link>

          <Link 
            href="/dashboard/notifications" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
          >
            <Bell className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm">Notifications</span>
            {notificationCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {notificationCount}
              </span>
            )}
          </Link>

          {/* Scout Links */}
          {userRole === 'scout' && (
            <>
              <Link 
                href="/dashboard/scout" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
              >
                <Target className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Scouting</span>
              </Link>
              <Link 
                href="/dashboard/players" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
              >
                <Users className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Browse Players</span>
              </Link>
            </>
          )}

          {/* Admin Links */}
          {userRole === 'admin' && (
            <>
              <Link 
                href="/dashboard/overview" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <BarChart3 className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Analytics</span>
              </Link>
              <Link 
                href="/dashboard/admin" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-black hover:text-white transition"
              >
                <ShieldCheck className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Admin Panel</span>
              </Link>
            </>
          )}
          
          {/* Agent Links */}
          {userRole === 'agent' && (
            <>
              <Link 
                href="/dashboard/scouting" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <Search className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Scouting</span>
              </Link>
              <Link 
                href="/dashboard/players" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <Users className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Browse Players</span>
              </Link>
              <Link 
                href="/dashboard/shortlist" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <Star className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Shortlist</span>
              </Link>
            </>
          )}

          {/* Player Links */}
          {userRole === 'player' && (
            <>
              <Link 
                href="/dashboard/player-view" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <Eye className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">My Profile</span>
              </Link>
              <Link 
                href="/dashboard/profile" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <Edit3 className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Edit Profile</span>
              </Link>
            </>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - with padding for mobile header */}
      <main className="lg:ml-64 pt-16 lg:pt-8 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}