'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CallLog } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'
import { Play, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { CallDetailPanel } from './call-detail-panel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CallsTableProps {
  logs: CallLog[]
}

export function CallsTable({ logs }: CallsTableProps) {
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500'
      case 'ongoing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-500'
    }
  }

  const getDirectionLabel = (direction: string) => {
    return direction === 'inbound' ? '←' : '→'
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <>
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-md transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Date/Time</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Agent</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Phone Number</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Direction</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Duration</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Sentiment</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id || log._id} className="border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedCall(log)}>
                  <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-200">{formatDateTime(log.startTime)}</td>
                  <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-200 font-medium">{log.agentName}</td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">{log.fromNumber}</td>
                  <td className="py-4 px-6 text-sm text-slate-400 dark:text-slate-500 text-lg">{getDirectionLabel(log.direction)}</td>
                  <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-200">{formatDuration(log.duration)}</td>
                  <td className="py-4 px-6 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Badge className={`${getStatusColor(log.status)} border-0 capitalize font-normal`}>
                        {log.status}
                      </Badge>
                      {log.answeredBy === 'machine' && (
                        <span className="text-xs" title="Voicemail detected">🤖</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {log.sentiment ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        log.sentiment === 'positive'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : log.sentiment === 'negative'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {log.sentiment === 'positive' ? '😊' : log.sentiment === 'negative' ? '😠' : '😐'}
                        {log.sentiment}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-50">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {log.recordingUrl && (
                          <DropdownMenuItem className="text-slate-700 dark:text-slate-50 focus:bg-slate-100 dark:focus:bg-slate-800">
                            <Play size={16} className="mr-2" />
                            Play Recording
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-slate-700 dark:text-slate-50 focus:bg-slate-100 dark:focus:bg-slate-800">
                          Download Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
              <MoreVertical className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-light text-sm">No call logs match your filters</p>
          </div>
        )}
      </Card>

      {selectedCall && (
        <CallDetailPanel
          call={selectedCall}
          open={!!selectedCall}
          onOpenChange={(open) => !open && setSelectedCall(null)}
        />
      )}
    </>
  )
}
