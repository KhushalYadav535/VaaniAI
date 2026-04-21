'use client'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { CallLog } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDateTime } from '@/lib/utils'
import { X } from 'lucide-react'

interface CallDetailPanelProps {
  call: CallLog
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CallDetailPanel({
  call,
  open,
  onOpenChange,
}: CallDetailPanelProps) {
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-slate-900 border-slate-800">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-slate-50">Call Details</DrawerTitle>
              <DrawerDescription className="text-slate-400">
                Call ID: {call.id}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-50">
                <X size={20} />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Agent</p>
                <p className="text-slate-50 font-medium">{call.agentName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Status</p>
                <Badge className={`${getStatusColor(call.status)} border-0 capitalize`}>
                  {call.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">From</p>
                <p className="text-slate-50 font-medium">{call.fromNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">To</p>
                <p className="text-slate-50 font-medium">{call.toNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Duration</p>
                <p className="text-slate-50 font-medium">{formatDuration(call.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Started</p>
                <p className="text-slate-50 font-medium text-sm">{formatDateTime(call.startTime)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Cost</p>
                <p className="text-slate-50 font-medium">${(call.costCents / 100).toFixed(2)}</p>
              </div>
            </div>

            <Separator className="bg-slate-800" />

            {call.transcript && (
              <div>
                <h3 className="text-lg font-semibold text-slate-50 mb-4">Transcript</h3>
                <div className="bg-slate-800/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {call.transcript}
                  </p>
                </div>
              </div>
            )}

            {call.recordingUrl && (
              <div>
                <h3 className="text-lg font-semibold text-slate-50 mb-4">Recording</h3>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <audio controls className="w-full">
                    <source src={call.recordingUrl} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-slate-700 text-slate-50 hover:bg-slate-800"
              >
                Export
              </Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                Download Details
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
