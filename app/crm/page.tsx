'use client'

import { useState } from 'react'
import { Users, Ticket, CheckCircle, Clock, Filter, Search, Download, Calendar, ArrowUpRight, MessageSquare, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { crmApi } from '@/lib/api'
import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

type Tab = 'leads' | 'tickets'

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<Tab>('leads')

  const [leads, setLeads] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leadsRes, ticketsRes] = await Promise.all([
        crmApi.getLeads(),
        crmApi.getTickets()
      ])
      
      if (leadsRes.success) setLeads(leadsRes.leads)
      if (ticketsRes.success) setTickets(ticketsRes.tickets)
    } catch (error) {
      console.error('Failed to fetch CRM data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return 'Just now'
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">CRM & Leads</h1>
                <p className="text-sm text-slate-500 font-light">Built-in lead and ticket management from AI interactions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 rounded-xl border-slate-200/50 dark:border-slate-700/50">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads Captured', value: leads.length.toString(), trend: '+12%', color: 'text-blue-600' },
          { label: 'Hot Leads', value: leads.filter(l => l.status === 'Hot').length.toString(), trend: '+5%', color: 'text-orange-500' },
          { label: 'Open Tickets', value: tickets.filter(t => t.status === 'Open').length.toString(), trend: '-2%', color: 'text-red-500' },
          { label: 'Total Tickets', value: tickets.length.toString(), trend: '-18%', color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-lg transition-all duration-300">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className={`text-3xl font-light ${stat.color}`}>{stat.value}</h3>
              <span className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-emerald-500'} bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Content */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        {/* Tab Header */}
        <div className="border-b border-slate-200/50 dark:border-slate-800/50 px-6 pt-4 flex items-center justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('leads')}
              className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'leads' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sales Leads
              </div>
              {activeTab === 'leads' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'tickets' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Service Requests
              </div>
              {activeTab === 'tickets' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
            </button>
          </div>
          
          <div className="pb-3 flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input placeholder={`Search ${activeTab}...`} className="pl-9 h-9 w-64 bg-slate-50 dark:bg-slate-800/50 border-slate-200/50 rounded-lg text-sm" />
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-lg border-slate-200/50">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-0 overflow-x-auto">
          {activeTab === 'leads' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Lead Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Interest & Value</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Captured By</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">No leads found. Start a sales agent campaign to generate leads.</td>
                  </tr>
                ) : leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{lead.name}</span>
                        <span className="text-xs text-slate-500 font-light">{lead._id.slice(-6).toUpperCase()} · {formatTime(lead.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}
                        </div>
                        {lead.email && <span className="text-xs text-slate-500">{lead.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{lead.interest || '-'}</span>
                        {lead.value && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{lead.value}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`
                        ${lead.status === 'Hot' ? 'bg-orange-50 text-orange-600 border-orange-200' : ''}
                        ${lead.status === 'Warm' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : ''}
                        ${lead.status === 'Cold' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                      `}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {lead.agentId?.name || 'AI Agent'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        View Details <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Issue Description</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">No tickets found.</td>
                  </tr>
                ) : tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{ticket._id.slice(-6).toUpperCase()}</span>
                        <span className="text-xs text-slate-500 font-light">{formatTime(ticket.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-slate-900 dark:text-white">{ticket.name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400" /> {ticket.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-[250px] truncate">
                      {ticket.issue}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className={`w-2 h-2 rounded-full ${
                          ticket.priority === 'High' ? 'bg-red-500' :
                          ticket.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        {ticket.priority}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`
                        ${ticket.status === 'Open' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                        ${ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                        ${ticket.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-200' : ''}
                      `}>
                        {ticket.status === 'Resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                        View Chat <MessageSquare className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
