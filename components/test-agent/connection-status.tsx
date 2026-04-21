'use client'

import { Card } from '@/components/ui/card'
import { Wifi, WifiOff } from 'lucide-react'

interface ConnectionStatusProps {
  status: 'idle' | 'connected' | 'listening'
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'listening':
        return {
          label: 'Listening',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          dotColor: 'bg-blue-500',
          icon: Wifi,
        }
      case 'connected':
        return {
          label: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          dotColor: 'bg-green-500',
          icon: Wifi,
        }
      case 'idle':
      default:
        return {
          label: 'Idle',
          color: 'text-slate-500',
          bgColor: 'bg-slate-500/10',
          dotColor: 'bg-slate-500',
          icon: WifiOff,
        }
    }
  }

  const display = getStatusDisplay()
  const Icon = display.icon

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <div className={`flex items-center gap-3 p-4 rounded-lg ${display.bgColor}`}>
        <div className="flex-shrink-0">
          <Icon className={`${display.color} w-5 h-5`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-200">Connection Status</p>
          <p className={`text-lg font-bold ${display.color}`}>{display.label}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${display.dotColor} ${status !== 'idle' ? 'animate-pulse' : ''}`} />
      </div>
    </Card>
  )
}
