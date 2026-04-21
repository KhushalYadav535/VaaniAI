'use client'

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
import { mockAgents } from '@/lib/mock-data'

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
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <h2 className="text-lg font-semibold text-slate-50 mb-6">Filters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="status" className="text-slate-200 text-sm">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="agent" className="text-slate-200 text-sm">Agent</Label>
          <Select
            value={filters.agent}
            onValueChange={(value) => handleFilterChange('agent', value)}
          >
            <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">All Agents</SelectItem>
              {mockAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dateFrom" className="text-slate-200 text-sm">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="mt-2 bg-slate-800 border-slate-700 text-slate-50 focus:border-purple-600"
          />
        </div>

        <div>
          <Label htmlFor="dateTo" className="text-slate-200 text-sm">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="mt-2 bg-slate-800 border-slate-700 text-slate-50 focus:border-purple-600"
          />
        </div>
      </div>
    </Card>
  )
}
