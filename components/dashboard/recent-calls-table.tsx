'use client'

import { useEffect, useState } from 'react'
import { callsApi } from '@/lib/api'
import { Phone, Clock, CheckCircle, XCircle, Activity, Loader2, ArrowUpRight, ArrowDownLeft, Globe } from 'lucide-react'

interface CallLog {
  _id: string
  agentName: string
  fromNumber: string
  toNumber: string
  direction: 'inbound' | 'outbound' | 'web'
  duration: number
  status: 'completed' | 'failed' | 'ongoing' | 'no-answer'
  startTime: string
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20', dot: 'bg-emerald-500' }
    case 'failed':
      return { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200/60 dark:border-red-500/20', dot: 'bg-red-500' }
    case 'ongoing':
      return { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200/60 dark:border-blue-500/20', dot: 'bg-blue-500 animate-pulse' }
    default:
      return { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-500/10 border-slate-200/60 dark:border-slate-500/20', dot: 'bg-slate-400' }
  }
}

const getDirectionBadge = (dir: string) => {
  if (dir === 'inbound') return { icon: <ArrowDownLeft className="w-3 h-3" />, cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' }
  if (dir === 'outbound') return { icon: <ArrowUpRight className="w-3 h-3" />, cls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' }
  return { icon: <Globe className="w-3 h-3" />, cls: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10' }
}

const formatDuration = (s: number) => {
  if (!s) return '0:00'
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

const formatTime = (ts: string) => {
  const date = new Date(ts)
  return date.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function RecentCallsTable() {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalls()
  }, [])

  const loadCalls = async () => {
    try {
      const data: any = await callsApi.getAll({ limit: 8 })
      setCalls(data.calls || [])
    } catch {
      setCalls([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.02] backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
          <Phone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white/90">Recent Calls</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Latest call activity</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-52">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <Phone className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white/80 mb-1">No calls yet</h3>
          <p className="text-[12px] text-slate-400 dark:text-slate-500">Head to Test Agent to make your first call</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-white/[0.01]">
                <th className="text-left py-2.5 px-5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agent</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Direction</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Duration</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden md:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-white/[0.03]">
              {calls.map((call) => {
                const config = getStatusConfig(call.status)
                const dirBadge = getDirectionBadge(call.direction)
                return (
                  <tr key={call._id} className="hover:bg-violet-50/30 dark:hover:bg-violet-500/[0.03] transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                          {call.agentName || 'Unknown Agent'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium ${dirBadge.cls}`}>
                        {dirBadge.icon}
                        <span className="capitalize">{call.direction}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[13px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">{formatDuration(call.duration)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${config.bg} ${config.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        <span className="capitalize">{call.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-[12px] text-slate-400 dark:text-slate-500">{formatTime(call.startTime)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
