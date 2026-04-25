'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
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
      return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: CheckCircle, dot: 'bg-green-500' }
    case 'failed':
      return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle, dot: 'bg-red-500' }
    case 'ongoing':
      return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: Activity, dot: 'bg-blue-500 animate-pulse' }
    default:
      return { color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/30', icon: Clock, dot: 'bg-slate-400' }
  }
}

const getDirectionIcon = (dir: string) => {
  if (dir === 'inbound') return <ArrowDownLeft className="w-3 h-3 text-green-500" />
  if (dir === 'outbound') return <ArrowUpRight className="w-3 h-3 text-blue-500" />
  return <Globe className="w-3 h-3 text-purple-500" />
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
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xl" />
      <Card className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-thin text-slate-900 dark:text-white">Recent Calls</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light">Latest call activities</p>
          </div>
          {!loading && (
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-light">Live</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-thin text-slate-900 dark:text-white mb-1">No calls yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light">Use the Test Agent page to start a call</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/30 dark:border-slate-700/30">
                  <th className="text-left py-3 px-3 text-xs font-light text-slate-500 dark:text-slate-400 uppercase tracking-wider">Agent</th>
                  <th className="text-left py-3 px-3 text-xs font-light text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Direction</th>
                  <th className="text-left py-3 px-3 text-xs font-light text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                  <th className="text-left py-3 px-3 text-xs font-light text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-light text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => {
                  const config = getStatusConfig(call.status)
                  const StatusIcon = config.icon
                  return (
                    <tr key={call._id} className="border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-sm font-light text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                            {call.agentName || 'Unknown Agent'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          {getDirectionIcon(call.direction)}
                          <span className="text-xs font-light text-slate-500 dark:text-slate-400 capitalize">{call.direction}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-light text-slate-700 dark:text-slate-300 font-mono">{formatDuration(call.duration)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-light ${config.bg} ${config.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                          <span className="capitalize">{call.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="text-xs font-light text-slate-500 dark:text-slate-400">{formatTime(call.startTime)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
