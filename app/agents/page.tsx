'use client'

import { useState, useEffect, useCallback } from 'react'
import { AgentCard } from '@/components/agents/agent-card'
import { CreateAgentModal } from '@/components/agents/create-agent-modal'
import { Button } from '@/components/ui/button'
import {
  Plus, Search, LayoutGrid, List, Zap, TrendingUp, Users, Activity,
  SlidersHorizontal, RefreshCw, Bot, Sparkles, ChevronDown
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

type ViewMode = 'grid' | 'list'
type SortKey = 'name' | 'calls' | 'created' | 'status'
type FilterStatus = 'all' | 'active' | 'inactive'

function SkeletonCard() {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden animate-pulse">
      <div className="h-1 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600" />
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-full" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-9 flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bgGradient, trend }: any) {
  return (
    <div className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-1 hover:border-purple-500/20 overflow-hidden">
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-light mb-1">{label}</div>
        <div className="text-3xl font-thin text-slate-900 dark:text-white">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-500 font-medium">{trend}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortKey>('created')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchAgents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const { agentsApi } = await import('@/lib/api')
      const res: any = await agentsApi.getAll()
      setAgents(res.agents || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  const filteredAgents = agents
    .filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.systemPrompt?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === 'all' || agent.status === filterStatus
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'calls') return (b.callsCount || 0) - (a.callsCount || 0)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const handleDeleteAgent = async (id: string) => {
    try {
      const { agentsApi } = await import('@/lib/api')
      await agentsApi.delete(id)
      fetchAgents(true)
    } catch (e) {
      alert('Failed to delete agent')
    }
  }

  const handleCreateAgent = async (data: any) => {
    try {
      const { agentsApi } = await import('@/lib/api')
      await agentsApi.create(data)
      setCreateOpen(false)
      fetchAgents(true)
    } catch (e) {
      alert('Failed to create agent')
    }
  }

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    totalCalls: agents.reduce((sum, a) => sum + (a.callsCount || 0), 0),
    totalMinutes: agents.reduce((sum, a) => sum + (a.totalMinutes || 0), 0),
  }

  const SORT_LABELS: Record<SortKey, string> = {
    created: 'Recently Created',
    name: 'Name A–Z',
    calls: 'Most Calls',
    status: 'Status',
  }

  const FILTER_LABELS: Record<FilterStatus, string> = {
    all: 'All Agents',
    active: 'Active Only',
    inactive: 'Inactive Only',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-[10%] w-96 h-96 bg-gradient-to-br from-violet-600/8 to-purple-600/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-[5%] w-80 h-80 bg-gradient-to-br from-pink-600/8 to-purple-600/8 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/4 to-violet-500/4 rounded-full blur-3xl" />
      </div>

      <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">

        {/* ── Header ── */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-xl" />
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-xl shadow-purple-500/30 flex-shrink-0">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h1 className="text-3xl font-thin tracking-tight text-slate-900 dark:text-white">AI Agents</h1>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 rounded-full text-xs font-medium border border-violet-200 dark:border-violet-500/20">
                      <Sparkles className="w-3 h-3" />
                      {stats.total} total
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-light text-sm">
                    Create, configure, and deploy intelligent voice agents
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchAgents(true)}
                  disabled={refreshing}
                  className="h-10 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-slate-700/50 rounded-xl"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="h-10 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light px-6 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/35 hover:scale-105 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Agent
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={Zap}       label="Total Agents"  value={stats.total}                  color="from-violet-600 to-purple-600" bgGradient="from-violet-600/5 to-purple-600/5" />
          <StatCard icon={Activity}  label="Active Now"    value={stats.active}                 color="from-emerald-500 to-green-500"  bgGradient="from-emerald-500/5 to-green-500/5" />
          <StatCard icon={Users}     label="Total Calls"   value={stats.totalCalls.toLocaleString()} color="from-blue-500 to-cyan-500" bgGradient="from-blue-500/5 to-cyan-500/5" />
          <StatCard icon={TrendingUp} label="Minutes Used" value={stats.totalMinutes >= 1000 ? `${(stats.totalMinutes/1000).toFixed(1)}K` : stats.totalMinutes} color="from-orange-500 to-amber-500" bgGradient="from-orange-500/5 to-amber-500/5" />
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <Input
                type="search"
                placeholder="Search agents by name or description…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 rounded-2xl text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-11 px-4 rounded-2xl border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 font-light gap-2">
                    {FILTER_LABELS[filterStatus]}
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl">
                  {(['all', 'active', 'inactive'] as FilterStatus[]).map(s => (
                    <DropdownMenuItem key={s} onClick={() => setFilterStatus(s)} className={`rounded-xl mx-1 my-0.5 ${filterStatus === s ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {FILTER_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-11 px-4 rounded-2xl border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 font-light gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {SORT_LABELS[sortBy]}
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl">
                  {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                    <DropdownMenuItem key={key} onClick={() => setSortBy(key)} className={`rounded-xl mx-1 my-0.5 ${sortBy === key ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all duration-200 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all duration-200 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filters summary */}
          {(searchQuery || filterStatus !== 'all') && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span>Showing <strong className="text-slate-700 dark:text-slate-200">{filteredAgents.length}</strong> of <strong className="text-slate-700 dark:text-slate-200">{agents.length}</strong> agents</span>
              <button
                onClick={() => { setSearchQuery(''); setFilterStatus('all') }}
                className="ml-auto text-purple-600 dark:text-purple-400 hover:underline font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* ── Agents Grid / List ── */}
        {loading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
            : 'flex flex-col gap-3'
          }>
            {[...Array(6)].map((_, i) => (
              viewMode === 'grid'
                ? <SkeletonCard key={i} />
                : <div key={i} className="h-20 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : filteredAgents.length > 0 ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
            : 'flex flex-col gap-3'
          }>
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                onDelete={handleDeleteAgent}
                onRefresh={() => fetchAgents(true)}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/30">
                {agents.length === 0 ? <Bot className="w-10 h-10 text-white" /> : <Search className="w-10 h-10 text-white" />}
              </div>
              <h3 className="text-2xl font-thin text-slate-900 dark:text-white mb-3">
                {agents.length === 0 ? 'No agents yet' : 'No agents found'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-light mb-8 leading-relaxed">
                {agents.length === 0
                  ? 'Create your first AI voice agent. It only takes a minute to set up a fully functional voice assistant.'
                  : 'Try adjusting your search or filter to find what you\'re looking for.'}
              </p>
              {agents.length === 0 ? (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light px-8 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Agent
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/agent-templates'}
                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Browse Templates
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => { setSearchQuery(''); setFilterStatus('all') }}
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Create Agent Modal ── */}
      <CreateAgentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateAgent}
      />
    </div>
  )
}
