'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { analyticsApi, agentsApi, numbersApi } from '@/lib/api'
import { Phone, Zap, Clock, PhoneCall, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

interface Stats {
  activeAgents: number
  totalAgents: number
  totalCalls: number
  totalMinutes: number
  activeNumbers: number
  totalNumbers: number
  successRate: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [analyticsData, agentsData, numbersData]: any[] = await Promise.all([
        analyticsApi.getOverview('30d').catch(() => ({ overview: null })),
        agentsApi.getAll().catch(() => ({ agents: [] })),
        numbersApi.getAll().catch(() => ({ numbers: [] })),
      ])

      const overview = analyticsData?.overview
      const agents = agentsData?.agents || []
      const numbers = numbersData?.numbers || []

      setStats({
        activeAgents: agents.filter((a: any) => a.status === 'active').length,
        totalAgents: agents.length,
        totalCalls: overview?.totalCalls || 0,
        totalMinutes: overview?.totalDurationMinutes || 0,
        activeNumbers: numbers.filter((n: any) => n.status === 'active').length,
        totalNumbers: numbers.length,
        successRate: overview?.successRate || 0,
      })
    } catch (e) {
      setStats({
        activeAgents: 0, totalAgents: 0,
        totalCalls: 0, totalMinutes: 0,
        activeNumbers: 0, totalNumbers: 0,
        successRate: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 flex items-center justify-center h-36">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      label: 'Active Agents',
      value: stats?.activeAgents ?? 0,
      subtext: `of ${stats?.totalAgents ?? 0} total`,
      icon: Zap,
      gradient: 'from-violet-600 via-purple-600 to-pink-600',
      bgGradient: 'from-violet-600/10 to-pink-600/10',
      borderColor: 'border-violet-200/50 dark:border-violet-800/50',
      trendUp: true,
    },
    {
      label: 'Total Calls (30d)',
      value: (stats?.totalCalls ?? 0).toLocaleString(),
      subtext: 'Last 30 days',
      icon: Phone,
      gradient: 'from-blue-600 via-cyan-600 to-teal-600',
      bgGradient: 'from-blue-600/10 to-teal-600/10',
      borderColor: 'border-blue-200/50 dark:border-blue-800/50',
      trendUp: true,
    },
    {
      label: 'Minutes Used',
      value: (stats?.totalMinutes ?? 0).toLocaleString(),
      subtext: 'Last 30 days',
      icon: Clock,
      gradient: 'from-green-600 via-emerald-600 to-teal-600',
      bgGradient: 'from-green-600/10 to-teal-600/10',
      borderColor: 'border-green-200/50 dark:border-green-800/50',
      trendUp: true,
    },
    {
      label: 'Active Numbers',
      value: stats?.activeNumbers ?? 0,
      subtext: `of ${stats?.totalNumbers ?? 0} total`,
      icon: PhoneCall,
      gradient: 'from-orange-600 via-red-600 to-pink-600',
      bgGradient: 'from-orange-600/10 to-pink-600/10',
      borderColor: 'border-orange-200/50 dark:border-orange-800/50',
      trendUp: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
            <Card className={`relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border ${stat.borderColor} rounded-3xl p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-light ${
                    stat.trendUp
                      ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                  }`}>
                    {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    Live
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-light text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-4xl font-thin text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                  <p className="text-xs font-light text-slate-500 dark:text-slate-400">{stat.subtext}</p>
                </div>
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
