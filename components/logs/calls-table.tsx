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
        return 'bg-green-500/10 text-green-500'
      case 'failed':
        return 'bg-red-500/10 text-red-500'
      case 'ongoing':
        return 'bg-blue-500/10 text-blue-500'
      default:
        return 'bg-slate-500/10 text-slate-500'
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
      <Card className="bg-slate-900/50 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Date/Time</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Agent</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Phone Number</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Direction</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Duration</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Cost</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedCall(log)}>
                  <td className="py-4 px-6 text-sm text-slate-200">{formatDateTime(log.startTime)}</td>
                  <td className="py-4 px-6 text-sm text-slate-200">{log.agentName}</td>
                  <td className="py-4 px-6 text-sm text-slate-400">{log.fromNumber}</td>
                  <td className="py-4 px-6 text-sm text-slate-400 text-lg">{getDirectionLabel(log.direction)}</td>
                  <td className="py-4 px-6 text-sm text-slate-200">{formatDuration(log.duration)}</td>
                  <td className="py-4 px-6 text-sm">
                    <Badge className={`${getStatusColor(log.status)} border-0 capitalize`}>
                      {log.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-200">${(log.costCents / 100).toFixed(2)}</td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-50">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                        {log.recordingUrl && (
                          <DropdownMenuItem className="text-slate-50 focus:bg-slate-800">
                            <Play size={16} className="mr-2" />
                            Play Recording
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-slate-50 focus:bg-slate-800">
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
          <div className="text-center py-12">
            <p className="text-slate-400">No call logs match your filters</p>
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
