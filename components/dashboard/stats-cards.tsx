'use client'

import { Card } from '@/components/ui/card'
import { mockAgents, mockPhoneNumbers, mockCallLogs } from '@/lib/mock-data'
import { Phone, Zap, Clock, PhoneOff, TrendingUp, TrendingDown } from 'lucide-react'

export function StatsCards() {
  const activeAgents = mockAgents.filter(a => a.status === 'active').length
  const totalCalls = mockCallLogs.length
  const totalMinutes = mockAgents.reduce((acc, agent) => acc + agent.totalMinutes, 0)
  const activeNumbers = mockPhoneNumbers.filter(n => n.status === 'active').length

  const stats = [
    {
      label: 'Active Agents',
      value: activeAgents,
      subtext: `of ${mockAgents.length} total`,
      icon: Zap,
      gradient: 'from-violet-600 via-purple-600 to-pink-600',
      bgGradient: 'from-violet-600/10 via-purple-600/5 to-pink-600/10',
      borderColor: 'border-violet-200/50 dark:border-violet-800/50',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Total Calls',
      value: totalCalls,
      subtext: 'This month',
      icon: Phone,
      gradient: 'from-blue-600 via-cyan-600 to-teal-600',
      bgGradient: 'from-blue-600/10 via-cyan-600/5 to-teal-600/10',
      borderColor: 'border-blue-200/50 dark:border-blue-800/50',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Minutes Used',
      value: totalMinutes.toLocaleString(),
      subtext: 'All time',
      icon: Clock,
      gradient: 'from-green-600 via-emerald-600 to-teal-600',
      bgGradient: 'from-green-600/10 via-emerald-600/5 to-teal-600/10',
      borderColor: 'border-green-200/50 dark:border-green-800/50',
      trend: '+15%',
      trendUp: true,
    },
    {
      label: 'Active Numbers',
      value: activeNumbers,
      subtext: `of ${mockPhoneNumbers.length} total`,
      icon: PhoneOff,
      gradient: 'from-orange-600 via-red-600 to-pink-600',
      bgGradient: 'from-orange-600/10 via-red-600/5 to-pink-600/10',
      borderColor: 'border-orange-200/50 dark:border-orange-800/50',
      trend: '-2%',
      trendUp: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="relative group">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-white/70 dark:from-slate-800/95 dark:to-slate-900/70 rounded-4xl opacity-0 group-hover:opacity-100 transition-all duration-600 blur-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 to-purple-600/15 rounded-4xl opacity-0 group-hover:opacity-60 transition-all duration-800 blur-2xl"></div>
            
            {/* Much larger main card */}
            <Card className={`relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border ${stat.borderColor} rounded-4xl p-10 hover:shadow-4xl hover:shadow-purple-500/25 transition-all duration-600 hover:scale-105 hover:-translate-y-2 group-hover:border-purple-400/70 min-h-[280px]`}>
              {/* Enhanced gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} rounded-4xl opacity-0 group-hover:opacity-40 transition-opacity duration-800`}></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1200 rounded-4xl"></div>
              
              <div className="relative h-full flex flex-col justify-between">
                {/* Much larger header */}
                <div className="flex items-start justify-between mb-8">
                  <div className={`w-20 h-20 rounded-4xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-3xl group-hover:scale-115 group-hover:rotate-6 transition-all duration-600`}>
                    <Icon className="w-10 h-10 text-white drop-shadow-2xl" />
                  </div>
                  
                  {/* Enhanced trend indicator */}
                  <div className="flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      stat.trendUp 
                        ? 'bg-green-500/15 text-green-700 dark:text-green-300 border-2 border-green-500/40' 
                        : 'bg-red-500/15 text-red-700 dark:text-red-300 border-2 border-red-500/40'
                    }`}>
                      {stat.trendUp ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span className="text-base font-bold">{stat.trend}</span>
                    </div>
                    <div className={`text-sm text-slate-600 dark:text-slate-400 font-medium`}>
                      {stat.trendUp ? 'vs last month' : 'vs last month'}
                    </div>
                  </div>
                </div>

                {/* Enhanced content with much better typography */}
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-12 bg-gradient-to-r ${stat.gradient} rounded-full`}></div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-black tracking-widest uppercase">{stat.label}</p>
                    <div className={`h-2 w-12 bg-gradient-to-l ${stat.gradient} rounded-full`}></div>
                  </div>
                  
                  <div className="relative py-4">
                    <h3 className="text-7xl font-thin text-slate-900 dark:text-white tracking-tight group-hover:scale-110 transition-transform duration-400">
                      {stat.value}
                    </h3>
                    {/* Enhanced glow effect for value */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-600 -z-10`}></div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4 py-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-400/60 dark:via-slate-600/60 to-transparent flex-1"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">{stat.subtext}</p>
                    <div className="h-px bg-gradient-to-l from-transparent via-slate-400/60 dark:via-slate-600/60 to-transparent flex-1"></div>
                  </div>
                </div>

                {/* Enhanced decorative elements */}
                <div className={`absolute -top-2 -right-2 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full opacity-25 blur-3xl group-hover:scale-150 transition-transform duration-800`}></div>
                <div className={`absolute -bottom-2 -left-2 w-28 h-28 bg-gradient-to-br ${stat.gradient} rounded-full opacity-20 blur-2xl group-hover:scale-130 transition-transform duration-800`}></div>
                
                {/* Enhanced corner accents */}
                <div className={`absolute top-4 left-4 w-4 h-4 bg-gradient-to-br ${stat.gradient} rounded-full opacity-70`}></div>
                <div className={`absolute top-4 right-4 w-4 h-4 bg-gradient-to-br ${stat.gradient} rounded-full opacity-70`}></div>
                <div className={`absolute bottom-4 left-4 w-4 h-4 bg-gradient-to-br ${stat.gradient} rounded-full opacity-70`}></div>
                <div className={`absolute bottom-4 right-4 w-4 h-4 bg-gradient-to-br ${stat.gradient} rounded-full opacity-70`}></div>
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
