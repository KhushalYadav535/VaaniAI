'use client'

import { useState, useMemo, useEffect } from 'react'
import { CallsTable } from '@/components/logs/calls-table'
import { CallFilters } from '@/components/logs/call-filters'
import { callsApi } from '@/lib/api'
import { CallLog } from '@/lib/types'
import { Search, X, Loader2 } from 'lucide-react'

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    agent: 'all',
    dateFrom: '',
    dateTo: '',
  })

  // Transcript full-text search — debounced server call to /api/calls/search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CallLog[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => { fetchLogs() }, [])

  // Debounce search — 350ms after typing stops
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return }
    const t = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data: any = await callsApi.search(searchQuery.trim(), { limit: 100 })
        const mapped = (data?.calls || data?.results || []).map((c: any) => ({
          ...c,
          id: c._id || c.id,
          agentId: c.agentId?._id || c.agentId || '',
          agentName: c.agentId?.name || c.agentName || 'Unknown Agent',
        }))
        setSearchResults(mapped)
      } catch (e) {
        console.error('Transcript search failed:', e)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const data = await callsApi.getAll({ limit: 100 })
      if (data && data.calls) {
        const mappedLogs = data.calls.map((c: any) => ({
          ...c,
          id: c._id || c.id,
          agentId: c.agentId?._id || c.agentId || '',
          agentName: c.agentId?.name || c.agentName || 'Unknown Agent',
        }))
        setLogs(mappedLogs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // When a transcript search is active, search results bypass filters.
  // Otherwise apply filters to the full list.
  const filteredLogs = useMemo(() => {
    const source = searchResults !== null ? searchResults : logs
    return source.filter((log) => {
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
  }, [filters, logs, searchResults])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Call Logs</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 font-light">View and analyze all call history and recordings.</p>
      </div>

      {/* Transcript search bar — full-text search across all call transcripts */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transcripts (e.g. 'refund', 'pricing', customer name)..."
          aria-label="Search call transcripts"
          className="w-full h-11 pl-11 pr-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
        />
        {isSearching && (
          <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin" />
        )}
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            title="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {searchResults !== null && !isSearching && (
          <div className="absolute -bottom-6 left-2 text-[11px] text-slate-500">
            {searchResults.length} transcript match{searchResults.length === 1 ? '' : 'es'}
          </div>
        )}
      </div>

      <CallFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="text-center py-12 text-slate-500 font-light text-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
          Loading call logs...
        </div>
      ) : (
        <CallsTable logs={filteredLogs} />
      )}
    </div>
  )
}
