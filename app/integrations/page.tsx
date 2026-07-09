'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Cpu, Globe, Zap, Mic, Phone, Webhook, MessageCircle,
  CreditCard, Bot, BookOpen, Database, BarChart3, Users,
  Calendar, Smartphone, Cloud, Link2, Check, X, Loader2,
  ExternalLink, Copy, CheckCircle2, ChevronRight, Plug,
  Settings2, Puzzle, Plus, Trash2, Headphones,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Integration {
  id: string
  name: string
  desc: string
  category: 'llm' | 'stt' | 'tts' | 'telephony' | 'crm' | 'automation' | 'messaging' | 'payments' | 'calendar'
  icon: any
  color: string
  bgColor: string
  connected: boolean
  type: 'api' | 'oauth' | 'webhook'
  docUrl: string
}

const ALL_INTEGRATIONS: Integration[] = [
  // LLMs
  { id: 'groq', name: 'Groq', desc: 'Ultra-fast LPU inference. Free tier available.', category: 'llm', icon: Cpu, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-500/10', connected: true, type: 'api', docUrl: 'https://console.groq.com' },
  { id: 'openai', name: 'OpenAI', desc: 'GPT-4, GPT-3.5. Industry-standard LLM.', category: 'llm', icon: Cpu, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-500/10', connected: false, type: 'api', docUrl: 'https://platform.openai.com' },
  { id: 'gemini', name: 'Gemini', desc: 'Google DeepMind. Free tier for embeddings & chat.', category: 'llm', icon: Bot, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-500/10', connected: false, type: 'api', docUrl: 'https://ai.google.dev' },
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude 3. Safety-focused, extended context.', category: 'llm', icon: Bot, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-500/10', connected: false, type: 'api', docUrl: 'https://console.anthropic.com' },
  // STT
  { id: 'deepgram', name: 'Deepgram', desc: 'Real-time streaming STT. $200 free credits.', category: 'stt', icon: Mic, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-500/10', connected: true, type: 'api', docUrl: 'https://console.deepgram.com' },
  // TTS
  { id: 'elevenlabs', name: 'ElevenLabs', desc: 'HD voice synthesis. 10k chars/mo free.', category: 'tts', icon: Mic, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-500/10', connected: false, type: 'api', docUrl: 'https://elevenlabs.io' },
  { id: 'azure', name: 'Azure TTS', desc: 'Microsoft Neural TTS. 50+ languages.', category: 'tts', icon: Cloud, color: 'text-sky-600', bgColor: 'bg-sky-100 dark:bg-sky-500/10', connected: false, type: 'api', docUrl: 'https://azure.microsoft.com' },
  // Telephony
  { id: 'twilio', name: 'Twilio', desc: 'Telephony infrastructure. Global number provisioning.', category: 'telephony', icon: Phone, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-500/10', connected: true, type: 'api', docUrl: 'https://console.twilio.com' },
  // Automation
  { id: 'n8n', name: 'n8n', desc: 'Self-hosted workflow automation. Fair-code.', category: 'automation', icon: Webhook, color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-500/10', connected: false, type: 'webhook', docUrl: 'https://n8n.io' },
  { id: 'zapier', name: 'Zapier', desc: 'No-code automation. 5000+ app connectors.', category: 'automation', icon: Zap, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-500/10', connected: false, type: 'webhook', docUrl: 'https://zapier.com' },
  { id: 'make', name: 'Make.com', desc: 'Visual automation platform (ex-Integromat).', category: 'automation', icon: Puzzle, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-500/10', connected: false, type: 'webhook', docUrl: 'https://make.com' },
  // Messaging
  { id: 'whatsapp', name: 'WhatsApp', desc: 'Business API. Send call summaries & alerts.', category: 'messaging', icon: MessageCircle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-500/10', connected: false, type: 'api', docUrl: 'https://developers.facebook.com' },
  // CRM
  { id: 'salesforce', name: 'Salesforce', desc: 'Enterprise CRM. Auto-sync call data.', category: 'crm', icon: Cloud, color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-500/10', connected: false, type: 'webhook', docUrl: 'https://developer.salesforce.com' },
  { id: 'hubspot', name: 'HubSpot', desc: 'Free CRM. Sync contacts & deals.', category: 'crm', icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-500/10', connected: false, type: 'webhook', docUrl: 'https://developers.hubspot.com' },
  { id: 'zendesk', name: 'Zendesk', desc: 'Customer service platform. Create tickets.', category: 'crm', icon: Headphones, color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-500/10', connected: false, type: 'webhook', docUrl: 'https://developer.zendesk.com' },
  // Payments
  { id: 'stripe', name: 'Stripe', desc: 'Payment processing. Billing & subscriptions.', category: 'payments', icon: CreditCard, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-500/10', connected: false, type: 'webhook', docUrl: 'https://stripe.com/docs' },
  // Collaboration
  { id: 'slack', name: 'Slack', desc: 'Team messaging. Call alerts & notifications.', category: 'automation', icon: MessageCircle, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-500/10', connected: false, type: 'webhook', docUrl: 'https://api.slack.com' },
  // Calendar
  { id: 'google-calendar', name: 'Google Calendar', desc: 'Schedule appointments. Check availability.', category: 'calendar', icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-500/10', connected: false, type: 'oauth', docUrl: 'https://developers.google.com/calendar' },
]

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Plug },
  { id: 'llm', label: 'LLMs', icon: Cpu },
  { id: 'stt', label: 'Speech-to-Text', icon: Mic },
  { id: 'tts', label: 'Text-to-Speech', icon: Mic },
  { id: 'telephony', label: 'Telephony', icon: Phone },
  { id: 'automation', label: 'Automation', icon: Webhook },
  { id: 'messaging', label: 'Messaging', icon: MessageCircle },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
]

const WEBHOOK_TEMPLATES = [
  { name: 'New Lead in Salesforce', webhookUrl: 'https://your-instance.salesforce.com/services/apexrest/vocred/lead', samplePayload: true },
  { name: 'Slack Notification', webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxxxx', samplePayload: true },
  { name: 'n8n Workflow Trigger', webhookUrl: 'https://your-n8n.com/webhook/vocred-call', samplePayload: true },
  { name: 'Zapier Webhook', webhookUrl: 'https://hooks.zapier.com/hooks/catch/xxxxx/xxxxx/', samplePayload: true },
  { name: 'HubSpot Contact Sync', webhookUrl: 'https://api.hubapi.com/crm/v3/objects/contacts', samplePayload: true },
  { name: 'Create Zendesk Ticket', webhookUrl: 'https://your-subdomain.zendesk.com/api/v2/tickets.json', samplePayload: true },
  { name: 'Stripe Payment Event', webhookUrl: 'https://your-server.com/stripe/webhook', samplePayload: true },
  { name: 'Google Apps Script', webhookUrl: 'https://script.google.com/macros/s/xxxxx/exec', samplePayload: true },
]

const SAMPLE_EVENTS = [
  { event: 'call.started', label: 'Call Started', desc: 'Fires when a new inbound/outbound call connects' },
  { event: 'call.ended', label: 'Call Ended', desc: 'Fires when a call completes. Includes transcript, sentiment, duration.' },
  { event: 'call.transcript', label: 'Transcript Ready', desc: 'Fires after final transcript is generated' },
  { event: 'agent.created', label: 'Agent Created', desc: 'Fires when a new agent is deployed' },
  { event: 'agent.updated', label: 'Agent Updated', desc: 'Fires when an agent config is changed' },
  { event: 'payment.failed', label: 'Payment Failed', desc: 'Fires when a Stripe/subscription payment fails' },
  { event: 'number.assigned', label: 'Number Assigned', desc: 'Fires when a phone number is provisioned' },
  { event: 'error.occurred', label: 'Error Occurred', desc: 'Fires for critical system errors' },
]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(ALL_INTEGRATIONS)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showConnect, setShowConnect] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [showWebhookBuilder, setShowWebhookBuilder] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [copied, setCopied] = useState(false)

  const filtered = activeCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === activeCategory)

  const connectedCount = integrations.filter(i => i.connected).length

  const handleConnect = (id: string) => {
    setShowConnect(id)
    setApiKey('')
    setWebhookUrl('')
  }

  const handleSaveConnection = () => {
    if (!showConnect) return
    setConnecting(true)
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => i.id === showConnect ? { ...i, connected: true } : i))
      setConnecting(false)
      setShowConnect(null)
      toast.success(`${integrations.find(i => i.id === showConnect)?.name} connected`)
    }, 800)
  }

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false } : i))
    toast.success(`Disconnected`)
  }

  const integration = showConnect ? integrations.find(i => i.id === showConnect) : null

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Plug className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Integrations</h1>
                <p className="text-sm text-slate-500 font-light">{connectedCount} of {integrations.length} connected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWebhookBuilder(!showWebhookBuilder)}
                className="rounded-xl text-xs border-slate-200 dark:border-slate-700 gap-1.5">
                <Webhook className="w-3.5 h-3.5" /> Webhook Builder
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTemplates(!showTemplates)}
                className="rounded-xl text-xs border-slate-200 dark:border-slate-700 gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Templates
              </Button>
            </div>
          </div>
          {/* Connected summary bar */}
          <div className="mt-4 flex flex-wrap gap-2">
            {integrations.filter(i => i.connected).map(i => (
              <span key={i.id} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${i.bgColor} ${i.color} border border-current/20`}>
                <CheckCircle2 className="w-3 h-3" /> {i.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Webhook Builder Panel */}
      {showWebhookBuilder && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-thin flex items-center gap-2">
              <Webhook className="w-5 h-5 text-cyan-500" /> Custom Webhook Builder
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowWebhookBuilder(false)} className="h-8 w-8 p-0 rounded-xl">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Webhook URL</label>
                <Input placeholder="https://your-server.com/webhook" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Events to Subscribe</label>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_EVENTS.map(ev => (
                    <label key={ev.event} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500" />
                      <div>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{ev.label}</div>
                        <div className="text-[10px] text-slate-400">{ev.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl">
                + Create Webhook
              </Button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sample Payload</h3>
              <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">
{`{
  "event": "call.ended",
  "call_id": "CA123...",
  "agent_name": "Support Bot",
  "duration_sec": 245,
  "status": "completed",
  "sentiment": "positive",
  "transcript_url": "https://...",
  "customer": {
    "phone": "+919999999999",
    "name": "Ravi Kumar"
  },
  "analysis": {
    "summary": "Customer requested EMI options...",
    "tags": ["billing", "emi", "positive"],
    "action_items": ["send_emi_link"]
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Templates Panel */}
      {showTemplates && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-thin flex items-center gap-2">
              <Copy className="w-5 h-5 text-amber-500" /> Pre-built Webhook Templates
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)} className="h-8 w-8 p-0 rounded-xl">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {WEBHOOK_TEMPLATES.map(tpl => (
              <div key={tpl.name} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{tpl.name}</div>
                  <button onClick={() => { navigator.clipboard.writeText(tpl.webhookUrl); toast.success('URL copied') }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <code className="text-[10px] font-mono text-slate-500 dark:text-slate-400 break-all block mb-3">{tpl.webhookUrl}</code>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg px-2"
                    onClick={() => { navigator.clipboard.writeText(tpl.webhookUrl); toast.success('URL copied') }}>
                    <Copy className="w-3 h-3 mr-1" /> Copy URL
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          return (
            <button key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                  : 'bg-white dark:bg-slate-900/40 text-slate-500 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {cat.label}
            </button>
          )
        })}
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(int => {
          const Icon = int.icon
          return (
            <div key={int.id}
              className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg group ${
                int.connected
                  ? 'border-green-200 dark:border-green-800/50'
                  : 'border-slate-200/50 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${int.bgColor} ${int.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                {int.connected ? (
                  <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Not connected</span>
                )}
              </div>
              <h3 className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-1">{int.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light mb-3 line-clamp-2">{int.desc}</p>
              <div className="flex items-center gap-2">
                {int.connected ? (
                  <Button size="sm" variant="ghost" onClick={() => handleDisconnect(int.id)}
                    className="h-8 text-xs rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1">
                    <X className="w-3 h-3" /> Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleConnect(int.id)}
                    className="h-8 text-xs rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white gap-1">
                    <Plug className="w-3 h-3" /> Connect
                  </Button>
                )}
                <a href={int.docUrl} target="_blank" rel="noopener noreferrer"
                  className="h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Connection Dialog */}
      {showConnect && integration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${integration.bgColor} ${integration.color} flex items-center justify-center`}>
                  <integration.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">Connect {integration.name}</h2>
              </div>
              <button onClick={() => setShowConnect(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {integration.type === 'webhook' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Webhook URL</label>
                  <Input placeholder="https://your-server.com/webhook" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="text-sm" />
                  <p className="text-[10px] text-slate-400 mt-1">Vocred will POST call events to this URL</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Choose Events</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {SAMPLE_EVENTS.slice(0, 5).map(ev => (
                      <label key={ev.event} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{ev.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">API Key</label>
                  <Input placeholder={`Enter your ${integration.name} API key`} value={apiKey} onChange={e => setApiKey(e.target.value)} className="text-sm font-mono" />
                  <p className="text-[10px] text-slate-400 mt-1">
                    <a href={integration.docUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-600">Get API key from {integration.name}</a>
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowConnect(null)} className="rounded-xl text-xs">Cancel</Button>
              <Button size="sm" onClick={handleSaveConnection} disabled={connecting} className="rounded-xl text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white gap-1.5">
                {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
