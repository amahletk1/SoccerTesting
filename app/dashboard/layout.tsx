'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Users,
  Star,
  LogOut,
  UserCircle,
  ShieldCheck,
  Bell,
  BarChart3,
  Target,
  Eye,
  Edit3,
  MessageSquare,
  FileText,
  ChevronRight,
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [userRole, setUserRole] = useState<
    'player' | 'agent' | 'admin' | 'scout' | null
  >(null)

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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.replace('/login')
          return
        }

        setUserId(user.id)
        setUserEmail(user.email || '')

        await fetchNotificationCount(user.email || '')

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

        const { data: player } = await supabase
          .from('players')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (player) {
          setUserRole('player')
          setUserName(
            player.name || user.email?.split('@')[0] || 'Player'
          )
          await fetchUnreadMessagesCount(player.id, 'player')
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
          setUserName(
            agent.name || user.email?.split('@')[0] || 'Agent'
          )
          await fetchUnreadMessagesCount(agent.id, 'agent')
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
          setUserName(
            scout.name || user.email?.split('@')[0] || 'Scout'
          )
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
    const { count } = await supabase
      .from('email_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_email', email)
      .eq('status', 'pending')

    setNotificationCount(count || 0)
  }

  const fetchUnreadMessagesCount = async (
    userId: string,
    role: string
  ) => {
    try {
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

      const conversationIds = conversations.map((c) => c.id)

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

  useEffect(() => {
    if (!userId || !userRole) return

    const messageChannel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          if (userRole === 'agent') {
            fetchUnreadMessagesCount(userId, 'agent')
          } else if (userRole === 'player') {
            fetchUnreadMessagesCount(userId, 'player')
          }
        }
      )
      .subscribe()

    const messageUpdateChannel = supabase
      .channel('message-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          if (userRole === 'agent') {
            fetchUnreadMessagesCount(userId, 'agent')
          } else if (userRole === 'player') {
            fetchUnreadMessagesCount(userId, 'player')
          }
        }
      )
      .subscribe()

    const notificationChannel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'email_notifications',
        },
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

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }
  }, [userId, userRole, userEmail])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const getRoleLabel = () => {
    switch (userRole) {
      case 'player':
        return 'Player'
      case 'agent':
        return 'Agent'
      case 'scout':
        return 'Scout'
      case 'admin':
        return 'Admin'
      default:
        return ''
    }
  }

  const getRoleIcon = () => {
    switch (userRole) {
      case 'player':
        return <Eye className="w-4 h-4" />
      case 'agent':
        return <UserCircle className="w-4 h-4" />
      case 'scout':
        return <Target className="w-4 h-4" />
      case 'admin':
        return <ShieldCheck className="w-4 h-4" />
      default:
        return <UserCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080F0F] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00E676]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#F6B93B]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#101C1B] border border-white/[0.08] flex items-center justify-center shadow-2xl shadow-black/30">
            <img
              src="/player-fynder-logo.png"
              alt="PlayerFynder"
              className="w-11 h-11 object-contain"
            />
          </div>

          <div className="mt-6 w-7 h-7 rounded-full border-2 border-white/10 border-t-[#00E676] animate-spin" />

          <p className="mt-4 text-sm text-white/45">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!userRole) {
    return null
  }

  const navItem =
    'group flex items-center mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200'

  const roleColor =
    userRole === 'player'
      ? 'text-[#00E676]'
      : userRole === 'agent'
        ? 'text-[#F6B93B]'
        : userRole === 'scout'
          ? 'text-[#00E676]'
          : 'text-[#F6B93B]'

  return (
    <div className="min-h-screen bg-[#080F0F] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-64 w-[500px] h-[500px] bg-[#00E676]/[0.025] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-[#F6B93B]/[0.025] rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0D1717] border-r border-white/[0.07] z-40 flex flex-col">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.07]">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#101C1B] border border-white/[0.08] flex items-center justify-center group-hover:border-[#00E676]/30 transition">
              <img
                src="/player-fynder-logo.png"
                alt="PlayerFynder Logo"
                className="w-9 h-9 object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-white">Player</span>
                <span className="text-[#00E676]">Fynder</span>
              </h1>

              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35 mt-0.5">
                Football Talent Network
              </p>
            </div>
          </Link>

          <div className="flex gap-1 mt-4">
            <div className="h-0.5 flex-1 bg-[#00E676] rounded-full" />
            <div className="h-0.5 w-10 bg-[#F6B93B] rounded-full" />
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-4">
          <div className="rounded-xl bg-[#101C1B] border border-white/[0.06] p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00E676]/20 to-[#F6B93B]/10 border border-[#00E676]/20 flex items-center justify-center shrink-0">
                {getRoleIcon()}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/35">
                  Welcome
                </p>

                <p className="text-sm font-semibold text-white truncate">
                  {userName}
                </p>
              </div>
            </div>

            <div
              className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/[0.04] ${roleColor}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  userRole === 'admin'
                    ? 'bg-[#F6B93B]'
                    : 'bg-[#00E676]'
                }`}
              />
              {getRoleLabel()}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-1 pb-24 scrollbar-thin">
          <div className="px-5 mb-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 font-semibold">
              Main
            </p>
          </div>

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`${navItem} text-white/65 hover:text-white hover:bg-white/[0.045]`}
          >
            <Home className="w-[18px] h-[18px] mr-3 text-white/40 group-hover:text-[#00E676] transition" />
            <span>Dashboard</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-40 transition" />
          </Link>

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className={`${navItem} text-white/65 hover:text-white hover:bg-white/[0.045]`}
          >
            <Bell className="w-[18px] h-[18px] mr-3 text-white/40 group-hover:text-[#F6B93B] transition" />

            <span>Notifications</span>

            {notificationCount > 0 && (
              <span className="ml-auto min-w-[22px] h-[21px] px-1.5 rounded-full bg-[#F6B93B] text-[#080F0F] text-[10px] font-bold flex items-center justify-center">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Link>

          {/* Scout */}
          {userRole === 'scout' && (
            <>
              <div className="px-5 mt-6 mb-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 font-semibold">
                  Scouting
                </p>
              </div>

              <Link
                href="/dashboard/scout"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#00E676]/[0.06]`}
              >
                <Target className="w-[18px] h-[18px] mr-3 text-[#00E676]/60 group-hover:text-[#00E676] transition" />
                <span>Scouting</span>
              </Link>

              <Link
                href="/dashboard/scouting/reports"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#00E676]/[0.06]`}
              >
                <FileText className="w-[18px] h-[18px] mr-3 text-[#00E676]/60 group-hover:text-[#00E676] transition" />
                <span>My Reports</span>
              </Link>

              <Link
                href="/dashboard/players"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#00E676]/[0.06]`}
              >
                <Users className="w-[18px] h-[18px] mr-3 text-[#00E676]/60 group-hover:text-[#00E676] transition" />
                <span>Browse Players</span>
              </Link>

              <Link
                href="/dashboard/agents"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#00E676]/[0.06]`}
              >
                <Users className="w-[18px] h-[18px] mr-3 text-[#00E676]/60 group-hover:text-[#00E676] transition" />
                <span>Agents Directory</span>
              </Link>

              {/* Messages */}
              <Link
                href="/dashboard/messages"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#00E676]/[0.06]`}
              >
                <MessageSquare className="w-[18px] h-[18px] mr-3 text-[#00E676]/60 group-hover:text-[#00E676] transition" />
                <span>Messages</span>
              </Link>
            </>
          )}

          {/* Admin */}
          {userRole === 'admin' && (
            <>
              <div className="px-5 mt-6 mb-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 font-semibold">
                  Administration
                </p>
              </div>

              <Link
                href="/dashboard/overview"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <BarChart3 className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />
                <span>Analytics</span>
              </Link>

              <Link
                href="/dashboard/admin/conversations"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <MessageSquare className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />
                <span>Conversation Monitor</span>
              </Link>

              <Link
                href="/dashboard/admin/reports"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <FileText className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />
                <span>Scouting Reports</span>
              </Link>

              <Link
                href="/dashboard/admin"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <ShieldCheck className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />
                <span>Admin Panel</span>
              </Link>
            </>
          )}

          {/* Agent */}
          {userRole === 'agent' && (
            <>
              <div className="px-5 mt-6 mb-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 font-semibold">
                  Agent Workspace
                </p>
              </div>

              <Link
                href="/dashboard/agent/profile"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <UserCircle className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />
                <span>My Profile</span>
              </Link>

              {/* Messages */}
              <Link
                href="/dashboard/messages"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <MessageSquare className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />

                <span>Messages</span>

                {unreadMessagesCount > 0 && (
                  <span className="ml-auto min-w-[22px] h-[21px] px-1.5 rounded-full bg-[#00E676] text-[#080F0F] text-[10px] font-bold flex items-center justify-center">
                    {unreadMessagesCount > 99
                      ? '99+'
                      : unreadMessagesCount}
                  </span>
                )}
              </Link>

              <Link
                href="/dashboard/players"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <Users className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />
                <span>Browse Players</span>
              </Link>

              <Link
                href="/dashboard/shortlist"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <Star className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />
                <span>Shortlist</span>
              </Link>

              <Link
                href="/dashboard/agents"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#F6B93B]/[0.06]`}
              >
                <Users className="w-[18px] h-[18px] mr-3 text-[#F6B93B]/70 group-hover:text-[#F6B93B] transition" />
                <span>Agents Directory</span>
              </Link>
            </>
          )}

          {/* Player */}
          {userRole === 'player' && (
            <>
              <div className="px-5 mt-6 mb-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 font-semibold">
                  My Football Profile
                </p>
              </div>

              <Link
                href="/dashboard/player-view"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#00E676]/[0.06]`}
              >
                <Eye className="w-[18px] h-[18px] mr-3 text-[#00E676]/60 group-hover:text-[#00E676] transition" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/dashboard/profile"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#00E676]/[0.06]`}
              >
                <Edit3 className="w-[18px] h-[18px] mr-3 text-[#00E676]/60 group-hover:text-[#00E676] transition" />
                <span>Edit Profile</span>
              </Link>

              {/* Messages */}
              <Link
                href="/dashboard/messages"
                className={`${navItem} text-white/65 hover:text-white hover:bg-[#00E676]/[0.06]`}
              >
                <MessageSquare className="w-[18px] h-[18px] mr-3 text-[#00E676]/60 group-hover:text-[#00E676] transition" />
                <span>Messages</span>
              </Link>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0D1717] border-t border-white/[0.07]">
          <button
            onClick={handleLogout}
            className="group flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/[0.07] transition-all"
          >
            <LogOut className="w-[18px] h-[18px] mr-3 group-hover:text-red-400 transition" />
            Logout

            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-40 transition" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative min-h-screen ml-64">
        <div className="px-6 py-6 md:px-8 md:py-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}