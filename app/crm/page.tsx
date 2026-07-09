'use client'

import { useState, useMemo, useEffect } from 'react'
import { Users, Ticket, CheckCircle, Search, Download, Phone, Edit2, Eye, TrendingUp, AlertCircle, Plus, Trash2, FileText, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { crmApi } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

type Tab = 'leads' | 'tickets'
type Lead = {
  _id: string
  name: string
  phone: string
  email: string
  interest: string
  status: 'Hot' | 'Warm' | 'Cold' | 'Converted' | 'Lost'
  value: string
  notes: string
  createdAt: string
  agentId?: { name: string }
}

type TicketType = {
  _id: string
  name: string
  phone: string
  email: string
  issue: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  resolution: string
  createdAt: string
  agentId?: { name: string }
}

const LEAD_STATUSES = ['Hot', 'Warm', 'Cold', 'Converted', 'Lost'] as const
const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const

const leadStatusColors: Record<string, string> = {
  Hot: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  Warm: 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  Cold: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  Converted: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  Lost: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
}

const ticketStatusColors: Record<string, string> = {
  Open: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  'In Progress': 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  Resolved: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  Closed: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
}

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<Tab>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editingLeadStatus, setEditingLeadStatus] = useState<string | null>(null)
  const [editingTicketStatus, setEditingTicketStatus] = useState<string | null>(null)

  // Add Lead dialog
  const [showAddLead, setShowAddLead] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', interest: '', status: 'Warm', value: '', notes: '' })

  // Add Ticket dialog
  const [showAddTicket, setShowAddTicket] = useState(false)
  const [newTicket, setNewTicket] = useState({ name: '', phone: '', email: '', issue: '', priority: 'Medium', status: 'Open' })

  // Edit Lead dialog
  const [editLead, setEditLead] = useState<Lead | null>(null)

  // Resolve Ticket dialog
  const [resolvingTicket, setResolvingTicket] = useState<TicketType | null>(null)
  const [resolutionText, setResolutionText] = useState('')

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
    } catch {
      return 'Just now'
    }
  }

  // ─── Leads Functions ─────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchTerm === '' ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.interest && lead.interest.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [leads, searchTerm, statusFilter])

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = searchTerm === '' ||
        ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.phone.includes(searchTerm) ||
        ticket.issue.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tickets, searchTerm, statusFilter])

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await crmApi.updateLead(leadId, { status: newStatus })
      setLeads(prev => prev.map(l => l._id === leadId ? { ...l, status: newStatus as any } : l))
      setEditingLeadStatus(null)
      toast.success('Lead status updated')
    } catch {
      toast.error('Failed to update lead status')
    }
  }

  const updateTicketStatus = async (ticketId: string, newStatus: string, resolution?: string) => {
    try {
      const payload: any = { status: newStatus }
      if (resolution) payload.resolution = resolution
      await crmApi.updateTicket(ticketId, payload)
      setTickets(prev => prev.map(t =>
        t._id === ticketId ? { ...t, status: newStatus as any, resolution: resolution || t.resolution } : t
      ))
      setEditingTicketStatus(null)
      toast.success('Ticket status updated')
    } catch {
      toast.error('Failed to update ticket status')
    }
  }

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.phone) {
      toast.error('Name and Phone are required')
      return
    }
    try {
      const res = await crmApi.createLead(newLead)
      if (res.success) {
        setLeads(prev => [res.lead, ...prev])
        setShowAddLead(false)
        setNewLead({ name: '', phone: '', email: '', interest: '', status: 'Warm', value: '', notes: '' })
        toast.success('Lead created successfully')
      }
    } catch {
      toast.error('Failed to create lead')
    }
  }

  const handleAddTicket = async () => {
    if (!newTicket.name || !newTicket.phone || !newTicket.issue) {
      toast.error('Name, Phone and Issue are required')
      return
    }
    try {
      const res = await crmApi.createTicket(newTicket)
      if (res.success) {
        setTickets(prev => [res.ticket, ...prev])
        setShowAddTicket(false)
        setNewTicket({ name: '', phone: '', email: '', issue: '', priority: 'Medium', status: 'Open' })
        toast.success('Ticket created successfully')
      }
    } catch {
      toast.error('Failed to create ticket')
    }
  }

  const handleEditLead = async () => {
    if (!editLead) return
    try {
      const res = await crmApi.updateLead(editLead._id, {
        name: editLead.name,
        phone: editLead.phone,
        email: editLead.email,
        interest: editLead.interest,
        status: editLead.status,
        value: editLead.value,
        notes: editLead.notes,
      })
      if (res.success) {
        setLeads(prev => prev.map(l => l._id === editLead._id ? { ...l, ...res.lead } : l))
        setEditLead(null)
        toast.success('Lead updated successfully')
      }
    } catch {
      toast.error('Failed to update lead')
    }
  }

  const handleResolveTicket = async () => {
    if (!resolvingTicket || !resolutionText.trim()) {
      toast.error('Please enter resolution details')
      return
    }
    await updateTicketStatus(resolvingTicket._id, 'Resolved', resolutionText.trim())
    setResolvingTicket(null)
    setResolutionText('')
  }

  const deleteLead = async (leadId: string) => {
    try {
      await crmApi.deleteLead(leadId)
      setLeads(prev => prev.filter(l => l._id !== leadId))
      toast.success('Lead deleted')
    } catch {
      toast.error('Failed to delete lead')
    }
  }

  const deleteTicket = async (ticketId: string) => {
    try {
      await crmApi.deleteTicket(ticketId)
      setTickets(prev => prev.filter(t => t._id !== ticketId))
      toast.success('Ticket deleted')
    } catch {
      toast.error('Failed to delete ticket')
    }
  }

  // ─── Export CSV ──────────────────────────────────────────────────────
  const exportCSV = () => {
    let csv = ''
    if (activeTab === 'leads') {
      csv = 'Name,Phone,Email,Interest,Status,Value,Notes,Created\n'
      leads.forEach(l => {
        csv += `"${l.name}","${l.phone}","${l.email}","${l.interest}","${l.status}","${l.value}","${l.notes}","${l.createdAt}"\n`
      })
    } else {
      csv = 'Ticket ID,Name,Phone,Email,Issue,Priority,Status,Resolution,Created\n'
      tickets.forEach(t => {
        csv += `"${t._id.slice(-6).toUpperCase()}","${t.name}","${t.phone}","${t.email}","${t.issue}","${t.priority}","${t.status}","${t.resolution}","${t.createdAt}"\n`
      })
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vocred_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${activeTab === 'leads' ? 'Leads' : 'Tickets'} exported as CSV`)
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
              <Button variant="outline" className="h-10 rounded-xl border-slate-200/50 dark:border-slate-700/50" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              {activeTab === 'leads' ? (
                <Button className="h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700" onClick={() => setShowAddLead(true)}>
                  <UserPlus className="w-4 h-4 mr-2" /> Add Lead
                </Button>
              ) : (
                <Button className="h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700" onClick={() => setShowAddTicket(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Ticket
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: leads.length.toString(), color: 'text-blue-600', icon: Users, bgColor: 'from-blue-500/10 to-cyan-500/10' },
          { label: 'Hot Leads', value: leads.filter(l => l.status === 'Hot').length.toString(), color: 'text-orange-500', icon: TrendingUp, bgColor: 'from-orange-500/10 to-amber-500/10' },
          { label: 'Open Tickets', value: tickets.filter(t => t.status === 'Open').length.toString(), color: 'text-red-500', icon: AlertCircle, bgColor: 'from-red-500/10 to-pink-500/10' },
          { label: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length.toString(), color: 'text-green-500', icon: CheckCircle, bgColor: 'from-green-500/10 to-emerald-500/10' },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.bgColor} dark:from-slate-900/60 dark:to-slate-800/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-800/50 flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className={`text-3xl font-light ${stat.color}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Tabs & Content */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        {/* Tab Header */}
        <div className="border-b border-slate-200/50 dark:border-slate-800/50 px-6 pt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-6">
            <button
              onClick={() => { setActiveTab('leads'); setStatusFilter('All'); setSearchTerm('') }}
              className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'leads' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sales Leads
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{leads.length}</Badge>
              </div>
              {activeTab === 'leads' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
            </button>
            <button
              onClick={() => { setActiveTab('tickets'); setStatusFilter('All'); setSearchTerm('') }}
              className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'tickets' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Service Requests
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{tickets.length}</Badge>
              </div>
              {activeTab === 'tickets' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />}
            </button>
          </div>

          <div className="pb-3 flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-56 bg-slate-50 dark:bg-slate-800/50 border-slate-200/50 rounded-lg text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 border-slate-200/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                {(activeTab === 'leads' ? LEAD_STATUSES : TICKET_STATUSES).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-0 overflow-x-auto">
          {activeTab === 'leads' ? (
            /* ─── Leads Table ─── */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Lead Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Interest & Value</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                          <Users className="w-7 h-7 text-blue-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {leads.length === 0 ? 'No leads yet' : 'No matching leads'}
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {leads.length === 0 ? 'Leads will appear here automatically when your AI agents capture them during calls, or add one manually.' : 'Try adjusting your search or filter.'}
                        </p>
                        {leads.length === 0 && (
                          <Button size="sm" className="mt-2 rounded-lg" onClick={() => setShowAddLead(true)}>
                            <UserPlus className="w-4 h-4 mr-1" /> Add Your First Lead
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filteredLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
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
                      {editingLeadStatus === lead._id ? (
                        <Select value={lead.status} onValueChange={(v) => updateLeadStatus(lead._id, v)}>
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`cursor-pointer hover:opacity-80 transition-opacity ${leadStatusColors[lead.status] || ''}`}
                          onClick={() => setEditingLeadStatus(lead._id)}
                        >
                          {lead.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {lead.agentId?.name || 'Manual'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {/* View */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Lead Details — {lead.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-sm font-medium text-slate-500">Name</p><p className="text-slate-900 dark:text-white">{lead.name}</p></div>
                                <div><p className="text-sm font-medium text-slate-500">Phone</p><p className="text-slate-900 dark:text-white">{lead.phone}</p></div>
                                <div><p className="text-sm font-medium text-slate-500">Email</p><p className="text-slate-900 dark:text-white">{lead.email || '-'}</p></div>
                                <div><p className="text-sm font-medium text-slate-500">Status</p><Badge variant="outline" className={leadStatusColors[lead.status]}>{lead.status}</Badge></div>
                              </div>
                              <div><p className="text-sm font-medium text-slate-500 mb-1">Interest</p><p className="text-slate-900 dark:text-white">{lead.interest || '-'}</p></div>
                              <div><p className="text-sm font-medium text-slate-500 mb-1">Value</p><p className="text-green-600 font-semibold">{lead.value || '-'}</p></div>
                              <div><p className="text-sm font-medium text-slate-500 mb-1">Notes</p><p className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-sm">{lead.notes || 'No notes'}</p></div>
                              <div className="pt-3 border-t"><p className="text-xs text-slate-500">Created {formatTime(lead.createdAt)} · Source: {lead.agentId?.name || 'Manual'}</p></div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {/* Edit */}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100" onClick={() => setEditLead({ ...lead })}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {/* Delete */}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { if (confirm('Delete this lead?')) deleteLead(lead._id) }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* ─── Tickets Table ─── */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                          <FileText className="w-7 h-7 text-indigo-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {tickets.length === 0 ? 'No tickets yet' : 'No matching tickets'}
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {tickets.length === 0 ? 'Tickets will appear here when your AI agents create them during customer interactions.' : 'Try adjusting your search or filter.'}
                        </p>
                        {tickets.length === 0 && (
                          <Button size="sm" className="mt-2 rounded-lg" onClick={() => setShowAddTicket(true)}>
                            <Plus className="w-4 h-4 mr-1" /> Create First Ticket
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">{ticket._id.slice(-6).toUpperCase()}</span>
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
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-[250px]">
                      <p className="truncate">{ticket.issue}</p>
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
                      {editingTicketStatus === ticket._id ? (
                        <Select value={ticket.status} onValueChange={(v) => updateTicketStatus(ticket._id, v)}>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TICKET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`cursor-pointer hover:opacity-80 transition-opacity ${ticketStatusColors[ticket.status] || ''}`}
                          onClick={() => setEditingTicketStatus(ticket._id)}
                        >
                          {ticket.status === 'Resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {ticket.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {/* View */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Ticket #{ticket._id.slice(-6).toUpperCase()}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-sm font-medium text-slate-500">Customer</p><p className="text-slate-900 dark:text-white">{ticket.name}</p></div>
                                <div><p className="text-sm font-medium text-slate-500">Phone</p><p className="text-slate-900 dark:text-white">{ticket.phone}</p></div>
                                <div><p className="text-sm font-medium text-slate-500">Email</p><p className="text-slate-900 dark:text-white">{ticket.email || '-'}</p></div>
                                <div>
                                  <p className="text-sm font-medium text-slate-500">Priority</p>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${ticket.priority === 'High' ? 'bg-red-500' : ticket.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                    <span className="text-slate-900 dark:text-white">{ticket.priority}</span>
                                  </div>
                                </div>
                                <div><p className="text-sm font-medium text-slate-500">Status</p><Badge variant="outline" className={ticketStatusColors[ticket.status]}>{ticket.status}</Badge></div>
                                <div><p className="text-sm font-medium text-slate-500">Created</p><p className="text-slate-900 dark:text-white text-sm">{formatTime(ticket.createdAt)}</p></div>
                              </div>
                              <div><p className="text-sm font-medium text-slate-500 mb-2">Issue Description</p><p className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-sm">{ticket.issue}</p></div>
                              {ticket.resolution && (
                                <div><p className="text-sm font-medium text-slate-500 mb-2">Resolution</p><p className="text-slate-900 dark:text-white bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">{ticket.resolution}</p></div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        {/* Resolve */}
                        {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => { setResolvingTicket(ticket); setResolutionText('') }}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Delete */}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { if (confirm('Delete this ticket?')) deleteTicket(ticket._id) }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Add Lead Dialog ─── */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /> Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Name *</Label>
                <Input placeholder="John Doe" value={newLead.name} onChange={(e) => setNewLead(p => ({ ...p, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Phone *</Label>
                <Input placeholder="+1 555-0123" value={newLead.phone} onChange={(e) => setNewLead(p => ({ ...p, phone: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input placeholder="john@example.com" value={newLead.email} onChange={(e) => setNewLead(p => ({ ...p, email: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Interest</Label>
                <Input placeholder="Product name or service" value={newLead.interest} onChange={(e) => setNewLead(p => ({ ...p, interest: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Deal Value</Label>
                <Input placeholder="$5,000" value={newLead.value} onChange={(e) => setNewLead(p => ({ ...p, value: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={newLead.status} onValueChange={(v) => setNewLead(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Notes</Label>
              <Textarea placeholder="Additional context..." value={newLead.notes} onChange={(e) => setNewLead(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddLead}>Create Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Ticket Dialog ─── */}
      <Dialog open={showAddTicket} onOpenChange={setShowAddTicket}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600" /> Create New Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Customer Name *</Label>
                <Input placeholder="Jane Smith" value={newTicket.name} onChange={(e) => setNewTicket(p => ({ ...p, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Phone *</Label>
                <Input placeholder="+1 555-0456" value={newTicket.phone} onChange={(e) => setNewTicket(p => ({ ...p, phone: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input placeholder="jane@example.com" value={newTicket.email} onChange={(e) => setNewTicket(p => ({ ...p, email: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Issue Description *</Label>
              <Textarea placeholder="Describe the issue..." value={newTicket.issue} onChange={(e) => setNewTicket(p => ({ ...p, issue: e.target.value }))} className="mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-sm">Priority</Label>
              <Select value={newTicket.priority} onValueChange={(v) => setNewTicket(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAddTicket}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Lead Dialog ─── */}
      <Dialog open={!!editLead} onOpenChange={(open) => { if (!open) setEditLead(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-600" /> Edit Lead</DialogTitle>
          </DialogHeader>
          {editLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Name</Label>
                  <Input value={editLead.name} onChange={(e) => setEditLead(p => p ? { ...p, name: e.target.value } : null)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Phone</Label>
                  <Input value={editLead.phone} onChange={(e) => setEditLead(p => p ? { ...p, phone: e.target.value } : null)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-sm">Email</Label>
                <Input value={editLead.email} onChange={(e) => setEditLead(p => p ? { ...p, email: e.target.value } : null)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Interest</Label>
                  <Input value={editLead.interest} onChange={(e) => setEditLead(p => p ? { ...p, interest: e.target.value } : null)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Value</Label>
                  <Input value={editLead.value} onChange={(e) => setEditLead(p => p ? { ...p, value: e.target.value } : null)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-sm">Status</Label>
                <Select value={editLead.status} onValueChange={(v) => setEditLead(p => p ? { ...p, status: v as any } : null)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Notes</Label>
                <Textarea value={editLead.notes} onChange={(e) => setEditLead(p => p ? { ...p, notes: e.target.value } : null)} className="mt-1" rows={3} />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEditLead}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Resolve Ticket Dialog ─── */}
      <Dialog open={!!resolvingTicket} onOpenChange={(open) => { if (!open) { setResolvingTicket(null); setResolutionText('') } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Resolve Ticket</DialogTitle>
          </DialogHeader>
          {resolvingTicket && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{resolvingTicket.name}</span>
                  <Badge variant="outline" className={ticketStatusColors[resolvingTicket.status]}>{resolvingTicket.status}</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{resolvingTicket.issue}</p>
              </div>
              <div>
                <Label className="text-sm">Resolution Details *</Label>
                <Textarea
                  placeholder="Describe how this issue was resolved..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleResolveTicket}>Mark Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
