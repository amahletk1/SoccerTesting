'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, TrendingUp, Target, Award, X } from 'lucide-react'

interface StatsEditorProps {
  playerId: string
  currentStats: {
    matches_played: number
    goals: number
    assists: number
    clean_sheets?: number
    yellow_cards?: number
    red_cards?: number
  }
  onUpdate: () => void
  onClose?: () => void  // Add this prop
}

export default function StatsEditor({ playerId, currentStats, onUpdate, onClose }: StatsEditorProps) {
  const [stats, setStats] = useState({
    matches_played: currentStats.matches_played || 0,
    goals: currentStats.goals || 0,
    assists: currentStats.assists || 0,
    clean_sheets: currentStats.clean_sheets || 0,
    yellow_cards: currentStats.yellow_cards || 0,
    red_cards: currentStats.red_cards || 0
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('player_stats')
      .upsert({
        player_id: playerId,
        matches_played: stats.matches_played,
        goals: stats.goals,
        assists: stats.assists,
        clean_sheets: stats.clean_sheets,
        yellow_cards: stats.yellow_cards,
        red_cards: stats.red_cards,
        updated_at: new Date().toISOString()
      })

    if (error) {
      setMessage({ type: 'error', text: 'Error updating stats: ' + error.message })
      setLoading(false)
    } else {
      setMessage({ type: 'success', text: 'Statistics updated successfully!' })
      onUpdate()
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        if (onClose) {
          onClose()
        }
      }, 1500)
    }
    setLoading(false)
  }

  const handleIncrement = (field: keyof typeof stats, amount: number) => {
    setStats(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + amount)
    }))
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Edit Statistics</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matches Played
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleIncrement('matches_played', -1)}
                className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                -
              </button>
              <input
                type="number"
                value={stats.matches_played}
                onChange={(e) => setStats({ ...stats, matches_played: parseInt(e.target.value) || 0 })}
                className="flex-1 text-center px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleIncrement('matches_played', 1)}
                className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goals
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleIncrement('goals', -1)}
                className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                -
              </button>
              <input
                type="number"
                value={stats.goals}
                onChange={(e) => setStats({ ...stats, goals: parseInt(e.target.value) || 0 })}
                className="flex-1 text-center px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleIncrement('goals', 1)}
                className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assists
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleIncrement('assists', -1)}
                className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                -
              </button>
              <input
                type="number"
                value={stats.assists}
                onChange={(e) => setStats({ ...stats, assists: parseInt(e.target.value) || 0 })}
                className="flex-1 text-center px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleIncrement('assists', 1)}
                className="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Stats (Optional) */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Advanced Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Clean Sheets</label>
              <input
                type="number"
                value={stats.clean_sheets}
                onChange={(e) => setStats({ ...stats, clean_sheets: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Yellow Cards</label>
              <input
                type="number"
                value={stats.yellow_cards}
                onChange={(e) => setStats({ ...stats, yellow_cards: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Red Cards</label>
              <input
                type="number"
                value={stats.red_cards}
                onChange={(e) => setStats({ ...stats, red_cards: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Statistics'}
        </button>
      </form>
    </div>
  )
}