'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Bell,
  Calendar,
  Trash2,
  CheckCircle,
  RefreshCw,
  Inbox,
  Clock3,
  MailOpen,
  Sparkles,
} from 'lucide-react'

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

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log('No user logged in')
        setLoading(false)
        return
      }

      console.log('Fetching notifications for user:', user.id)

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
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id)

    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, status: 'sent' } : n
      )
    )
  }

  const deleteNotification = async (id: string) => {
    await supabase
      .from('email_notifications')
      .delete()
      .eq('id', id)

    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter(
    (n) => n.status === 'pending'
  ).length

  const readCount = notifications.filter(
    (n) => n.status === 'sent'
  ).length

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#070b09]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <Bell className="absolute inset-0 m-auto h-5 w-5 text-emerald-400" />
          </div>

          <p className="text-sm text-zinc-500">
            Loading notifications...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b09] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-yellow-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                  <Bell className="h-4 w-4 text-emerald-400" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  PlayerFynder
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Notifications
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Stay up to date with important updates, activity and
                messages from your PlayerFynder account.
              </p>
            </div>

            <button
              onClick={fetchNotifications}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all hover:border-white/15">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Total
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {notifications.length}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  All notifications
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                <Inbox className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Unread */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all hover:border-yellow-400/20">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Unread
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {unreadCount}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Awaiting your attention
                </p>
              </div>

              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10">
                <Clock3 className="h-5 w-5 text-yellow-400" />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#070b09] bg-yellow-400" />
                )}
              </div>
            </div>
          </div>

          {/* Read */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all hover:border-emerald-400/20">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Read
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {readCount}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Already reviewed
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                <MailOpen className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Section heading */}
        {notifications.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent activity
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Your latest PlayerFynder notifications
              </p>
            </div>

            {unreadCount > 0 && (
              <div className="hidden items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3 py-1.5 text-xs font-medium text-yellow-400 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                {unreadCount} unread
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {notifications.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-20 text-center backdrop-blur-xl">
            <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
              <Bell className="h-9 w-9 text-emerald-400" />
            </div>

            <h3 className="relative mt-6 text-lg font-semibold text-white">
              No notifications yet
            </h3>

            <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              You&apos;re all caught up. New notifications will appear
              here when there is activity on your account.
            </p>

            <button
              onClick={fetchNotifications}
              className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-400"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh notifications
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isPending = notification.status === 'pending'

              return (
                <div
                  key={notification.id}
                  className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-200 ${
                    isPending
                      ? 'border-emerald-400/20 bg-emerald-400/[0.045] hover:border-emerald-400/35'
                      : 'border-white/[0.07] bg-white/[0.025] hover:border-white/15'
                  }`}
                >
                  {/* Unread accent */}
                  {isPending && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 via-emerald-500 to-transparent" />
                  )}

                  <div className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      {/* Notification icon */}
                      <div
                        className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${
                          isPending
                            ? 'border border-emerald-400/20 bg-emerald-400/10'
                            : 'border border-white/10 bg-white/[0.04]'
                        }`}
                      >
                        {isPending ? (
                          <Sparkles className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Bell className="h-5 w-5 text-zinc-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className={`text-sm font-semibold sm:text-base ${
                                  isPending
                                    ? 'text-white'
                                    : 'text-zinc-300'
                                }`}
                              >
                                {notification.subject}
                              </h3>

                              {isPending && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  New
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex shrink-0 items-center gap-1">
                            {isPending && (
                              <button
                                onClick={() =>
                                  markAsRead(notification.id)
                                }
                                title="Mark as read"
                                className="rounded-lg p-2 text-zinc-600 transition-all hover:bg-emerald-400/10 hover:text-emerald-400"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              title="Delete notification"
                              className="rounded-lg p-2 text-zinc-600 transition-all hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <p
                          className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${
                            isPending
                              ? 'text-zinc-300'
                              : 'text-zinc-500'
                          }`}
                        >
                          {notification.message}
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
                          <Calendar className="h-3.5 w-3.5" />

                          <span>
                            {new Date(
                              notification.created_at
                            ).toLocaleString()}
                          </span>

                          {!isPending && (
                            <>
                              <span className="text-zinc-800">•</span>

                              <span className="inline-flex items-center gap-1 text-emerald-500/70">
                                <CheckCircle className="h-3 w-3" />
                                Read
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}