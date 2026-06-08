'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Calendar, Trash2, CheckCircle } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No user logged in')
        setLoading(false)
        return
      }
      
      console.log('Fetching notifications for user:', user.id)
      
      // Fetch notifications by user_id
      const { data, error } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching notifications:', error)
      } else {
        console.log('Found notifications:', data?.length || 0)
        setNotifications(data || [])
      }
      
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

const markAsRead = async (id: string) => {
  await supabase
    .from('email_notifications')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)
  
  // Update local state
  setNotifications(notifications.map(n => 
    n.id === id ? { ...n, status: 'sent' } : n
  ))
  
  // The unreadCount will automatically update because it's derived from notifications state
}

const deleteNotification = async (id: string) => {
  await supabase
    .from('email_notifications')
    .delete()
    .eq('id', id)
  
  // Update local state by removing the deleted notification
  setNotifications(notifications.filter(n => n.id !== id))
  
  // The unreadCount will automatically update because it's derived from notifications state

  const refreshNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const { data } = await supabase
    .from('email_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (data) setNotifications(data)
}
}

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
      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-black to-blue-600 bg-clip-text text-transparent mb-6">
        Notifications
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">Unread</p>
          <p className="text-2xl font-bold text-yellow-600">{unreadCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Read</p>
          <p className="text-2xl font-bold text-green-600">{notifications.filter(n => n.status === 'sent').length}</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications yet</p>
          <button 
            onClick={fetchNotifications}
            className="mt-4 text-red-600 hover:underline"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white rounded-xl shadow p-6 ${
                notification.status === 'pending' ? 'border-l-4 border-red-500' : 'opacity-75'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">{notification.subject}</h3>
                    {notification.status === 'pending' && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">New</span>
                    )}
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {notification.status === 'pending' && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-600 transition"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}