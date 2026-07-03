'use client'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDateTime } from '@/lib/utils'
import {
  X, TrendingUp, TrendingDown, Minus,
  MessageSquare, Phone, Clock, AlertTriangle,
  CheckCircle, Target, Lightbulb, Send, FileJson, FileText
} from 'lucide-react'

interface CallDetailPanelProps {
  call: any
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
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'ongoing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case 'negative':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      default:
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
    }
  }

  const getUrgencyColor = (level?: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getSentimentEmoji = (s?: string) => s === 'positive' ? '😊' : s === 'negative' ? '😠' : '😐'

  /** Export all call data as a formatted JSON file */
  const handleExportJSON = () => {
    try {
      const exportData = {
        id: call._id || call.id,
        agentName: call.agentName,
        startTime: call.startTime,
        duration: call.duration,
        status: call.status,
        direction: call.direction,
        fromNumber: call.fromNumber,
        sentiment: call.sentiment,
        customerIntent: call.customerIntent,
        emotion: call.emotion,
        summary: call.summary,
        topics: call.topics,
        decisions: call.decisions,
        actionItems: call.actionItems,
        urgencyLevel: call.urgencyLevel,
        followUpRequired: call.followUpRequired,
        transferredTo: call.transferredTo,
        transferReason: call.transferReason,
        extractedData: call.extractedData,
        transcript: call.transcript,
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `call-${call._id || call.id}-${new Date(call.startTime).toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export JSON:', err)
    }
  }

  /** Download a human-readable text report with full transcript */
  const handleDownloadReport = () => {
    try {
      const lines: string[] = []
      lines.push('═══════════════════════════════════════════════════')
      lines.push('                  CALL REPORT')
      lines.push('═══════════════════════════════════════════════════')
      lines.push('')
      lines.push(`Agent          : ${call.agentName || '—'}`)
      lines.push(`Date/Time      : ${formatDateTime(call.startTime)}`)
      lines.push(`Duration       : ${formatDuration(call.duration)}`)
      lines.push(`Direction      : ${call.direction || 'web'}`)
      lines.push(`From Number    : ${call.fromNumber || '—'}`)
      lines.push(`Status         : ${call.status}`)
      lines.push(`Sentiment      : ${call.sentiment || '—'}`)
      lines.push(`Emotion        : ${call.emotion || '—'}`)
      lines.push(`Customer Intent: ${call.customerIntent || '—'}`)
      lines.push(`Urgency Level  : ${call.urgencyLevel || '—'}`)
      lines.push(`Follow-up      : ${call.followUpRequired ? 'Yes' : 'No'}`)
      if (call.transferredTo) {
        lines.push(`Transferred To : ${call.transferredTo} (${call.transferReason || 'Manual'})`)
      }
      lines.push('')

      if (call.summary) {
        lines.push('── AI SUMMARY ─────────────────────────────────────')
        lines.push(call.summary)
        lines.push('')
      }

      if (call.topics && call.topics.length > 0) {
        lines.push('── TOPICS DISCUSSED ────────────────────────────────')
        call.topics.forEach((t: string) => lines.push(`  • ${t}`))
        lines.push('')
      }

      if (call.decisions && call.decisions.length > 0) {
        lines.push('── DECISIONS MADE ──────────────────────────────────')
        call.decisions.forEach((d: string) => lines.push(`  ✓ ${d}`))
        lines.push('')
      }

      if (call.actionItems && call.actionItems.length > 0) {
        lines.push('── ACTION ITEMS ────────────────────────────────────')
        call.actionItems.forEach((item: string, i: number) => lines.push(`  ${i + 1}. ${item}`))
        lines.push('')
      }

      if (call.extractedData && Object.keys(call.extractedData).length > 0) {
        lines.push('── EXTRACTED DATA ──────────────────────────────────')
        Object.entries(call.extractedData).forEach(([k, v]) => lines.push(`  ${k}: ${v}`))
        lines.push('')
      }

      if (call.transcript && Array.isArray(call.transcript) && call.transcript.length > 0) {
        lines.push('── TRANSCRIPT ──────────────────────────────────────')
        call.transcript.forEach((msg: any) => {
          const role = (msg.role || 'unknown').toUpperCase().padEnd(9)
          lines.push(`[${role}] ${msg.content}`)
        })
        lines.push('')
      }

      lines.push('═══════════════════════════════════════════════════')
      lines.push(`Generated: ${new Date().toLocaleString()}`)

      const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `call-report-${call._id || call.id}-${new Date(call.startTime).toISOString().slice(0, 10)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download report:', err)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="mx-auto w-full max-w-3xl max-h-[85vh] overflow-y-auto">
          <DrawerHeader className="flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10">
            <div>
              <DrawerTitle className="text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-500" />
                Call Details
              </DrawerTitle>
              <DrawerDescription className="text-slate-500 dark:text-slate-400">
                {call.agentName} • {formatDuration(call.duration)} • {formatDateTime(call.startTime)}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 rounded-xl">
                <X size={20} />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-5">

            {/* Status Row */}
            <div className="flex flex-wrap gap-2">
              <Badge className={`${getStatusColor(call.status)} border capitalize`}>
                {call.status}
              </Badge>
              {call.sentiment && (
                <Badge className={`${getSentimentColor(call.sentiment)} border capitalize`}>
                  {getSentimentEmoji(call.sentiment)} {call.sentiment}
                </Badge>
              )}
              {call.answeredBy && call.answeredBy !== '' && (
                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 capitalize">
                  {call.answeredBy === 'machine' ? '🤖 Voicemail' : call.answeredBy === 'human' ? '👤 Human' : call.answeredBy}
                </Badge>
              )}
              {call.urgencyLevel && call.urgencyLevel !== '' && (
                <Badge className={`${getUrgencyColor(call.urgencyLevel)} border capitalize`}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {call.urgencyLevel}
                </Badge>
              )}
              {call.followUpRequired && (
                <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  ⚡ Follow-up Required
                </Badge>
              )}
              {call.transferredTo && (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  📞 Transferred
                </Badge>
              )}
              {call.direction && (
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 capitalize">
                  {call.direction}
                </Badge>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
                <p className="text-xs text-slate-500 mb-1">Duration</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{formatDuration(call.duration)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
                <p className="text-xs text-slate-500 mb-1">Direction</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 capitalize">{call.direction || 'web'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
                <p className="text-xs text-slate-500 mb-1">Customer Intent</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 capitalize">{call.customerIntent || '—'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3">
                <p className="text-xs text-slate-500 mb-1">Emotion</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 capitalize">{call.emotion || '—'}</p>
              </div>
            </div>

            {/* AI Summary */}
            {call.summary && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl p-4 border border-purple-200/50 dark:border-purple-800/30">
                <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  AI Summary
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{call.summary}</p>
              </div>
            )}

            {/* Transfer Info */}
            {call.transferredTo && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Transferred to Human Agent
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Number</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{call.transferredTo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Reason</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">{call.transferReason?.replace(/_/g, ' ') || 'Manual Transfer'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Topics & Decisions */}
            {((call.topics && call.topics.length > 0) || (call.decisions && call.decisions.length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {call.topics && call.topics.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      Topics Discussed
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {call.topics.map((topic: string, i: number) => (
                        <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {call.decisions && call.decisions.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Decisions Made
                    </h3>
                    <ul className="space-y-1">
                      {call.decisions.map((d: string, i: number) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5">✓</span> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Items */}
            {call.actionItems && call.actionItems.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                  ⚡ Action Items
                </h3>
                <ul className="space-y-1.5">
                  {call.actionItems.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sentiment Timeline */}
            {call.liveSentimentTimeline && call.liveSentimentTimeline.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  📊 Sentiment Timeline
                </h3>
                <div className="flex items-end gap-1 h-12">
                  {call.liveSentimentTimeline.map((s: any, i: number) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all duration-300 cursor-pointer group relative ${
                        s.sentiment === 'positive'
                          ? 'bg-green-400 dark:bg-green-500'
                          : s.sentiment === 'negative'
                          ? 'bg-red-400 dark:bg-red-500'
                          : 'bg-yellow-400 dark:bg-yellow-500'
                      }`}
                      style={{ height: `${Math.max(20, (Math.abs(s.score) || 0.3) * 100)}%` }}
                      title={`${s.sentiment} (${s.score?.toFixed(2)}): ${s.text?.substring(0, 80)}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">Start</span>
                  <span className="text-[10px] text-slate-400">End</span>
                </div>
              </div>
            )}

            {/* Notifications Sent */}
            {call.notificationsSent && call.notificationsSent.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Post-Call Notifications
                </h3>
                <div className="space-y-2">
                  {call.notificationsSent.map((n: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{n.channel === 'whatsapp' ? '💬' : n.channel === 'sms' ? '📩' : '📧'}</span>
                        <span className="text-slate-700 dark:text-slate-300 capitalize">{n.channel}</span>
                        <span className="text-slate-400 text-xs">→ {n.to}</span>
                      </div>
                      <Badge className={`text-xs ${
                        n.status === 'sent'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {n.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-slate-200 dark:bg-slate-800" />

            {/* Transcript */}
            {call.transcript && Array.isArray(call.transcript) && call.transcript.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  Transcript
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
                  {call.transcript.map((msg: any, i: number) => (
                    <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-blue-700 dark:text-blue-400' : 'text-purple-700 dark:text-purple-400'}`}>
                      <span className="font-medium capitalize">{msg.role}:</span>{' '}
                      <span className="text-slate-700 dark:text-slate-300">{msg.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recording */}
            {call.recordingUrl && (
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3">Recording</h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                  <audio controls className="w-full">
                    <source src={call.recordingUrl} type="audio/mp3" />
                  </audio>
                </div>
              </div>
            )}

            {/* Extracted Data */}
            {call.extractedData && Object.keys(call.extractedData).length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  📋 Extracted Data
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(call.extractedData).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <p className="text-xs text-slate-400 capitalize">{key}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                id="export-json-btn"
                variant="outline"
                onClick={handleExportJSON}
                className="flex-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl gap-2"
              >
                <FileJson className="w-4 h-4" />
                Export JSON
              </Button>
              <Button
                id="download-report-btn"
                onClick={handleDownloadReport}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl gap-2"
              >
                <FileText className="w-4 h-4" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
