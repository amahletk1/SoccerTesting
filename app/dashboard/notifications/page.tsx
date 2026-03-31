'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Mail, CheckCircle, XCircle, Calendar, UserPlus, MessageSquare, Star, Eye, Trash2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [userRole, setUserRole] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
    getUserRole()
  }, [])

  const getUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (player) {
      setUserRole('player')
    } else {
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (agent) setUserRole('agent')
      else setUserRole('admin')
    }
  }

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('recipient_email', user.email)
      .order('created_at', { ascending: false })

    if (data) setNotifications(data)
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('email_notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id)
    
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, status: 'sent' } : n
    ))
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => n.status === 'pending')
    for (const notification of unread) {
      await supabase
        .from('email_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id)
    }
    
    setNotifications(notifications.map(n => 
      n.status === 'pending' ? { ...n, status: 'sent' } : n
    ))
  }

  const deleteNotification = async (id: string) => {
    await supabase
      .from('email_notifications')
      .delete()
      .eq('id', id)
    
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getNotificationIcon = (subject: string) => {
    if (subject.includes('approved')) return <CheckCircle className="w-6 h-6 text-green-500" />
    if (subject.includes('rejected')) return <XCircle className="w-6 h-6 text-red-500" />
    if (subject.includes('engagement')) return <MessageSquare className="w-6 h-6 text-purple-500" />
    if (subject.includes('profile')) return <UserPlus className="w-6 h-6 text-blue-500" />
    return <Bell className="w-6 h-6 text-gray-500" />
  }

  const getNotificationLink = (notification: any) => {
    if (notification.subject.includes('profile approved')) {
      return '/dashboard/profile'
    }
    if (notification.subject.includes('engagement')) {
      return '/dashboard/players'
    }
    return null
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.status === 'pending'
    if (filter === 'read') return n.status === 'sent'
    return true
  })

  const unreadCount = notifications.filter(n => n.status === 'pending').length

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">Stay updated on your profile status and engagement requests</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <CheckCircle className="w-4 h-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
            <Bell className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Unread</p>
              <p className="text-2xl font-bold text-yellow-600">{unreadCount}</p>
            </div>
            <Mail className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Read</p>
              <p className="text-2xl font-bold text-green-600">{notifications.filter(n => n.status === 'sent').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 px-1 font-medium transition ${
              filter === 'all'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`pb-3 px-1 font-medium transition ${
              filter === 'unread'
                ? 'border-b-2 border-yellow-600 text-yellow-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`pb-3 px-1 font-medium transition ${
              filter === 'read'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Read ({notifications.filter(n => n.status === 'sent').length})
          </button>
        </nav>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center border-t-4 border-red-500">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-2">
            {filter === 'unread' 
              ? "You've read all your notifications! 🎉"
              : "You'll receive notifications here when your profile is approved or engagement requests are confirmed."}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 text-red-600 hover:underline"
            >
              View all notifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const link = getNotificationLink(notification)
            return (
              <div 
                key={notification.id} 
                className={`bg-white rounded-xl shadow p-6 transition-all hover:shadow-md ${
                  notification.status === 'pending' 
                    ? 'border-l-4 border-red-500' 
                    : 'opacity-75 border-l-4 border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.subject)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{notification.subject}</h3>
                        {notification.status === 'pending' && (
                          <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                        {link && (
                          <Link
                            href={link}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {notification.status === 'pending' && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-gray-400 hover:text-green-600 transition"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Actions */}
      {userRole === 'admin' && notifications.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-red-50 to-blue-50 rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
          <div className="flex gap-4">
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Go to Admin Panel
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {userRole === 'agent' && notifications.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-red-50 to-blue-50 rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
          <div className="flex gap-4">
            <Link
              href="/dashboard/players"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Browse Players
            </Link>
            <Link
              href="/dashboard/shortlist"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              View Shortlist
            </Link>
          </div>
        </div>
      )}

      {userRole === 'player' && notifications.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-red-50 to-blue-50 rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
          <div className="flex gap-4">
            <Link
              href="/dashboard/profile"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Edit Profile
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}