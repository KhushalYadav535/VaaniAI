'use client'

import { useState, useMemo, useEffect } from 'react'
import { CallsTable } from '@/components/logs/calls-table'
import { CallFilters } from '@/components/logs/call-filters'
import { callsApi } from '@/lib/api'
import { CallLog } from '@/lib/types'
import { MessageCircle } from 'lucide-react'

export default function ChatLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    agent: 'all',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const data = await callsApi.getAll({ limit: 200 })
      if (data && data.calls) {
        // Filter ONLY WhatsApp or text chats
        const chatLogs = data.calls.filter((c: any) => 
          c.fromNumber?.startsWith('whatsapp:') || !c.callSid
        )

        const mappedLogs = chatLogs.map((c: any) => ({
          ...c,
          id: c._id || c.id,
          agentId: c.agentId?._id || c.agentId || '',
          agentName: c.agentId?.name || c.agentName || 'Unknown Agent',
        }))
        setLogs(mappedLogs)
      }
    } catch (error) {
      console.error('Failed to fetch chat logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const statusMatch = filters.status === 'all' || log.status === filters.status
      const agentMatch = filters.agent === 'all' || log.agentId === filters.agent
      
      let dateMatch = true
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom)
        dateMatch = dateMatch && new Date(log.startTime) >= fromDate
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999)
        dateMatch = dateMatch && new Date(log.startTime) <= toDate
      }

      return statusMatch && agentMatch && dateMatch
    })
  }, [filters, logs])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Omni-Channel Chats</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-light text-sm">View WhatsApp and SMS conversation history.</p>
        </div>
      </div>

      <CallFilters filters={filters} onFiltersChange={setFilters} />
      
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 font-light text-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
          Loading chat history...
        </div>
      ) : (
        <CallsTable logs={filteredLogs} />
      )}
    </div>
  )
}
