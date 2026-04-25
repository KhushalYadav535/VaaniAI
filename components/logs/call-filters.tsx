'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { agentsApi } from '@/lib/api'

interface AgentOption {
  id: string
  name: string
}

interface CallFiltersProps {
  filters: {
    status: string
    agent: string
    dateFrom: string
    dateTo: string
  }
  onFiltersChange: (filters: any) => void
}

export function CallFilters({ filters, onFiltersChange }: CallFiltersProps) {
  const [agents, setAgents] = useState<AgentOption[]>([])

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const data: any = await agentsApi.getAll()
      if (data && data.agents) {
        setAgents(data.agents.map((a: any) => ({ id: a._id, name: a.name })))
      }
    } catch (e) {
      console.error('Failed to fetch agents filter:', e)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm transition-all duration-300">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-6">Filters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="status" className="text-slate-600 dark:text-slate-300 text-sm font-light">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 rounded-xl font-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="agent" className="text-slate-600 dark:text-slate-300 text-sm font-light">Agent</Label>
          <Select
            value={filters.agent}
            onValueChange={(value) => handleFilterChange('agent', value)}
          >
            <SelectTrigger className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 rounded-xl font-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dateFrom" className="text-slate-600 dark:text-slate-300 text-sm font-light">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light"
          />
        </div>

        <div>
          <Label htmlFor="dateTo" className="text-slate-600 dark:text-slate-300 text-sm font-light">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light"
          />
        </div>
      </div>
    </Card>
  )
}
