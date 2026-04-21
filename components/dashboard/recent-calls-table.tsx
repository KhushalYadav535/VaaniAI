'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockCallLogs } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { Phone, Clock, CheckCircle, XCircle, Activity } from 'lucide-react'

export function RecentCallsTable() {
  const recentCalls = [...mockCallLogs].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, 8)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-500/10 dark:bg-green-500/20',
          borderColor: 'border-green-500/30 dark:border-green-400/30',
          icon: CheckCircle,
          gradient: 'from-green-500 to-emerald-500'
        }
      case 'failed':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-500/10 dark:bg-red-500/20',
          borderColor: 'border-red-500/30 dark:border-red-400/30',
          icon: XCircle,
          gradient: 'from-red-500 to-pink-500'
        }
      case 'ongoing':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
          borderColor: 'border-blue-500/30 dark:border-blue-400/30',
          icon: Activity,
          gradient: 'from-blue-500 to-cyan-500'
        }
      default:
        return {
          color: 'text-slate-600 dark:text-slate-400',
          bgColor: 'bg-slate-500/10 dark:bg-slate-500/20',
          borderColor: 'border-slate-500/30 dark:border-slate-400/30',
          icon: Clock,
          gradient: 'from-slate-500 to-gray-500'
        }
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative group">
      {/* Hover background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xl"></div>
      
      <Card className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-thin text-slate-900 dark:text-white">Recent Calls</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Latest call activities</p>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/30 dark:border-slate-700/30">
                <th className="text-left py-4 px-6 text-sm font-light text-slate-600 dark:text-slate-400 uppercase tracking-wide">Agent</th>
                <th className="text-left py-4 px-6 text-sm font-light text-slate-600 dark:text-slate-400 uppercase tracking-wide">From Number</th>
                <th className="text-left py-4 px-6 text-sm font-light text-slate-600 dark:text-slate-400 uppercase tracking-wide">Duration</th>
                <th className="text-left py-4 px-6 text-sm font-light text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left py-4 px-6 text-sm font-light text-slate-600 dark:text-slate-400 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((call, index) => {
                const statusConfig = getStatusConfig(call.status)
                const StatusIcon = statusConfig.icon
                
                return (
                  <tr 
                    key={call.id} 
                    className={`border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-gradient-to-r hover:from-white/50 hover:to-purple-50/50 dark:hover:from-slate-800/50 dark:hover:to-purple-950/50 transition-all duration-300 group`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-light text-slate-900 dark:text-white">{call.agentName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-light text-slate-600 dark:text-slate-400 font-mono">{call.fromNumber}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-light text-slate-900 dark:text-white">{formatDuration(call.duration)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${statusConfig.borderColor} ${statusConfig.bgColor} backdrop-blur-sm`}>
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${statusConfig.gradient}`}></div>
                        <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                        <span className={`text-sm font-light capitalize ${statusConfig.color}`}>{call.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-light text-slate-600 dark:text-slate-400">{formatDate(call.startTime)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {recentCalls.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mx-auto mb-6">
              <Phone className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-thin text-slate-900 dark:text-white mb-2">No calls yet</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-light">Your recent call activities will appear here</p>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-violet-600/5 to-purple-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-pink-600/5 to-purple-600/5 rounded-full blur-2xl"></div>
      </Card>
    </div>
  )
}
