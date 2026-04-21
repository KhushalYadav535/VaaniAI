'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentCallsTable } from '@/components/dashboard/recent-calls-table'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { TrendingUp, Users, Phone, DollarSign, Activity, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/auth/login')
    }
  }, [router])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-pink-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="p-8 space-y-8">
        {/* Premium Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-thin tracking-tight text-slate-900 dark:text-white">
                      Dashboard
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
                      Welcome back! Here's your platform overview.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-light">Today</div>
                  <div className="text-lg font-light text-slate-900 dark:text-white">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: Users, 
              label: 'Active Agents', 
              value: '12', 
              change: '+2.5%', 
              trend: 'up',
              color: 'from-blue-500 to-cyan-500',
              bgGradient: 'from-blue-500/10 to-cyan-500/10'
            },
            { 
              icon: Phone, 
              label: 'Total Calls', 
              value: '48.2K', 
              change: '+12.3%', 
              trend: 'up',
              color: 'from-purple-500 to-pink-500',
              bgGradient: 'from-purple-500/10 to-pink-500/10'
            },
            { 
              icon: DollarSign, 
              label: 'Revenue', 
              value: '$124.5K', 
              change: '+8.7%', 
              trend: 'up',
              color: 'from-green-500 to-emerald-500',
              bgGradient: 'from-green-500/10 to-emerald-500/10'
            },
            { 
              icon: Calendar, 
              label: 'Avg Duration', 
              value: '6:42', 
              change: '-0:24', 
              trend: 'down',
              color: 'from-orange-500 to-red-500',
              bgGradient: 'from-orange-500/10 to-red-500/10'
            },
          ].map((stat, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-105">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-light">{stat.label}</div>
                  <div className="text-3xl font-thin text-slate-900 dark:text-white">{stat.value}</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-light ${
                      stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      stat.trend === 'up' ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats Cards & Quick Actions */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-thin text-slate-900 dark:text-white">Performance Overview</h2>
              </div>
              <StatsCards />
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-thin text-slate-900 dark:text-white">Quick Actions</h2>
              </div>
              <QuickActions />
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-8">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-thin text-slate-900 dark:text-white">Recent Activity</h2>
              </div>
              <RecentCallsTable />
            </div>

            {/* Premium Insights Card */}
            <div className="bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-pink-600/10 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-3xl border border-purple-200/50 dark:border-purple-800/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-thin text-slate-900 dark:text-white">AI Insights</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                  <div className="text-sm font-light text-slate-600 dark:text-slate-400 mb-1">Peak Performance</div>
                  <div className="text-lg font-light text-slate-900 dark:text-white">Customer satisfaction increased by 15% this week</div>
                </div>
                <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                  <div className="text-sm font-light text-slate-600 dark:text-slate-400 mb-1">Cost Optimization</div>
                  <div className="text-lg font-light text-slate-900 dark:text-white">AI routing saved $2,340 in operational costs</div>
                </div>
                <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                  <div className="text-sm font-light text-slate-600 dark:text-slate-400 mb-1">Agent Performance</div>
                  <div className="text-lg font-light text-slate-900 dark:text-white">3 agents need optimization for better response times</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
