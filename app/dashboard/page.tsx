'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentCallsTable } from '@/components/dashboard/recent-calls-table'
import { QuickActions } from '@/components/dashboard/quick-actions'
import {
  TrendingUp, Phone, Activity, Zap, ArrowRight, BookOpen, Mic,
  Sparkles, Shield, Cpu, Database, Globe, Clock,
} from 'lucide-react'
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
      if (u?.role === 'super_admin') {
        router.replace('/super-admin')
        return
      }
      if (u?.name) setUserName(u.name.split(' ')[0])
    } catch {}
  }, [router])

  if (!mounted) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-6">

      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-900 dark:via-purple-950 dark:to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_60%)]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3cpath d=\'M0 0h40v40H0z\' fill=\'none\' stroke=\'white\' stroke-width=\'0.5\'/%3e%3c/svg%3e")' }} />

        <div className="relative px-6 py-8 md:px-8 md:py-10">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-light text-white tracking-tight">
                  {greeting}, <span className="font-medium">{userName}</span>
                </h1>
                <p className="text-sm text-white/60 font-light mt-0.5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-xs font-medium text-white/80">All Systems Online</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                <Clock className="w-3.5 h-3.5 text-white/60" />
                <span className="text-sm font-medium text-white/80">
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <StatsCards />

      {/* ── Quick Actions ── */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white/90">Quick Actions</h2>
        </div>
        <QuickActions />
      </section>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Calls */}
        <div className="lg:col-span-2">
          <RecentCallsTable />
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Getting Started */}
          <div className="rounded-2xl border border-violet-200/60 dark:border-violet-500/15 bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950/40 dark:via-slate-900/80 dark:to-purple-950/30 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white/90">Getting Started</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Create your first agent', href: '/agents', icon: Zap, color: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/15' },
                { label: 'Add API keys in Settings', href: '/settings', icon: Activity, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15' },
                { label: 'Test voice conversation', href: '/test-agent', icon: Mic, color: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-500/15' },
                { label: 'Configure phone number', href: '/numbers', icon: Phone, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5 transition-all duration-200 group">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] backdrop-blur-sm p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                <Cpu className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white/90">Your Stack</h2>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full">Free</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Groq LLM', detail: 'llama3-8b-8192 · Ultra fast', icon: Cpu, color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/15' },
                { name: 'Deepgram STT', detail: '$200 free credits', icon: Globe, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15' },
                { name: 'Edge TTS', detail: '30+ voices · No key needed', icon: Mic, color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/15' },
                { name: 'MongoDB', detail: 'Atlas free tier', icon: Database, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15' },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{item.name}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-light">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security badge */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-slate-700 dark:text-slate-300">End-to-end Encrypted</div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">Your data stays on your infrastructure</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
