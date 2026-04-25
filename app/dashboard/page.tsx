'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentCallsTable } from '@/components/dashboard/recent-calls-table'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { TrendingUp, Phone, Activity, Zap, ArrowRight, BookOpen, Mic } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState('there')

  useEffect(() => {
    setMounted(true)
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/auth/login')
      return
    }
    try {
      const u = JSON.parse(user)
      if (u?.name) setUserName(u.name.split(' ')[0])
    } catch {}
  }, [router])

  if (!mounted) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen p-6 space-y-6">

      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">
                  {greeting}, <span className="font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{userName}</span> 👋
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · VaaniAI Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/50">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-light text-green-700 dark:text-green-400">System Online</span>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-lg font-light text-slate-900 dark:text-white">
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Stats Cards */}
      <StatsCards />

      {/* Quick Actions */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-thin text-slate-900 dark:text-white">Quick Actions</h2>
        </div>
        <QuickActions />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls - real data */}
        <div className="lg:col-span-2">
          <RecentCallsTable />
        </div>

        {/* Getting Started / Tips */}
        <div className="space-y-4">
          {/* Setup Checklist */}
          <div className="bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-pink-600/10 rounded-3xl border border-purple-200/50 dark:border-purple-800/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-thin text-slate-900 dark:text-white">Getting Started</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Create your first agent', href: '/agents', icon: Zap },
                { label: 'Add API keys in Settings', href: '/settings', icon: Activity },
                { label: 'Test voice conversation', href: '/test-agent', icon: Mic },
                { label: 'Configure phone number', href: '/numbers', icon: Phone },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/30 dark:border-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/50 hover:border-purple-300/50 transition-all group">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-light text-slate-700 dark:text-slate-300">{item.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Free Stack Info */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5">
            <h3 className="text-sm font-thin text-slate-900 dark:text-white mb-3">🆓 Your Free Stack</h3>
            <div className="space-y-2">
              {[
                { name: 'Groq LLM', detail: 'llama3-8b-8192 · Fast & free', color: 'bg-orange-400' },
                { name: 'Deepgram STT', detail: '$200 free credits', color: 'bg-blue-400' },
                { name: 'Edge TTS', detail: '30+ voices · No key needed', color: 'bg-green-400' },
                { name: 'MongoDB', detail: 'Local / Atlas free tier', color: 'bg-emerald-400' },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                  <div>
                    <span className="text-xs font-light text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-light ml-1">— {item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
