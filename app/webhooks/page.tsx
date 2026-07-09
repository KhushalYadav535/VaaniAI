'use client'

import { useState, useEffect } from 'react'
import { webhooksApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { 
  Plus, Trash2, Edit2, Copy, Check, X, RefreshCw,
  Globe, Activity, Webhook, Send, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const webhookEvents = [
  { id: 'call.started', name: 'Call Started', description: 'Triggered when a call begins' },
  { id: 'call.ended', name: 'Call Ended', description: 'Triggered when a call ends' },
  { id: 'call.transcript', name: 'Transcript Available', description: 'When call transcript is ready' },
  { id: 'agent.created', name: 'Agent Created', description: 'When a new agent is created' },
  { id: 'agent.updated', name: 'Agent Updated', description: 'When an agent is modified' },
  { id: 'payment.failed', name: 'Payment Failed', description: 'When a payment fails' },
  { id: 'number.assigned', name: 'Number Assigned', description: 'When a number is assigned to agent' },
  { id: 'error.occurred', name: 'Error Occurred', description: 'When system errors happen' },
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  // Create/Edit form
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', url: '', events: [] as string[], active: true })

  // Logs
  const [webhookLogs, setWebhookLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => { fetchWebhooks() }, [])

  const fetchWebhooks = async () => {
    try {
      setIsLoading(true)
      const data: any = await webhooksApi.getAll()
      if (data?.webhooks) {
        setWebhooks(data.webhooks.map((w: any) => ({
          ...w, id: w._id || w.id,
          lastTriggered: w.lastTriggered ? new Date(w.lastTriggered) : null,
        })))
      }
    } catch { toast.error('Failed to fetch webhooks') }
    finally { setIsLoading(false) }
  }

  const fetchLogs = async () => {
    setLoadingLogs(true)
    try {
      const res: any = await webhooksApi.getLogs()
      setWebhookLogs(res.logs || [])
    } catch { setWebhookLogs([]) }
    finally { setLoadingLogs(false) }
  }

  const resetForm = () => {
    setFormData({ name: '', url: '', events: [], active: true })
    setFormMode('create')
    setEditId(null)
  }

  const openCreate = () => { resetForm(); setFormMode('create'); setIsCreateOpen(true) }
  const openEdit = (webhook: any) => {
    setFormMode('edit')
    setEditId(webhook.id)
    setFormData({ name: webhook.name, url: webhook.url, events: webhook.events || [], active: webhook.active })
    setIsCreateOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast.error('Name, URL, and at least one event are required')
      return
    }
    try {
      if (formMode === 'edit' && editId) {
        await webhooksApi.update(editId, formData)
        toast.success('Webhook updated')
      } else {
        await webhooksApi.create(formData)
        toast.success('Webhook created')
      }
      fetchWebhooks()
      resetForm()
      setIsCreateOpen(false)
    } catch {
      toast.error(`Failed to ${formMode} webhook`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook?')) return
    try {
      await webhooksApi.delete(id)
      toast.success('Webhook deleted')
      fetchWebhooks()
    } catch { toast.error('Failed to delete webhook') }
  }

  const handleToggle = async (id: string) => {
    const wh = webhooks.find(w => w.id === id)
    if (!wh) return
    try {
      await webhooksApi.update(id, { active: !wh.active })
      toast.success(wh.active ? 'Webhook disabled' : 'Webhook enabled')
      fetchWebhooks()
    } catch { toast.error('Failed to toggle webhook') }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const res: any = await webhooksApi.test(id)
      if (res.success) toast.success(res.message || 'Test successful')
      else toast.error(res.message || 'Test failed')
    } catch (e: any) { toast.error(e.message || 'Test failed — could not reach URL') }
    finally { setTestingId(null) }
  }

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(secret)
    toast.success('Secret copied')
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  const handleRegenerateSecret = async (id: string) => {
    const newSecret = `whsec_${Math.random().toString(36).substring(2, 15)}`
    try {
      await webhooksApi.update(id, { secret: newSecret })
      toast.success('Secret regenerated')
      fetchWebhooks()
    } catch { toast.error('Failed to regenerate secret') }
  }

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Webhooks</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-light">Manage webhooks to integrate with external services.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Create Webhook
          </Button>
        </div>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6" onValueChange={(v) => { if (v === 'logs') fetchLogs() }}>
        <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-1 rounded-2xl h-auto">
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light">Webhooks</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light">Delivery Logs</TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light">Documentation</TabsTrigger>
        </TabsList>

        {/* ─── Webhooks Tab ─── */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500 font-light bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading webhooks...
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                <Webhook className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No webhooks yet</h3>
                <p className="text-sm text-slate-500 mb-4">Create a webhook to receive real-time event notifications.</p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" /> Create First Webhook
                </Button>
              </div>
            ) : webhooks.map((webhook) => (
              <Card key={webhook.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-slate-900 dark:text-slate-50">{webhook.name}</CardTitle>
                        <Badge variant={webhook.active ? 'default' : 'secondary'} className="font-normal">
                          {webhook.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 font-light">
                        <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {webhook.events.length} events</span>
                        {webhook.lastTriggered && (
                          <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Last {Math.round((Date.now() - webhook.lastTriggered.getTime()) / (1000 * 60))}m ago</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50" onClick={() => handleTest(webhook.id)} disabled={testingId === webhook.id}>
                        {testingId === webhook.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => openEdit(webhook)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => handleToggle(webhook.id)}>
                        {webhook.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDelete(webhook.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-200 text-sm font-light">Endpoint URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 break-all font-mono font-light">{webhook.url}</code>
                      <Button size="icon" variant="ghost" className="shrink-0" onClick={() => { navigator.clipboard.writeText(webhook.url); toast.success('URL copied') }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-200 text-sm font-light">Secret Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 font-mono font-light">{webhook.secret}</code>
                      <Button size="icon" variant="ghost" className="shrink-0" onClick={() => handleCopySecret(webhook.secret)}>
                        {copiedSecret === webhook.secret ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="shrink-0" onClick={() => handleRegenerateSecret(webhook.id)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-200 text-sm font-light">Events</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {webhook.events.map((eventId: string) => (
                        <Badge key={eventId} variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                          {webhookEvents.find(e => e.id === eventId)?.name || eventId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── Logs Tab ─── */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 dark:text-slate-50">Delivery Logs</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 font-light">Monitor webhook delivery status</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} className="rounded-lg">
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
              ) : webhookLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm font-light">No delivery logs yet. Logs will appear once webhooks are triggered.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 font-medium">Event</th>
                        <th className="px-4 py-3 font-medium">Webhook</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {webhookLogs.map((log: any) => (
                        <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-3 font-mono text-xs">{log.event}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{log.webhookId?.name || log.webhookId?.url || 'Unknown'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="font-normal text-[10px]">
                              {log.status} {log.statusCode ? `(${log.statusCode})` : ''}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-light text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Docs Tab ─── */}
        <TabsContent value="docs" className="space-y-6">
          <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50">Webhook Documentation</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 font-light">Learn how to integrate with Vocred webhooks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Authentication</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-light">All webhook requests include a signature header for verification:</p>
                  <code className="block p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono font-light">X-Vocred-Signature: sha256=hash_of_payload</code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Event Payload</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-light">Example payload for call.ended event:</p>
                  <pre className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto font-mono font-light">
{`{
  "event": "call.ended",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "callId": "call_123456",
    "agentId": "agent_789",
    "duration": 300,
    "transcript": "...",
    "summary": "Customer asked about pricing..."
  }
}`}
                  </pre>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Retry Policy</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside font-light">
                    <li>Your endpoint should respond with 2xx within 30 seconds</li>
                    <li>Retry 1: 1 minute after failure</li>
                    <li>Retry 2: 5 minutes after failure</li>
                    <li>Retry 3: 15 minutes after failure</li>
                    <li>After 3 failures: webhook is automatically disabled</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Create / Edit Dialog ─── */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) { resetForm(); setIsCreateOpen(false) } else setIsCreateOpen(true) }}>
        <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-50">{formMode === 'edit' ? 'Edit Webhook' : 'Create New Webhook'}</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 font-light">
              Configure a webhook to receive real-time events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-200 font-light">Webhook Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="My Webhook" className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl font-light" />
              </div>
              <div>
                <Label className="text-slate-700 dark:text-slate-200 font-light">Endpoint URL</Label>
                <Input value={formData.url} onChange={(e) => setFormData(p => ({ ...p, url: e.target.value }))} placeholder="https://api.example.com/webhook" className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl font-light" />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-200 font-light">Events to Trigger</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                {webhookEvents.map((event) => (
                  <div key={event.id} onClick={() => toggleEvent(event.id)} className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.events.includes(event.id)
                      ? 'border-purple-500 dark:border-purple-600 bg-purple-500/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.events.includes(event.id) ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-50 text-sm">{event.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-light">{event.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-700 dark:text-slate-200 font-light">Active</Label>
                <p className="text-sm text-slate-500 font-light">Enable this webhook to receive events</p>
              </div>
              <Switch checked={formData.active} onCheckedChange={(checked) => setFormData(p => ({ ...p, active: checked }))} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline" className="rounded-xl">Cancel</Button></DialogClose>
            <Button onClick={handleSubmit} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl" disabled={!formData.name || !formData.url || formData.events.length === 0}>
              {formMode === 'edit' ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
