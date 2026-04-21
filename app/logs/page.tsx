'use client'

import { useState, useMemo } from 'react'
import { CallsTable } from '@/components/logs/calls-table'
import { CallFilters } from '@/components/logs/call-filters'
import { mockCallLogs } from '@/lib/mock-data'

export default function CallLogsPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    agent: 'all',
    dateFrom: '',
    dateTo: '',
  })

  const filteredLogs = useMemo(() => {
    return mockCallLogs.filter((log) => {
      const statusMatch = filters.status === 'all' || log.status === filters.status
      const agentMatch = filters.agent === 'all' || log.agentId === filters.agent
      
      let dateMatch = true
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom)
        dateMatch = dateMatch && new Date(log.startTime) >= fromDate
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo)
        dateMatch = dateMatch && new Date(log.startTime) <= toDate
      }

      return statusMatch && agentMatch && dateMatch
    })
  }, [filters])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Call Logs</h1>
        <p className="text-slate-400 mt-2">View and analyze all call history and recordings.</p>
      </div>

      <CallFilters filters={filters} onFiltersChange={setFilters} />
      <CallsTable logs={filteredLogs} />
    </div>
  )
}
