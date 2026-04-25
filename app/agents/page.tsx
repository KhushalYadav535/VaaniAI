'use client'

import { useState, useEffect } from 'react'
import { AgentCard } from '@/components/agents/agent-card'
import { CreateAgentDrawer } from '@/components/agents/create-agent-drawer'
import { mockAgents } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter, Zap, TrendingUp, Users, Activity } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      // @ts-ignore
      const { agentsApi } = await import('@/lib/api')
      const res: any = await agentsApi.getAll()
      setAgents(res.agents || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || agent.status === filterStatus
    return matchesSearch && matchesFilter
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'calls') return (b.callsCount || 0) - (a.callsCount || 0)
    if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return 0
  })

  const handleCreateAgent = async (newAgent: any) => {
    try {
      let tools = []
      if (newAgent.toolsJson) {
        try {
          tools = JSON.parse(newAgent.toolsJson)
        } catch(e) {
           alert("Invalid Tools JSON")
           return
        }
      }
      // @ts-ignore
      const { agentsApi } = await import('@/lib/api')
      await agentsApi.create({
        ...newAgent,
        tools
      })
      fetchAgents()
      setIsCreateOpen(false)
    } catch (e) {
      alert("Failed to create agent")
    }
  }

  const handleDeleteAgent = async (id: string) => {
    try {
      // @ts-ignore
      const { agentsApi } = await import('@/lib/api')
      await agentsApi.delete(id)
      fetchAgents()
    } catch (e) {
      alert("Failed to delete")
    }
  }

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    totalCalls: agents.reduce((sum, a) => sum + (a.callsCount || 0), 0),
    totalMinutes: agents.reduce((sum, a) => sum + (a.totalMinutes || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-pink-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="p-8 space-y-8">
        {/* Premium Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-thin tracking-tight text-slate-900 dark:text-white">
                      AI Agents
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
                      Create and manage your intelligent voice agents
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => window.location.href='/agents/new'}
                className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light px-6 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Agent
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: Zap, 
              label: 'Total Agents', 
              value: stats.total.toString(), 
              color: 'from-violet-600 to-purple-600',
              bgGradient: 'from-violet-600/10 to-purple-600/10'
            },
            { 
              icon: Activity, 
              label: 'Active Agents', 
              value: stats.active.toString(), 
              color: 'from-green-500 to-emerald-500',
              bgGradient: 'from-green-500/10 to-emerald-500/10'
            },
            { 
              icon: Users, 
              label: 'Total Calls', 
              value: stats.totalCalls.toLocaleString(), 
              color: 'from-blue-500 to-cyan-500',
              bgGradient: 'from-blue-500/10 to-cyan-500/10'
            },
            { 
              icon: TrendingUp, 
              label: 'Total Minutes', 
              value: (stats.totalMinutes / 1000).toFixed(1) + 'K', 
              color: 'from-orange-500 to-red-500',
              bgGradient: 'from-orange-500/10 to-red-500/10'
            },
          ].map((stat, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-105">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-light">{stat.label}</div>
                  <div className="text-3xl font-thin text-slate-900 dark:text-white">{stat.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="search"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 rounded-2xl"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-2xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-2xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="calls">Most Calls</SelectItem>
                  <SelectItem value="created">Recently Created</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="h-12 border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-2xl">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAgents.map((agent) => (
              <div key={agent._id} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-105">
                  <AgentCard
                    agent={agent}
                    onDelete={handleDeleteAgent}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-thin text-slate-900 dark:text-white mb-4">
              {agents.length === 0 ? 'No agents yet' : 'No agents found'}
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light mb-8">
              {agents.length === 0 
                ? 'Create your first AI voice agent to get started' 
                : 'Try adjusting your search or filters'
              }
            </p>
            {agents.length === 0 && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light px-8 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Agent
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
