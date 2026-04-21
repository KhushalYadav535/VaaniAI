'use client'

import { useState } from 'react'
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

const mockWebhooks = [
  {
    id: '1',
    name: 'CRM Integration',
    url: 'https://api.mycompany.com/webhooks/voiceagent',
    events: ['call.started', 'call.ended', 'call.transcript'],
    secret: 'whsec_1234567890abcdef',
    active: true,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
    successRate: 98.5,
  },
  {
    id: '2',
    name: 'Analytics Pipeline',
    url: 'https://analytics.myapp.com/webhooks',
    events: ['call.ended', 'call.transcript'],
    secret: 'whsec_fedcba0987654321',
    active: true,
    lastTriggered: new Date(Date.now() - 30 * 60 * 1000),
    successRate: 99.2,
  },
  {
    id: '3',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    events: ['error.occurred', 'payment.failed'],
    secret: 'whsec_slack_secret_key',
    active: false,
    lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000),
    successRate: 95.0,
  },
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState(mockWebhooks)
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

  const handleCreateWebhook = () => {
    const webhook = {
      id: String(webhooks.length + 1),
      ...newWebhook,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      lastTriggered: new Date(),
      successRate: 0,
    }
    setWebhooks([...webhooks, webhook])
    setNewWebhook({ name: '', url: '', events: [], secret: '', active: true })
    setIsCreateOpen(false)
  }

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id))
  }

  const handleToggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ))
  }

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(secret)
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  const handleRegenerateSecret = (id: string) => {
    const newSecret = `whsec_${Math.random().toString(36).substring(2, 15)}`
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, secret: newSecret } : w
    ))
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
          <h1 className="text-3xl font-bold text-slate-50">Webhooks</h1>
          <p className="text-slate-400 mt-2">Manage webhooks to integrate with external services.</p>
        </div>

        <div className="flex items-center gap-4">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-50">Create New Webhook</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Configure a webhook to receive real-time events
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Webhook Name</Label>
                    <Input
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      placeholder="My Webhook"
                      className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">Endpoint URL</Label>
                    <Input
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://api.example.com/webhook"
                      className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-200">Events to Trigger</Label>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {webhookEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          newWebhook.events.includes(event.id)
                            ? 'border-purple-600 bg-purple-600/10'
                            : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                        }`}
                        onClick={() => toggleEvent(event.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            newWebhook.events.includes(event.id) ? 'bg-purple-600' : 'bg-slate-600'
                          }`}></div>
                          <div>
                            <p className="font-medium text-slate-50 text-sm">{event.name}</p>
                            <p className="text-xs text-slate-400">{event.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-200">Active</Label>
                    <p className="text-sm text-slate-400">Enable this webhook to receive events</p>
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
                    className="border-slate-700 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateWebhook}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                  >
                    Create Webhook
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="border-slate-700 text-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Test All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-slate-800">Webhooks</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-slate-800">Delivery Logs</TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-slate-800">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-slate-50">{webhook.name}</CardTitle>
                        <Badge variant={webhook.active ? 'default' : 'secondary'}>
                          {webhook.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {webhook.events.length} events
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {webhook.successRate}% success rate
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
                        className="text-slate-400 hover:text-slate-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-50"
                        onClick={() => handleToggleWebhook(webhook.id)}
                      >
                        {webhook.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-400"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-200 text-sm">Endpoint URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-slate-800 rounded text-sm text-slate-300 break-all">
                        {webhook.url}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-50"
                        onClick={() => navigator.clipboard.writeText(webhook.url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-200 text-sm">Secret Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-slate-800 rounded text-sm text-slate-300 font-mono">
                        {webhook.secret}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-50"
                        onClick={() => handleCopySecret(webhook.secret)}
                      >
                        {copiedSecret === webhook.secret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-50"
                        onClick={() => handleRegenerateSecret(webhook.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-200 text-sm">Trigger Events</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {webhook.events.map((eventId) => {
                        const event = webhookEvents.find(e => e.id === eventId)
                        return (
                          <Badge key={eventId} variant="outline" className="border-slate-700 text-slate-300">
                            {event?.name || eventId}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Recent Delivery Logs</CardTitle>
              <CardDescription className="text-slate-400">
                Monitor webhook delivery status and troubleshoot issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { webhook: 'CRM Integration', event: 'Call Ended', status: 'success', time: '2 min ago', duration: '124ms' },
                  { webhook: 'Analytics Pipeline', event: 'Transcript Available', status: 'success', time: '5 min ago', duration: '89ms' },
                  { webhook: 'Slack Notifications', event: 'Error Occurred', status: 'failed', time: '12 min ago', duration: '5000ms' },
                  { webhook: 'CRM Integration', event: 'Call Started', status: 'success', time: '15 min ago', duration: '156ms' },
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-slate-50">{log.webhook}</p>
                        <p className="text-xs text-slate-400">{log.event} - {log.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{log.duration}</span>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Webhook Documentation</CardTitle>
              <CardDescription className="text-slate-400">
                Learn how to integrate with VoiceAgent webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-50 mb-3">Authentication</h3>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-300 mb-2">
                    All webhook requests include a signature header for verification:
                  </p>
                  <code className="block p-2 bg-slate-900 rounded text-sm text-slate-300">
                    X-VoiceAgent-Signature: sha256=hash_of_payload
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-50 mb-3">Event Payload</h3>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-300 mb-2">
                    Example payload for call.started event:
                  </p>
                  <pre className="text-xs text-slate-300 overflow-x-auto">
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
                <h3 className="text-lg font-medium text-slate-50 mb-3">Response Format</h3>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-300 mb-2">
                    Your endpoint should respond with a 2xx status code within 30 seconds:
                  </p>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                    <li>200 OK - Event processed successfully</li>
                    <li>202 Accepted - Event accepted for processing</li>
                    <li>4xx/5xx - Event will be retried (up to 3 times)</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-50 mb-3">Retry Policy</h3>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-300 mb-2">
                    Failed webhook deliveries are retried with exponential backoff:
                  </p>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
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
