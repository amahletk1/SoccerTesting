'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, Users, Star, LogOut, UserCircle, ShieldCheck, Bell, Search, 
  BarChart3, Target, Eye, Edit3, MessageSquare, FileText
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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
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

        setUserId(user.id)
        setUserEmail(user.email || '')

        // Fetch notification count
        await fetchNotificationCount(user.email || '')
        
        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (adminData) {
          setUserRole('admin')
          setUserName('Admin')
          await fetchUnreadMessagesCount(user.id, 'admin')
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
          await fetchUnreadMessagesCount(player.id, 'player')
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
          await fetchUnreadMessagesCount(agent.id, 'agent')
          setLoading(false)
          return
        }

        // Check if user is scout
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

const fetchNotificationCount = async (email: string) => {
  // Count only notifications with status 'pending' (unread)
  const { count } = await supabase
    .from('email_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_email', email)
    .eq('status', 'pending')  // Make sure this is correct
  
  setNotificationCount(count || 0)
}

  const fetchUnreadMessagesCount = async (userId: string, role: string) => {
    try {
      // Get conversations based on role
      let conversationsQuery
      
      if (role === 'agent') {
        conversationsQuery = supabase
          .from('conversations')
          .select('id')
          .eq('agent_id', userId)
      } else if (role === 'player') {
        conversationsQuery = supabase
          .from('conversations')
          .select('id')
          .eq('player_id', userId)
      } else {
        setUnreadMessagesCount(0)
        return
      }

      const { data: conversations } = await conversationsQuery
      
      if (!conversations || conversations.length === 0) {
        setUnreadMessagesCount(0)
        return
      }

      const conversationIds = conversations.map(c => c.id)

      // Count unread messages where user is NOT the sender
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('is_read', false)
        .neq('sender_id', userId)

      setUnreadMessagesCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread messages:', error)
      setUnreadMessagesCount(0)
    }
  }

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!userId || !userRole) return

    // Subscribe to new messages
    const messageChannel = supabase
      .channel('unread-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        () => {
          if (userRole === 'agent') {
            fetchUnreadMessagesCount(userId, 'agent')
          } else if (userRole === 'player') {
            fetchUnreadMessagesCount(userId, 'player')
          }
        }
      )
      .subscribe()

    // Subscribe to message updates (when messages are marked as read)
    const messageUpdateChannel = supabase
      .channel('message-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'messages' }, 
        () => {
          if (userRole === 'agent') {
            fetchUnreadMessagesCount(userId, 'agent')
          } else if (userRole === 'player') {
            fetchUnreadMessagesCount(userId, 'player')
          }
        }
      )
      .subscribe()

    // Subscribe to notification updates
    const notificationChannel = supabase
      .channel('notification-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'email_notifications' }, 
        () => {
          fetchNotificationCount(userEmail)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(messageUpdateChannel)
      supabase.removeChannel(notificationChannel)
    }
  }, [userId, userRole, userEmail])

  // Also refresh counts when the page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (userRole === 'agent') {
          fetchUnreadMessagesCount(userId, 'agent')
        } else if (userRole === 'player') {
          fetchUnreadMessagesCount(userId, 'player')
        }
        fetchNotificationCount(userEmail)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [userId, userRole, userEmail])

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
            userRole === 'scout' ? 'bg-green-100 text-green-700' :
            'bg-black text-white'
          }`}>
            {userRole === 'player' ? 'Player' : userRole === 'agent' ? 'Agent' : userRole === 'scout' ? 'Scout' : 'Admin'}
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

          {/* ========== SCOUT LINKS ========== */}
          {userRole === 'scout' && (
            <>
              <Link 
                href="/dashboard/scout" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
              >
                <Target className="w-5 h-5 mr-3" />
                Scouting
              </Link>
              <Link 
                href="/dashboard/scouting/reports" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
              >
                <FileText className="w-5 h-5 mr-3" />
                My Reports
              </Link>
              <Link 
                href="/dashboard/players" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
              >
                <Users className="w-5 h-5 mr-3" />
                Browse Players
              </Link>
              <Link 
                href="/dashboard/agents" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition"
              >
                <Users className="w-5 h-5 mr-3" />
                Agents Directory
              </Link>
            </>
          )}

          {/* ========== ADMIN LINKS ========== */}
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
                href="/dashboard/admin/conversations" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Conversation Monitor
              </Link>
              <Link 
                href="/dashboard/admin/reports" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <FileText className="w-5 h-5 mr-3" />
                Scouting Reports
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
          
          {/* ========== AGENT LINKS ========== */}
          {userRole === 'agent' && (
            <>
              <Link 
                href="/dashboard/agent/profile" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <UserCircle className="w-5 h-5 mr-3" />
                My Profile
              </Link>
              <Link 
                href="/dashboard/agent/messages" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Messages
                {unreadMessagesCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
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
              <Link 
                href="/dashboard/agents" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <Users className="w-5 h-5 mr-3" />
                Agents Directory
              </Link>
            </>
          )}

          {/* ========== PLAYER LINKS ========== */}
          {userRole === 'player' && (
            <>
              <Link 
                href="/dashboard/player-view" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <Eye className="w-5 h-5 mr-3" />
                My Profile
              </Link>
              <Link 
                href="/dashboard/profile" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <Edit3 className="w-5 h-5 mr-3" />
                Edit Profile
              </Link>
              <Link 
                href="/dashboard/player/messages" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Messages
                {unreadMessagesCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </Link>
              <Link 
                href="/dashboard/agents" 
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
              >
                <Users className="w-5 h-5 mr-3" />
                Find Agents
              </Link>
            </>
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