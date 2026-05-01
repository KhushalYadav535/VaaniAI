'use client'

import { useEffect, useState } from 'react'
import { analyticsApi, agentsApi, numbersApi } from '@/lib/api'
import { Phone, Zap, Clock, PhoneCall, TrendingUp, Loader2, Sparkles } from 'lucide-react'

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] p-6 flex items-center justify-center h-[140px]">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
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
      iconBg: 'bg-violet-100 dark:bg-violet-500/15',
      iconColor: 'text-violet-600 dark:text-violet-400',
      accent: 'violet',
    },
    {
      label: 'Total Calls',
      value: (stats?.totalCalls ?? 0).toLocaleString(),
      subtext: 'Last 30 days',
      icon: Phone,
      iconBg: 'bg-blue-100 dark:bg-blue-500/15',
      iconColor: 'text-blue-600 dark:text-blue-400',
      accent: 'blue',
    },
    {
      label: 'Minutes Used',
      value: (stats?.totalMinutes ?? 0).toLocaleString(),
      subtext: 'Last 30 days',
      icon: Clock,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accent: 'emerald',
    },
    {
      label: 'Active Numbers',
      value: stats?.activeNumbers ?? 0,
      subtext: `of ${stats?.totalNumbers ?? 0} total`,
      icon: PhoneCall,
      iconBg: 'bg-orange-100 dark:bg-orange-500/15',
      iconColor: 'text-orange-600 dark:text-orange-400',
      accent: 'orange',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label}
            className="group relative rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-black/20 hover:border-slate-300/80 dark:hover:border-white/[0.1] transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">{stat.value}</h3>
              <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{stat.subtext}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
