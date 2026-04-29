'use client'

import { useState, useEffect } from 'react'
import { webhooksApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Check, 
  X, 
  RefreshCw,
  Globe,
  Lock,
  Activity,
  AlertTriangle
} from 'lucide-react'

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
  const [editingWebhook, setEditingWebhook] = useState<any>(null)
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    active: true,
  })

  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)

  const WebhookLogsTable = () => {
    const [webhookLogs, setWebhookLogs] = useState<any[]>([])
    const [loadingLogs, setLoadingLogs] = useState(true)

    useEffect(() => {
      const fetchLogs = async () => {
        try {
          // @ts-ignore
          const data: any = await window.webhooksLogsApi?.getAllLogs() || { logs: [] }
          setWebhookLogs(data.logs || [])
        } catch (e) {
          console.error(e)
        } finally {
          setLoadingLogs(false)
        }
      }
      // Assuming webhooksLogsApi is dynamically attached to window or imported
      import('@/lib/api').then(mod => {
        if((mod as any).webhooksLogsApi) {
          (mod as any).webhooksLogsApi.getAllLogs().then((res: any) => {
            setWebhookLogs(res.logs || [])
            setLoadingLogs(false)
          })
        } else {
          setLoadingLogs(false)
        }
      })
      
    }, [])

    if(loadingLogs) return <div className="text-center py-6 text-slate-500 font-light text-sm">Loading logs...</div>
    if(webhookLogs.length === 0) return <div className="text-center py-6 text-slate-500 font-light text-sm">Webhook delivery logging is currently empty.</div>

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {webhookLogs.map((log: any) => (
              <tr key={log._id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-mono text-xs">{log.event}</td>
                <td className="px-4 py-3 font-mono text-xs truncate max-w-[200px]">{log.webhookId?.url || 'Unknown'}</td>
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
    )
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      setIsLoading(true)
      const data: any = await webhooksApi.getAll()
      if (data && data.webhooks) {
        setWebhooks(
          data.webhooks.map((w: any) => ({
            ...w,
            id: w._id || w.id,
            lastTriggered: w.lastTriggered ? new Date(w.lastTriggered) : null,
          }))
        )
      }
    } catch (e) {
      console.error('Failed to fetch webhooks:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWebhook = async () => {
    try {
      await webhooksApi.create({
        ...newWebhook,
      })
      fetchWebhooks()
      setNewWebhook({ name: '', url: '', events: [], secret: '', active: true })
      setIsCreateOpen(false)
    } catch (e) {
      console.error('Failed to create webhook', e)
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    try {
      await webhooksApi.delete(id)
      fetchWebhooks()
    } catch (e) {
      console.error('Failed to delete webhook', e)
    }
  }

  const handleToggleWebhook = async (id: string) => {
    const webhook = webhooks.find((w) => w.id === id)
    if (!webhook) return
    try {
      await webhooksApi.update(id, { active: !webhook.active })
      fetchWebhooks()
    } catch (e) {
      console.error('Failed to toggle webhook', e)
    }
  }

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(secret)
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  const handleRegenerateSecret = async (id: string) => {
    const newSecret = `whsec_${Math.random().toString(36).substring(2, 15)}`
    try {
      await webhooksApi.update(id, { secret: newSecret })
      fetchWebhooks()
    } catch (e) {
      console.error('Failed to update secret', e)
    }
  }

  const toggleEvent = (eventId: string) => {
    if (newWebhook.events.includes(eventId)) {
      setNewWebhook({
        ...newWebhook,
        events: newWebhook.events.filter(e => e !== eventId)
      })
    } else {
      setNewWebhook({
        ...newWebhook,
        events: [...newWebhook.events, eventId]
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Webhooks</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-light">Manage webhooks to integrate with external services.</p>
        </div>

        <div className="flex items-center gap-4">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-slate-50">Create New Webhook</DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400 font-light">
                  Configure a webhook to receive real-time events
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-200 font-light">Webhook Name</Label>
                    <Input
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      placeholder="My Webhook"
                      className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 rounded-xl font-light"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-200 font-light">Endpoint URL</Label>
                    <Input
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://api.example.com/webhook"
                      className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 rounded-xl font-light"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-700 dark:text-slate-200 font-light">Events to Trigger</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                    {webhookEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          newWebhook.events.includes(event.id)
                            ? 'border-purple-500 dark:border-purple-600 bg-purple-500/10 dark:bg-purple-600/10'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        onClick={() => toggleEvent(event.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            newWebhook.events.includes(event.id) ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}></div>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Enable this webhook to receive events</p>
                  </div>
                  <Switch
                    checked={newWebhook.active}
                    onCheckedChange={(checked) => setNewWebhook({ ...newWebhook, active: checked })}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWebhook}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-md"
                    disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                  >
                    Create Webhook
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-light">
            <RefreshCw className="w-4 h-4 mr-2" />
            Test All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-1 rounded-2xl h-auto">
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light transition-all">Webhooks</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light transition-all">Delivery Logs</TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light transition-all">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500 font-light bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
                Loading webhooks...
              </div>
            ) : webhooks.length > 0 ? webhooks.map((webhook) => (
              <Card key={webhook.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
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
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {webhook.events.length} events
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {webhook.successRate ?? 100}% success rate
                        </div>
                        {webhook.lastTriggered && (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="w-4 h-4" />
                            Last triggered {Math.round((Date.now() - webhook.lastTriggered.getTime()) / (1000 * 60))} min ago
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 rounded-lg"
                        onClick={() => handleToggleWebhook(webhook.id)}
                      >
                        {webhook.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-200 text-sm font-light">Endpoint URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 break-all font-mono font-light">
                        {webhook.url}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 rounded-lg shrink-0"
                        onClick={() => navigator.clipboard.writeText(webhook.url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700 dark:text-slate-200 text-sm font-light">Secret Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 font-mono font-light">
                        {webhook.secret}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 rounded-lg shrink-0"
                        onClick={() => handleCopySecret(webhook.secret)}
                      >
                        {copiedSecret === webhook.secret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 rounded-lg shrink-0"
                        onClick={() => handleRegenerateSecret(webhook.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700 dark:text-slate-200 text-sm font-light">Trigger Events</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {webhook.events.map((eventId: string) => {
                        const event = webhookEvents.find(e => e.id === eventId)
                        return (
                          <Badge key={eventId} variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                            {event?.name || eventId}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12 text-slate-500 font-light bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
                No webhooks created yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50">Recent Delivery Logs</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
                Monitor webhook delivery status and troubleshoot issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <WebhookLogsTable />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50">Webhook Documentation</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
                Learn how to integrate with VoiceAgent webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Authentication</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-light">
                    All webhook requests include a signature header for verification:
                  </p>
                  <code className="block p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono font-light">
                    X-VoiceAgent-Signature: sha256=hash_of_payload
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Event Payload</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-light">
                    Example payload for call.started event:
                  </p>
                  <pre className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto font-mono font-light">
{`{
  "event": "call.started",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "callId": "call_123456",
    "agentId": "agent_789",
    "fromNumber": "+15551234567",
    "toNumber": "+15559876543",
    "direction": "inbound"
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Response Format</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-light">
                    Your endpoint should respond with a 2xx status code within 30 seconds:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside font-light">
                    <li>200 OK - Event processed successfully</li>
                    <li>202 Accepted - Event accepted for processing</li>
                    <li>4xx/5xx - Event will be retried (up to 3 times)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Retry Policy</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-light">
                    Failed webhook deliveries are retried with exponential backoff:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside font-light">
                    <li>Retry 1: 1 minute after failure</li>
                    <li>Retry 2: 5 minutes after failure</li>
                    <li>Retry 3: 15 minutes after failure</li>
                    <li>After 3 failures: webhook is disabled</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
