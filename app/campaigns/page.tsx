'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { campaignsApi, agentsApi } from '@/lib/api'
import {
  Megaphone, Play, Pause, Trash2, Plus,
  Loader2, Zap, CheckCircle2,
  Clock, ShieldAlert, RefreshCw, Settings2, ChevronDown, ChevronUp,
} from 'lucide-react'

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'America/Los_Angeles', 'America/New_York', 'America/Chicago',
  'Europe/London', 'Europe/Berlin', 'Australia/Sydney',
]

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

interface CampaignDraft {
  name: string
  agentId: string
  numbersText: string
  fromNumbersText: string
  dncText: string
  schedule: {
    timezone: string
    dailyStartHour: number
    dailyEndHour: number
    daysOfWeek: number[]
  }
  retryPolicy: {
    maxAttempts: number
    backoffMinutes: number
    backoffStrategy: 'fixed' | 'exponential'
    retryOnStatuses: string[]
  }
  throttle: {
    maxConcurrentCalls: number
    callsPerMinute: number
  }
}

const defaultDraft = (): CampaignDraft => ({
  name: '',
  agentId: '',
  numbersText: '',
  fromNumbersText: '',
  dncText: '',
  schedule: {
    timezone: 'Asia/Kolkata',
    dailyStartHour: 9,
    dailyEndHour: 19,
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  retryPolicy: {
    maxAttempts: 3,
    backoffMinutes: 30,
    backoffStrategy: 'exponential',
    retryOnStatuses: ['no-answer', 'busy', 'failed'],
  },
  throttle: {
    maxConcurrentCalls: 5,
    callsPerMinute: 30,
  },
})

const CAMPAIGN_TEMPLATES = [
  {
    name: 'Inbound Lead Follow-Up',
    desc: 'Call warm leads within 24h of signup',
    draft: (): CampaignDraft => ({
      ...defaultDraft(),
      name: 'Inbound Lead Follow-Up',
      schedule: { timezone: 'Asia/Kolkata', dailyStartHour: 10, dailyEndHour: 20, daysOfWeek: [1, 2, 3, 4, 5, 6] },
      retryPolicy: { maxAttempts: 4, backoffMinutes: 15, backoffStrategy: 'exponential', retryOnStatuses: ['no-answer', 'busy', 'failed'] },
      throttle: { maxConcurrentCalls: 3, callsPerMinute: 20 },
    }),
  },
  {
    name: 'Debt Collection Notice',
    desc: 'Payment reminder sequence for overdue accounts',
    draft: (): CampaignDraft => ({
      ...defaultDraft(),
      name: 'Debt Collection – Round 1',
      schedule: { timezone: 'Asia/Kolkata', dailyStartHour: 9, dailyEndHour: 18, daysOfWeek: [1, 2, 3, 4, 5] },
      retryPolicy: { maxAttempts: 5, backoffMinutes: 60, backoffStrategy: 'fixed', retryOnStatuses: ['no-answer', 'busy', 'failed'] },
      throttle: { maxConcurrentCalls: 2, callsPerMinute: 10 },
    }),
  },
  {
    name: 'Customer Satisfaction Survey',
    desc: 'Post-interaction NPS / CSAT calls',
    draft: (): CampaignDraft => ({
      ...defaultDraft(),
      name: 'CSAT Survey – Post-Call',
      schedule: { timezone: 'Asia/Kolkata', dailyStartHour: 11, dailyEndHour: 21, daysOfWeek: [1, 2, 3, 4, 5, 6, 7] },
      retryPolicy: { maxAttempts: 2, backoffMinutes: 30, backoffStrategy: 'exponential', retryOnStatuses: ['no-answer'] },
      throttle: { maxConcurrentCalls: 10, callsPerMinute: 60 },
    }),
  },
  {
    name: 'Appointment Reminder',
    desc: '24h-before reminder with confirmation',
    draft: (): CampaignDraft => ({
      ...defaultDraft(),
      name: 'Appointment Reminder',
      schedule: { timezone: 'Asia/Kolkata', dailyStartHour: 8, dailyEndHour: 22, daysOfWeek: [1, 2, 3, 4, 5, 6, 7] },
      retryPolicy: { maxAttempts: 3, backoffMinutes: 10, backoffStrategy: 'fixed', retryOnStatuses: ['no-answer', 'busy'] },
      throttle: { maxConcurrentCalls: 15, callsPerMinute: 100 },
    }),
  },
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [draft, setDraft] = useState<CampaignDraft>(defaultDraft())
  const [creating, setCreating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [campRes, agentRes]: any = await Promise.all([
        campaignsApi.getAll(),
        agentsApi.getAll(),
      ])
      setCampaigns(campRes.campaigns || [])
      setAgents(agentRes.agents || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const parseLines = (text: string) =>
    text.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 5)

  const handleCreate = async () => {
    if (!draft.name || !draft.agentId || !draft.numbersText) return
    setCreating(true)

    const numbers = parseLines(draft.numbersText)
    const fromNumbers = parseLines(draft.fromNumbersText)
    const dncNumbers = parseLines(draft.dncText)

    try {
      await campaignsApi.create({
        name: draft.name,
        agentId: draft.agentId,
        phoneNumbers: numbers,
        fromNumbers,
        dncNumbers,
        schedule: draft.schedule,
        retryPolicy: draft.retryPolicy,
        throttle: draft.throttle,
      })
      setShowCreate(false)
      setDraft(defaultDraft())
      fetchData()
    } catch (e: any) {
      alert(`Failed to create campaign: ${e.message || ''}`)
    } finally {
      setCreating(false)
    }
  }

  const handleStart = async (id: string) => {
    try { await campaignsApi.start(id); fetchData() } catch { alert('Failed to start') }
  }
  const handlePause = async (id: string) => {
    try { await campaignsApi.pause(id); fetchData() } catch { alert('Failed to pause') }
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try { await campaignsApi.delete(id); fetchData() } catch { alert('Failed to delete') }
  }

  const toggleDay = (d: number) => {
    setDraft(p => ({
      ...p,
      schedule: {
        ...p.schedule,
        daysOfWeek: p.schedule.daysOfWeek.includes(d)
          ? p.schedule.daysOfWeek.filter(x => x !== d)
          : [...p.schedule.daysOfWeek, d].sort(),
      },
    }))
  }

  const toggleRetryStatus = (s: string) => {
    setDraft(p => ({
      ...p,
      retryPolicy: {
        ...p.retryPolicy,
        retryOnStatuses: p.retryPolicy.retryOnStatuses.includes(s)
          ? p.retryPolicy.retryOnStatuses.filter(x => x !== s)
          : [...p.retryPolicy.retryOnStatuses, s],
      },
    }))
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-pink-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Batch Campaigns</h1>
                <p className="text-sm text-slate-500 font-light">Outbound dialer with schedules, retries, and DNC.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Templates dropdown */}
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="rounded-xl text-xs font-light border-slate-200 dark:border-slate-700"
                  onBlur={() => setTimeout(() => setShowTemplates(false), 200)}
                >
                  Templates
                </Button>
                {showTemplates && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
                    {CAMPAIGN_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => {
                          const d = tpl.draft()
                          setDraft(d)
                          setShowCreate(true)
                          setShowTemplates(false)
                        }}
                      >
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{tpl.name}</div>
                        <div className="text-[10px] text-slate-500">{tpl.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={() => setShowCreate(!showCreate)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-light rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-6 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-thin">Create New Campaign</h2>

          {/* Basic */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-light text-slate-500 mb-1 block">Campaign Name</label>
                <Input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Lead Follow-up Q3" />
              </div>
              <div>
                <label className="text-xs font-light text-slate-500 mb-1 block">Agent</label>
                <select
                  value={draft.agentId}
                  onChange={e => setDraft(p => ({ ...p, agentId: e.target.value }))}
                  aria-label="Select agent for campaign"
                  className="w-full h-10 px-3 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="">Choose...</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-light text-slate-500">Phone Numbers (one per line, with country code)</label>
                <label className="text-[10px] cursor-pointer text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:underline">
                  <input type="file" accept=".csv,.txt" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const text = ev.target?.result as string
                        const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l && !l.startsWith(','))
                        setDraft(p => ({ ...p, numbersText: lines.join('\n') }))
                      }
                      reader.readAsText(file)
                      e.target.value = ''
                    }}
                  />
                  Import CSV
                </label>
              </div>
              <textarea
                value={draft.numbersText}
                onChange={e => setDraft(p => ({ ...p, numbersText: e.target.value }))}
                className="w-full h-32 px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono overflow-auto"
                placeholder="+919999999999&#10;+919888888888"
              />
              <p className="text-[10px] text-slate-400 mt-1">{parseLines(draft.numbersText).length} numbers parsed</p>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(s => !s)}
            className="flex items-center gap-2 text-sm font-light text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Advanced settings
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
              {/* Schedule */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> Schedule
                </div>
                <div>
                  <label className="text-xs font-light text-slate-500 mb-1 block">Timezone</label>
                  <select
                    value={draft.schedule.timezone}
                    onChange={e => setDraft(p => ({ ...p, schedule: { ...p.schedule, timezone: e.target.value } }))}
                    aria-label="Campaign timezone"
                    className="w-full h-10 px-3 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-light text-slate-500 mb-1 block">Start hour (0-23)</label>
                    <Input type="number" min={0} max={23}
                      value={draft.schedule.dailyStartHour}
                      onChange={e => setDraft(p => ({ ...p, schedule: { ...p.schedule, dailyStartHour: Number(e.target.value) } }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-light text-slate-500 mb-1 block">End hour (0-23)</label>
                    <Input type="number" min={0} max={23}
                      value={draft.schedule.dailyEndHour}
                      onChange={e => setDraft(p => ({ ...p, schedule: { ...p.schedule, dailyEndHour: Number(e.target.value) } }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-light text-slate-500 mb-1 block">Active days</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map(d => {
                      const active = draft.schedule.daysOfWeek.includes(d.value)
                      return (
                        <button
                          type="button"
                          key={d.value}
                          onClick={() => toggleDay(d.value)}
                          className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Retry */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry policy
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-light text-slate-500 mb-1 block">Max attempts</label>
                    <Input type="number" min={1} max={10}
                      value={draft.retryPolicy.maxAttempts}
                      onChange={e => setDraft(p => ({ ...p, retryPolicy: { ...p.retryPolicy, maxAttempts: Number(e.target.value) } }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-light text-slate-500 mb-1 block">Base backoff (minutes)</label>
                    <Input type="number" min={1}
                      value={draft.retryPolicy.backoffMinutes}
                      onChange={e => setDraft(p => ({ ...p, retryPolicy: { ...p.retryPolicy, backoffMinutes: Number(e.target.value) } }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-light text-slate-500 mb-1 block">Backoff strategy</label>
                  <select
                    value={draft.retryPolicy.backoffStrategy}
                    onChange={e => setDraft(p => ({ ...p, retryPolicy: { ...p.retryPolicy, backoffStrategy: e.target.value as 'fixed' | 'exponential' } }))}
                    aria-label="Backoff strategy"
                    className="w-full h-10 px-3 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="exponential">Exponential (30 → 60 → 120 min)</option>
                    <option value="fixed">Fixed (every N min)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-light text-slate-500 mb-1 block">Retry on statuses</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {['no-answer', 'busy', 'failed', 'voicemail'].map(s => {
                      const active = draft.retryPolicy.retryOnStatuses.includes(s)
                      return (
                        <button
                          type="button"
                          key={s}
                          onClick={() => toggleRetryStatus(s)}
                          className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Throttle */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <Zap className="w-3.5 h-3.5" /> Concurrency &amp; throttling
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-light text-slate-500 mb-1 block">Max concurrent calls</label>
                    <Input type="number" min={1} max={50}
                      value={draft.throttle.maxConcurrentCalls}
                      onChange={e => setDraft(p => ({ ...p, throttle: { ...p.throttle, maxConcurrentCalls: Number(e.target.value) } }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-light text-slate-500 mb-1 block">Calls per minute</label>
                    <Input type="number" min={1}
                      value={draft.throttle.callsPerMinute}
                      onChange={e => setDraft(p => ({ ...p, throttle: { ...p.throttle, callsPerMinute: Number(e.target.value) } }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-light text-slate-500 mb-1 block">From numbers (rotation pool, optional)</label>
                  <textarea
                    value={draft.fromNumbersText}
                    onChange={e => setDraft(p => ({ ...p, fromNumbersText: e.target.value }))}
                    className="w-full h-20 px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                    placeholder="+1415..., +1212..."
                  />
                </div>
              </div>

              {/* DNC */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <ShieldAlert className="w-3.5 h-3.5" /> Do-Not-Call list
                </div>
                <textarea
                  value={draft.dncText}
                  onChange={e => setDraft(p => ({ ...p, dncText: e.target.value }))}
                  className="w-full h-32 px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  placeholder="+919999999999&#10;Numbers listed here will be skipped (status=dnc-skipped)"
                />
                <p className="text-[10px] text-slate-400">{parseLines(draft.dncText).length} DNC entries</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setDraft(defaultDraft()) }}>Cancel</Button>
            <Button type="button" onClick={handleCreate}
              disabled={creating || !draft.name || !draft.agentId || !draft.numbersText}
              className="bg-purple-600 text-white hover:bg-purple-700">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
              Create Campaign
            </Button>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-light">No campaigns created yet.</div>
        ) : campaigns.map(camp => {
          const total = camp.totalNumbers || 0
          const done = (camp.completedCount || 0) + (camp.failedCount || 0)
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          return (
            <div key={camp._id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 relative group hover:shadow-xl transition-all">
              {/* Status badge */}
              <div className={`absolute top-4 right-4 text-xs font-light flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-white dark:bg-slate-950 shadow-sm ${
                camp.status === 'running' ? 'border-green-300 dark:border-green-700' : ''
              }`}>
                {camp.status === 'running' && <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Running</>}
                {camp.status === 'paused' && <><div className="w-2 h-2 rounded-full bg-orange-500" /> Paused {camp.progressPct ? `(${camp.progressPct}%)` : ''}</>}
                {camp.status === 'completed' && <><CheckCircle2 className="w-3 h-3 text-blue-500" /> Completed</>}
                {camp.status === 'draft' && <><div className="w-2 h-2 rounded-full bg-slate-400" /> Draft</>}
                {camp.status === 'scheduled' && <><Clock className="w-3 h-3 text-purple-500" /> Scheduled</>}
              </div>

              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1 pr-24">{camp.name}</h3>
              <div className="flex items-center gap-2 mb-4 text-sm font-light text-slate-500">
                <Zap className="w-3.5 h-3.5 text-purple-500" />
                <span>{camp.agentId?.name || 'Unknown Agent'}</span>
              </div>

              {/* Schedule preview */}
              {camp.schedule?.timezone && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                  <Clock className="w-3 h-3" />
                  {camp.schedule.dailyStartHour}:00–{camp.schedule.dailyEndHour}:00 {camp.schedule.timezone}
                </div>
              )}

              {/* Live status indicators */}
              {camp.status === 'running' && (
                <div className="flex items-center gap-2 mb-3 text-[11px] text-green-600 dark:text-green-400 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Dialing in progress...
                </div>
              )}

              {/* Progress */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-light text-slate-600 dark:text-slate-400">
                  <span>Progress ({done}/{total})</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000" style={{ width: `${total > 0 ? (camp.completedCount / total) * 100 : 0}%` }} />
                  <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-1000" style={{ width: `${total > 0 ? (camp.failedCount / total) * 100 : 0}%` }} />
                  {camp.dncSkippedCount > 0 && (
                    <div className="h-full bg-gradient-to-r from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500 transition-all duration-1000" style={{ width: `${total > 0 ? (camp.dncSkippedCount / total) * 100 : 0}%` }} />
                  )}
                </div>

                {/* Detailed stats grid */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="bg-green-50 dark:bg-green-500/5 rounded-xl p-2 text-center border border-green-200/50 dark:border-green-500/10">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">{camp.completedCount || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-green-500/60">Completed</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-500/5 rounded-xl p-2 text-center border border-red-200/50 dark:border-red-500/10">
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">{camp.failedCount || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-red-500/60">Failed</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-500/5 rounded-xl p-2 text-center border border-amber-200/50 dark:border-amber-500/10">
                    <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">{camp.retriedCount || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-amber-500/60">Retried</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 text-center border border-slate-200/50 dark:border-slate-700/50">
                    <div className="text-lg font-semibold text-slate-600 dark:text-slate-400">{camp.dncSkippedCount || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500/60">DNC</div>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex gap-1.5 pt-1 flex-wrap">
                  {camp.status === 'running' && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50">
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /> Active
                    </span>
                  )}
                  {camp.schedule?.timezone && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{camp.schedule.timezone}</span>
                  )}
                  {camp.schedule?.daysOfWeek?.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{camp.schedule.daysOfWeek.length}d/wk</span>
                  )}
                </div>
              </div>

              {/* Per-campaign analytics */}
              <div className="flex items-center justify-end -mt-1 mb-1">
                <button
                  type="button"
                  onClick={() => window.location.href = `/analytics?campaignId=${camp._id}`}
                  className="text-[10px] text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:underline flex items-center gap-1"
                >
                  View Analytics &rarr;
                </button>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                {camp.status === 'running' ? (
                  <Button type="button" variant="secondary" onClick={() => handlePause(camp._id)} className="flex-1 rounded-xl text-xs font-light h-9">
                    <Pause className="w-3.5 h-3.5 mr-2" /> Pause
                  </Button>
                ) : camp.status !== 'completed' ? (
                  <Button type="button" onClick={() => handleStart(camp._id)} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-xs font-light h-9 hover:from-green-600 hover:to-emerald-600">
                    <Play className="w-3.5 h-3.5 mr-2" /> Start Dialing
                  </Button>
                ) : (
                  <Button type="button" disabled variant="outline" className="flex-1 rounded-xl text-xs font-light h-9">
                    Finished
                  </Button>
                )}

                <Button type="button" variant="ghost" title="Delete campaign" onClick={() => handleDelete(camp._id)} className="w-9 h-9 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
