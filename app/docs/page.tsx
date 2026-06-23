'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BookOpen, Code, Copy, Check, Terminal, Server,
  Webhook, Zap, Phone, BarChart3, Bot, Mic, MessageSquare,
  GitBranch, FlaskConical, Users, Megaphone, LibraryBig,
  ClipboardCheck, Activity, Globe, Database, ChevronRight,
  ChevronDown, Search, ExternalLink, Cpu, Plug, BookText,
  GraduationCap, FileJson, Play,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── API Endpoint Definitions ──
interface EndpointParam {
  name: string
  type: string
  required: boolean
  desc: string
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  desc: string
  auth: boolean
  params?: EndpointParam[]
  body?: string
  response: string
}

interface Section {
  id: string
  label: string
  icon: any
  endpoints: Endpoint[]
}

const SECTIONS: Section[] = [
  {
    id: 'auth', label: 'Authentication', icon: KeyIcon,
    endpoints: [
      { method: 'POST', path: '/api/auth/register', desc: 'Create a new user account', auth: false, body: '{ "name": "string", "email": "string", "password": "string" }', response: '{ "token": "jwt...", "user": { "id", "name", "email" } }' },
      { method: 'POST', path: '/api/auth/login', desc: 'Login with email and password', auth: false, body: '{ "email": "string", "password": "string" }', response: '{ "token": "jwt...", "user": { "id", "name", "email", "role" } }' },
      { method: 'GET', path: '/api/auth/me', desc: 'Get current user profile', auth: true, response: '{ "user": { "id", "name", "email", "role", "credits" } }' },
      { method: 'PUT', path: '/api/auth/profile', desc: 'Update user profile', auth: true, body: '{ "name": "string" }', response: '{ "user": { ... } }' },
    ]
  },
  {
    id: 'agents', label: 'Agents', icon: Bot,
    endpoints: [
      { method: 'GET', path: '/api/agents', desc: 'List all agents for the authenticated user', auth: true, response: '{ "agents": [...] }' },
      { method: 'POST', path: '/api/agents', desc: 'Create a new AI agent', auth: true, body: '{ "name": "string", "systemPrompt": "string", "voiceProvider": "edge-tts|cartesia|eleven-labs|azure", "language": "en|hi|ta|te", "llmProvider": "groq|openai|gemini", "temperature": 0.7, "maxDuration": 600 }', response: '{ "agent": { ... } }' },
      { method: 'GET', path: '/api/agents/:id', desc: 'Get agent details by ID', auth: true, response: '{ "agent": { ... } }' },
      { method: 'PUT', path: '/api/agents/:id', desc: 'Update agent configuration', auth: true, body: '{ "name": "string", "systemPrompt": "string", ... }', response: '{ "agent": { ... } }' },
      { method: 'DELETE', path: '/api/agents/:id', desc: 'Delete an agent', auth: true, response: '{ "message": "Agent deleted" }' },
      { method: 'POST', path: '/api/agents/:id/duplicate', desc: 'Duplicate an existing agent', auth: true, response: '{ "agent": { ... } }' },
      { method: 'POST', path: '/api/agents/:id/toggle', desc: 'Toggle agent active/inactive status', auth: true, response: '{ "agent": { ... } }' },
      { method: 'POST', path: '/api/playground', desc: 'Test an agent prompt (LLM playground)', auth: true, body: '{ "systemPrompt": "string", "userMessage": "string", "model": "string", "temperature": 0.7, "history": [...] }', response: '{ "response": "string", "latencyMs": 123 }' },
      { method: 'POST', path: '/api/playground/ab-test', desc: 'A/B test two system prompts', auth: true, body: '{ "promptA": "string", "promptB": "string", "userMessage": "string", "model": "string", "temperature": 0.7 }', response: '{ "resultA": { "response": "...", "latencyMs": 123 }, "resultB": { ... } }' },
    ]
  },
  {
    id: 'calls', label: 'Calls', icon: Phone,
    endpoints: [
      { method: 'GET', path: '/api/calls', desc: 'List call logs with pagination', auth: true, params: [{ name: 'page', type: 'number', required: false, desc: 'Page number (default 1)' }, { name: 'limit', type: 'number', required: false, desc: 'Results per page (default 20)' }, { name: 'status', type: 'string', required: false, desc: 'Filter by status' }], response: '{ "calls": [...], "total": 100, "page": 1 }' },
      { method: 'GET', path: '/api/calls/:id', desc: 'Get call details', auth: true, response: '{ "call": { "id", "status", "duration", "transcript", "sentiment", "recordingUrl" } }' },
      { method: 'DELETE', path: '/api/calls/:id', desc: 'Delete a call record', auth: true, response: '{ "message": "Call deleted" }' },
      { method: 'POST', path: '/api/calls/:id/transcript', desc: 'Get call transcript', auth: true, response: '{ "transcript": { "messages": [...] } }' },
      { method: 'POST', path: '/api/calls/export', desc: 'Export call data as CSV', auth: true, body: '{ "callIds": ["id1", "id2"] }', response: 'CSV file download' },
      { method: 'POST', path: '/api/twilio/make-call', desc: 'Initiate an outbound call via Twilio', auth: true, body: '{ "to": "+919999999999", "agentId": "agent_id" }', response: '{ "callSid": "CA...", "status": "queued" }' },
    ]
  },
  {
    id: 'analytics', label: 'Analytics', icon: BarChart3,
    endpoints: [
      { method: 'GET', path: '/api/analytics/overview', desc: 'Get KPI overview for a period', auth: true, params: [{ name: 'period', type: 'string', required: false, desc: '7d, 30d, or 90d (default 30d)' }], response: '{ "totalCalls", "totalMinutes", "successRate", "activeAgents", "avgQaScore" }' },
      { method: 'GET', path: '/api/analytics/calls-over-time', desc: 'Call volume time series', auth: true, response: '{ "data": [{ "date", "calls", "completed" }] }' },
      { method: 'GET', path: '/api/analytics/top-agents', desc: 'Top performing agents', auth: true, response: '{ "data": [{ "agentName", "totalCalls", "completed", "totalDuration" }] }' },
      { method: 'GET', path: '/api/analytics/sentiment', desc: 'Sentiment distribution', auth: true, response: '{ "data": [{ "_id": "positive|neutral|negative", "count" }] }' },
      { method: 'GET', path: '/api/analytics/intent', desc: 'Customer intent breakdown', auth: true, response: '{ "data": [{ "_id": "string", "count" }] }' },
      { method: 'GET', path: '/api/analytics/latency', desc: 'Response latency metrics', auth: true, response: '{ "latency": { "avg", "p50", "p95", "p99" } }' },
      { method: 'GET', path: '/api/analytics/qa-distribution', desc: 'QA score distribution', auth: true, response: '{ "qa": { "gradeBuckets": {...} }, "tagDistribution": [...] }' },
      { method: 'GET', path: '/api/analytics/funnel', desc: 'Conversion funnel data', auth: true, response: '{ "funnel": [{ "stage", "count" }] }' },
      { method: 'GET', path: '/api/analytics/duration-distribution', desc: 'Call duration distribution', auth: true, response: '{ "data": [{ "range", "count" }] }' },
    ]
  },
  {
    id: 'knowledge', label: 'Knowledge Base', icon: LibraryBig,
    endpoints: [
      { method: 'GET', path: '/api/knowledge-base', desc: 'List all knowledge bases', auth: true, response: '{ "data": [{ "name", "sourceType", "status", "totalChunks" }] }' },
      { method: 'GET', path: '/api/knowledge-base/:id', desc: 'Get KB details with chunk previews', auth: true, response: '{ "data": { "name", "chunks": [...], "attachedAgents": [...] } }' },
      { method: 'POST', path: '/api/knowledge-base/text', desc: 'Create KB from raw text', auth: true, body: '{ "name": "string", "content": "string" }', response: '{ "data": { "id", "status": "processing" } }' },
      { method: 'POST', path: '/api/knowledge-base/url', desc: 'Create KB from URL', auth: true, body: '{ "name": "string", "url": "https://..." }', response: '{ "data": { ... } }' },
      { method: 'POST', path: '/api/knowledge-base/upload', desc: 'Upload file (PDF/TXT) for KB', auth: true, body: 'multipart/form-data (file)', response: '{ "data": { ... } }' },
      { method: 'DELETE', path: '/api/knowledge-base/:id', desc: 'Delete a knowledge base', auth: true, response: '{ "message": "KB deleted" }' },
      { method: 'POST', path: '/api/knowledge-base/:id/search', desc: 'Test RAG search within a KB', auth: true, body: '{ "query": "string", "topK": 5 }', response: '{ "results": [{ "chunkIndex", "text", "score" }] }' },
    ]
  },
  {
    id: 'numbers', label: 'Phone Numbers', icon: Phone,
    endpoints: [
      { method: 'GET', path: '/api/numbers', desc: 'List provisioned phone numbers', auth: true, response: '{ "numbers": [...] }' },
      { method: 'POST', path: '/api/numbers', desc: 'Provision a new phone number', auth: true, body: '{ "number": "+1234567890", "agentId": "optional" }', response: '{ "number": { ... } }' },
      { method: 'PUT', path: '/api/numbers/:id', desc: 'Assign/unassign agent to number', auth: true, body: '{ "agentId": "string|null" }', response: '{ "number": { ... } }' },
      { method: 'DELETE', path: '/api/numbers/:id', desc: 'Release a phone number', auth: true, response: '{ "message": "Number released" }' },
    ]
  },
  {
    id: 'campaigns', label: 'Campaigns', icon: Megaphone,
    endpoints: [
      { method: 'GET', path: '/api/campaigns', desc: 'List all campaigns', auth: true, response: '{ "campaigns": [...] }' },
      { method: 'POST', path: '/api/campaigns', desc: 'Create a new campaign', auth: true, body: '{ "name", "agentId", "phoneNumbers": [...], "schedule": {...}, "retryPolicy": {...} }', response: '{ "campaign": { ... } }' },
      { method: 'DELETE', path: '/api/campaigns/:id', desc: 'Delete a campaign', auth: true, response: '{ "message": "Campaign deleted" }' },
      { method: 'POST', path: '/api/campaigns/:id/start', desc: 'Start a campaign', auth: true, response: '{ "campaign": { "status": "running" } }' },
      { method: 'POST', path: '/api/campaigns/:id/pause', desc: 'Pause a running campaign', auth: true, response: '{ "campaign": { "status": "paused" } }' },
    ]
  },
  {
    id: 'webhooks', label: 'Webhooks', icon: Webhook,
    endpoints: [
      { method: 'GET', path: '/api/webhooks', desc: 'List all webhooks', auth: true, response: '{ "webhooks": [...] }' },
      { method: 'POST', path: '/api/webhooks', desc: 'Create a webhook endpoint', auth: true, body: '{ "name": "string", "url": "https://...", "events": ["call.started", "call.ended"], "active": true }', response: '{ "webhook": { ... } }' },
      { method: 'PUT', path: '/api/webhooks/:id', desc: 'Update a webhook', auth: true, response: '{ "webhook": { ... } }' },
      { method: 'DELETE', path: '/api/webhooks/:id', desc: 'Delete a webhook', auth: true, response: '{ "message": "Webhook deleted" }' },
      { method: 'POST', path: '/api/webhooks/:id/test', desc: 'Send a test event to a webhook', auth: true, response: '{ "statusCode": 200, "responseBody": "..." }' },
      { method: 'GET', path: '/api/webhooks/logs', desc: 'Get all webhook delivery logs', auth: true, response: '{ "logs": [...] }' },
    ]
  },
  {
    id: 'callflows', label: 'Call Flows', icon: GitBranch,
    endpoints: [
      { method: 'GET', path: '/api/call-flows', desc: 'List all call flows', auth: true, response: '{ "flows": [...] }' },
      { method: 'POST', path: '/api/call-flows', desc: 'Create a call flow', auth: true, response: '{ "flow": { ... } }' },
      { method: 'GET', path: '/api/call-flows/:id', desc: 'Get a call flow by ID', auth: true, response: '{ "flow": { ... } }' },
      { method: 'PUT', path: '/api/call-flows/:id', desc: 'Update a call flow', auth: true, response: '{ "flow": { ... } }' },
      { method: 'DELETE', path: '/api/call-flows/:id', desc: 'Delete a call flow', auth: true, response: '{ "message": "Flow deleted" }' },
    ]
  },
  {
    id: 'tests', label: 'Test Suites', icon: ClipboardCheck,
    endpoints: [
      { method: 'GET', path: '/api/test-suites', desc: 'List all test suites', auth: true, response: '{ "testSuites": [...] }' },
      { method: 'POST', path: '/api/test-suites', desc: 'Create a test suite', auth: true, response: '{ "testSuite": { ... } }' },
      { method: 'GET', path: '/api/test-suites/:id', desc: 'Get test suite with test cases', auth: true, response: '{ "testSuite": { "testCases": [...] } }' },
      { method: 'POST', path: '/api/test-suites/:id/run', desc: 'Execute a test suite run', auth: true, response: '{ "runId": "...", "status": "running" }' },
      { method: 'GET', path: '/api/test-suites/:id/runs/:runId', desc: 'Get test run results', auth: true, response: '{ "run": { "results": [...], "passRate", "avgScore" } }' },
    ]
  },
  {
    id: 'crm', label: 'CRM', icon: Users,
    endpoints: [
      { method: 'GET', path: '/api/crm/leads', desc: 'List all leads', auth: true, response: '{ "leads": [...] }' },
      { method: 'POST', path: '/api/crm/leads', desc: 'Create a lead', auth: true, body: '{ "name": "string", "phone": "string", "status": "hot|warm|cold" }', response: '{ "lead": { ... } }' },
      { method: 'PUT', path: '/api/crm/leads/:id', desc: 'Update a lead', auth: true, response: '{ "lead": { ... } }' },
      { method: 'DELETE', path: '/api/crm/leads/:id', desc: 'Delete a lead', auth: true, response: '{ "message": "Lead deleted" }' },
      { method: 'GET', path: '/api/crm/tickets', desc: 'List all tickets', auth: true, response: '{ "tickets": [...] }' },
      { method: 'POST', path: '/api/crm/tickets', desc: 'Create a ticket', auth: true, response: '{ "ticket": { ... } }' },
    ]
  },
  {
    id: 'settings', label: 'Settings', icon: Server,
    endpoints: [
      { method: 'GET', path: '/api/settings', desc: 'Get user settings', auth: true, response: '{ "settings": { "groqKey": "...", "deepgramKey": "..." } }' },
      { method: 'PUT', path: '/api/settings', desc: 'Update settings', auth: true, body: '{ "groqKey": "string", ... }', response: '{ "settings": { ... } }' },
      { method: 'POST', path: '/api/settings/test-groq', desc: 'Test Groq API key connectivity', auth: true, response: '{ "success": true }' },
      { method: 'POST', path: '/api/settings/test-deepgram', desc: 'Test Deepgram API key', auth: true, response: '{ "success": true }' },
    ]
  },
  {
    id: 'superadmin', label: 'Super Admin', icon: ShieldIcon,
    endpoints: [
      { method: 'GET', path: '/api/super-admin/stats', desc: 'Get platform-wide stats', auth: true, response: '{ "totalUsers", "totalCalls", "totalAgents" }' },
      { method: 'GET', path: '/api/super-admin/users', desc: 'List all users', auth: true, response: '{ "users": [...] }' },
      { method: 'GET', path: '/api/super-admin/users/:id', desc: 'Get user detail', auth: true, response: '{ "user": { ... } }' },
      { method: 'PUT', path: '/api/super-admin/users/:id/subscription', desc: 'Update user subscription', auth: true, response: '{ "user": { ... } }' },
      { method: 'PUT', path: '/api/super-admin/users/:id/role', desc: 'Change user role', auth: true, response: '{ "user": { ... } }' },
      { method: 'DELETE', path: '/api/super-admin/users/:id', desc: 'Delete a user', auth: true, response: '{ "message": "User deleted" }' },
    ]
  },
]

// ── WebSocket Events Reference ──
const WS_EVENTS = [
  { dir: 'server → client', event: 'ready', desc: 'Voice session is ready. Server sends session config.' },
  { dir: 'server → client', event: 'transcript', desc: 'Real-time speech-to-text transcript from the user.' },
  { dir: 'server → client', event: 'response_text', desc: 'Full AI response text when generation completes.' },
  { dir: 'server → client', event: 'response_text_chunk', desc: 'Streaming chunk of AI response text.' },
  { dir: 'server → client', event: 'audio', desc: 'Full audio response (base64-encoded).' },
  { dir: 'server → client', event: 'audio_stream', desc: 'Binary audio stream chunk (raw PCM16).' },
  { dir: 'server → client', event: 'audio_end', desc: 'Signals end of audio response.' },
  { dir: 'server → client', event: 'session_ended', desc: 'Voice session has ended with reason.' },
  { dir: 'server → client', event: 'interrupt', desc: 'User interruption detected; server stops playback.' },
  { dir: 'server → client', event: 'clear_audio', desc: 'Clear audio playback buffer.' },
  { dir: 'server → client', event: 'error', desc: 'Server-side error occurred.' },
  { dir: 'client → server', event: 'audio', desc: 'User microphone audio (base64-encoded PCM16).' },
  { dir: 'client → server', event: 'audio_binary', desc: 'User microphone audio as raw binary PCM16.' },
  { dir: 'client → server', event: 'interrupt', desc: 'Client-side interrupt signal (user barge-in).' },
  { dir: 'client → server', event: 'end_call', desc: 'Request to end the voice session.' },
]

function KeyIcon(props: any) { return <Code className={props.className} /> }
function ShieldIcon(props: any) { return <ShieldIcon2 className={props.className} /> }

function ShieldIcon2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10',
  POST: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10',
  PUT: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10',
  PATCH: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10',
  DELETE: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10',
}

const SDK_LANGUAGES = [
  { lang: 'curl', label: 'cURL', code: `curl -X GET "https://api.vaaniai.ai/v1/agents" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"` },
  { lang: 'javascript', label: 'JavaScript', code: `const response = await fetch('https://api.vaaniai.ai/v1/agents', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
})
const data = await response.json()` },
  { lang: 'python', label: 'Python', code: `import requests

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
response = requests.get(
    "https://api.vaaniai.ai/v1/agents",
    headers=headers
)
data = response.json()` },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('auth')
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSdkLang, setActiveSdkLang] = useState('curl')
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})

  const section = SECTIONS.find(s => s.id === activeSection)
  const filteredSections = searchQuery
    ? SECTIONS.map(s => ({
        ...s,
        endpoints: s.endpoints.filter(e =>
          e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(s => s.endpoints.length > 0)
    : SECTIONS

  const copyCode = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMap(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopiedMap(prev => ({ ...prev, [key]: false })), 2000)
  }

  const sdkCode = SDK_LANGUAGES.find(l => l.lang === activeSdkLang)?.code || ''

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Sidebar Navigation */}
        <div className="hidden lg:block w-56 flex-shrink-0 space-y-1 sticky top-6 self-start">
          <div className="mb-4 px-3">
            <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" /> API Reference
            </h2>
          </div>
          {SECTIONS.map(sec => {
            const Icon = sec.icon
            return (
              <button key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                  activeSection === sec.id
                    ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-medium'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {sec.label}
              </button>
            )
          })}
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 px-3">
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Resources</h3>
            <a href="/web-widget" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Code className="w-3.5 h-3.5" /> Widget SDK
            </a>
            <a href="/playground" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <FlaskConical className="w-3.5 h-3.5" /> Playground
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/5 to-blue-600/5 rounded-3xl blur-xl" />
            <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-thin text-slate-900 dark:text-white">API Reference & SDK</h1>
                  <p className="text-sm text-slate-500 font-light">Complete REST API & WebSocket documentation for VaaniAI</p>
                </div>
              </div>
              {/* Search */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search endpoints..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50" />
              </div>
            </div>
          </div>

          {/* SDK Quickstart */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-thin text-slate-900 dark:text-white">Quickstart</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-light">All API requests require a JWT token in the <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-600 dark:text-cyan-400">Authorization</code> header. Include your API key as the Bearer token.</p>
              <div className="flex gap-2">
                {SDK_LANGUAGES.map(l => (
                  <button key={l.lang}
                    onClick={() => setActiveSdkLang(l.lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeSdkLang === l.lang
                        ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <pre className="bg-slate-950 dark:bg-slate-950 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{sdkCode}</code>
                </pre>
                <button onClick={() => copyCode('sdk', sdkCode)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80 transition-all">
                  {copiedMap['sdk'] ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Inline Mobile Section Nav */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
            {SECTIONS.map(sec => {
              const Icon = sec.icon
              return (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap ${
                    activeSection === sec.id
                      ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                      : 'bg-white dark:bg-slate-900/40 text-slate-500 border border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  <Icon className="w-3 h-3" /> {sec.label}
                </button>
              )
            })}
          </div>

          {/* Endpoints */}
          {(searchQuery ? filteredSections : [SECTIONS.find(s => s.id === activeSection) || SECTIONS[0]]).map(sec => {
            const Icon = sec.icon
            return (
              <div key={sec.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-thin text-slate-900 dark:text-white">{sec.label} API</h2>
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{sec.endpoints.length} endpoints</span>
                </div>
                <div className="space-y-2">
                  {sec.endpoints.map(ep => {
                    const epKey = `${sec.id}-${ep.method}-${ep.path}`
                    const isExpanded = expandedEndpoint === epKey
                    return (
                      <div key={epKey} className="border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden transition-all">
                        <button onClick={() => setExpandedEndpoint(isExpanded ? null : epKey)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-left">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                          <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 truncate">{ep.path}</code>
                          <span className="text-xs text-slate-400 font-light hidden sm:block truncate max-w-[200px]">{ep.desc}</span>
                          <div className="flex items-center gap-2">
                            {ep.auth && <span className="text-[10px] text-amber-500 bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">Auth</span>}
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                            <p className="text-xs text-slate-500">{ep.desc}</p>
                            {ep.params && ep.params.length > 0 && (
                              <div>
                                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Query Parameters</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[11px]">
                                    <thead><tr className="border-b border-slate-200 dark:border-slate-700/50">
                                      <th className="text-left py-1 pr-3 text-slate-400 font-medium">Name</th>
                                      <th className="text-left py-1 pr-3 text-slate-400 font-medium">Type</th>
                                      <th className="text-left py-1 pr-3 text-slate-400 font-medium">Required</th>
                                      <th className="text-left py-1 text-slate-400 font-medium">Description</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                                      {ep.params.map(p => (
                                        <tr key={p.name}>
                                          <td className="py-1.5 pr-3 font-mono text-slate-700 dark:text-slate-300">{p.name}</td>
                                          <td className="py-1.5 pr-3 text-slate-500">{p.type}</td>
                                          <td className="py-1.5 pr-3">{p.required ? <span className="text-red-400">Yes</span> : <span className="text-slate-400">No</span>}</td>
                                          <td className="py-1.5 text-slate-500">{p.desc}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {ep.body && (
                              <div>
                                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Request Body</h4>
                                <div className="relative">
                                  <pre className="bg-slate-950 dark:bg-slate-950 rounded-xl p-3 text-[10px] font-mono text-slate-300 overflow-x-auto">
                                    <code>{ep.body}</code>
                                  </pre>
                                  <button onClick={() => copyCode(`${epKey}-body`, ep.body || '')}
                                    className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80">
                                    {copiedMap[`${epKey}-body`] ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            )}
                            <div>
                              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Response</h4>
                              <div className="relative">
                                <pre className="bg-slate-950 dark:bg-slate-950 rounded-xl p-3 text-[10px] font-mono text-slate-300 overflow-x-auto">
                                  <code>{ep.response}</code>
                                </pre>
                                <button onClick={() => copyCode(`${epKey}-res`, ep.response)}
                                  className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80">
                                  {copiedMap[`${epKey}-res`] ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            <div className="pt-1">
                              <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">cURL Example</h4>
                              <div className="relative">
                                <pre className="bg-slate-950 dark:bg-slate-950 rounded-xl p-3 text-[10px] font-mono text-slate-300 overflow-x-auto">
                                  <code>{`curl -X ${ep.method} "https://api.vaaniai.ai${ep.path}" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json"${ep.body ? ` \\\n  -d '${ep.body.replace(/\n/g, '\\n')}'` : ''}`}</code>
                                </pre>
                                <button onClick={() => copyCode(`${epKey}-curl`, `curl -X ${ep.method} "https://api.vaaniai.ai${ep.path}" -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json"`)}
                                  className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80">
                                  {copiedMap[`${epKey}-curl`] ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* WebSocket Events Reference */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-thin text-slate-900 dark:text-white">WebSocket Events</h2>
            </div>
            <p className="text-sm text-slate-500 font-light mb-4">Events sent between the client and server during a voice session over <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">wss://api.vaaniai.ai/ws/voice</code></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/50">
                    <th className="text-left py-2.5 pr-4 text-slate-400 font-medium">Direction</th>
                    <th className="text-left py-2.5 pr-4 text-slate-400 font-medium">Event</th>
                    <th className="text-left py-2.5 text-slate-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                  {WS_EVENTS.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-2 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          ev.dir.startsWith('server') ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        }`}>
                          {ev.dir}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono text-slate-700 dark:text-slate-300">{ev.event}</td>
                      <td className="py-2 text-slate-500">{ev.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Models Reference */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-thin text-slate-900 dark:text-white">Models & Endpoints</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">LLM Providers</h3>
                <div className="space-y-2">
                  {[
                    { provider: 'Groq', models: 'llama-3.1-8b-instant, llama-3.3-70b-versatile, mixtral-8x7b-32768', note: 'Free tier, ultra-fast' },
                    { provider: 'OpenAI', models: 'gpt-4o, gpt-4o-mini, gpt-4-turbo', note: 'Paid, industry standard' },
                    { provider: 'Gemini', models: 'gemini-1.5-flash, gemini-1.5-pro', note: 'Free tier available' },
                    { provider: 'Anthropic', models: 'claude-3-haiku, claude-3-sonnet', note: 'Safety-focused' },
                    { provider: 'Cerebras', models: 'llama-3.1-8b, llama-3.3-70b', note: 'Ultra-fast inference' },
                  ].map(m => (
                    <div key={m.provider} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.provider}</span>
                        <span className="text-[10px] text-slate-400">{m.note}</span>
                      </div>
                      <code className="text-[10px] font-mono text-slate-500">{m.models}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Voice & Speech</h3>
                <div className="space-y-2">
                  {[
                    { provider: 'Edge TTS', type: 'TTS', models: 'Jenny, Guy, Neerja, Swara, 100+ voices', note: 'Free, unlimited' },
                    { provider: 'ElevenLabs', type: 'TTS', models: 'Eleven Turbo v2, Eleven Multilingual v2', note: 'HD, 10k chars/mo free' },
                    { provider: 'Cartesia', type: 'TTS', models: 'Sonic (ultra-fast)', note: 'Low latency' },
                    { provider: 'Azure TTS', type: 'TTS', models: '50+ neural voices', note: 'Enterprise quality' },
                    { provider: 'Deepgram', type: 'STT', models: 'Nova-2, Whisper', note: '$200 free credits' },
                  ].map(m => (
                    <div key={m.provider} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.provider}</span>
                        <span className="text-[10px] text-slate-400">{m.note}</span>
                      </div>
                      <code className="text-[10px] font-mono text-slate-500">{m.models}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error Codes */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                <Server className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-thin text-slate-900 dark:text-white">Error Codes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/50">
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium">Code</th>
                    <th className="text-left py-2 pr-4 text-slate-400 font-medium">Error</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                  {[
                    { code: 400, error: 'Bad Request', desc: 'Invalid request parameters or body' },
                    { code: 401, error: 'Unauthorized', desc: 'Missing or invalid JWT token' },
                    { code: 403, error: 'Forbidden', desc: 'Insufficient permissions' },
                    { code: 404, error: 'Not Found', desc: 'Resource does not exist' },
                    { code: 409, error: 'Conflict', desc: 'Resource already exists (e.g., duplicate name)' },
                    { code: 422, error: 'Unprocessable Entity', desc: 'Validation error in request body' },
                    { code: 429, error: 'Too Many Requests', desc: 'Rate limit exceeded. Retry after 60s.' },
                    { code: 500, error: 'Internal Server Error', desc: 'Something went wrong on our end' },
                    { code: 502, error: 'Bad Gateway', desc: 'Upstream provider (LLM/STT/TTS) unavailable' },
                    { code: 503, error: 'Service Unavailable', desc: 'Service temporarily down for maintenance' },
                  ].map(err => (
                    <tr key={err.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-2 pr-4 font-mono text-slate-700 dark:text-slate-300">{err.code}</td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{err.error}</td>
                      <td className="py-2 text-slate-500">{err.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SDK section */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-thin text-slate-900 dark:text-white">Client SDK (npm)</h2>
            </div>
            <p className="text-sm text-slate-500 font-light mb-4">Install the official VaaniAI SDK for programmatic access to all API endpoints.</p>
            <div className="bg-slate-950 rounded-2xl p-4 mb-4">
              <code className="text-sm font-mono text-slate-300">npm install vaaniai-sdk</code>
            </div>
            <div className="relative">
              <pre className="bg-slate-950 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`import { VaaniAI } from 'vaaniai-sdk'

const vaani = new VaaniAI({ apiKey: 'YOUR_API_KEY' })

// List agents
const agents = await vaani.agents.list()

// Create agent
const agent = await vaani.agents.create({
  name: 'Support Bot',
  systemPrompt: 'You are a helpful agent...',
  voiceProvider: 'edge-tts',
  llmProvider: 'groq',
})

// Start a voice call
const call = await vaani.calls.create({
  to: '+919999999999',
  agentId: agent.id,
})`}
              </pre>
              <button onClick={() => copyCode('sdk-example', `import { VaaniAI } from 'vaaniai-sdk'\n\nconst vaani = new VaaniAI({ apiKey: 'YOUR_API_KEY' })\nconst agents = await vaani.agents.list()`)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/80 transition-all">
                {copiedMap['sdk-example'] ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
