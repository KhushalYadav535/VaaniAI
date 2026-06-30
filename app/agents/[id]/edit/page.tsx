'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { agentsApi, knowledgeBaseApi } from '@/lib/api'
import { useVoices } from '@/hooks/useVoices'
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Wand2, Copy,
  CheckCircle2, Info, Code2, Save, Loader2, X, Mic
} from 'lucide-react'
import { VoicePickerModal } from '@/components/agents/voice-picker-modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CollectField { id: string; label: string; type: string }
interface QualCriteria  { id: string; value: string }

const uid = () => Math.random().toString(36).slice(2, 10)

const VOICES = [
  'en-US-JennyNeural',
  'hi-IN-SwaraNeural',
  'en-IN-NeerjaNeural',
]

const LANGUAGES = [
  { code: 'hi',    label: 'Hindi' },
  { code: 'en',    label: 'English' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'ta',    label: 'Tamil' },
  { code: 'te',    label: 'Telugu' },
  { code: 'mr',    label: 'Marathi' },
  { code: 'bn',    label: 'Bengali' },
  { code: 'gu',    label: 'Gujarati' },
  { code: 'kn',    label: 'Kannada' },
  { code: 'ml',    label: 'Malayalam' },
  { code: 'ur',    label: 'Urdu' },
  { code: 'pa',    label: 'Punjabi' },
]

const COLLECT_TYPES = ['Text', 'Number', 'Email', 'Phone', 'Date', 'Boolean']

// ── Shared class helpers ───────────────────────────────────────────────────────
const inputCls =
  'bg-slate-50 dark:bg-[#1a1d2e] border-slate-200 dark:border-[#2a2d40] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:border-cyan-500 dark:focus:border-[#00d4c8] focus:ring-0 transition-colors'
const selectTriggerCls =
  'bg-slate-50 dark:bg-[#1a1d2e] border-slate-200 dark:border-[#2a2d40] text-slate-700 dark:text-slate-200 rounded-lg hover:border-cyan-400 dark:hover:border-[#00d4c8]/50 focus:ring-0 transition-colors'
const selectContentCls =
  'bg-white dark:bg-[#1a1d2e] border-slate-200 dark:border-[#2a2d40] text-slate-900 dark:text-white rounded-lg shadow-xl'
const labelCls = 'text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block'

// ── Component ─────────────────────────────────────────────────────────────────
export default function EditAgentPage() {
  const router  = useRouter()
  const params  = useParams()
  const agentId = params.id as string

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'

  // ── Tab ──
  const [tab, setTab] = useState<'agent' | 'postcall'>('agent')

  // ── Loading state ──
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)
  const [agent, setAgent]       = useState<any>(null)

  // ── Agent tab fields ──
  const [agentName, setAgentName]     = useState('')
  const [welcomeMsg, setWelcomeMsg]   = useState('')
  const [prompt, setPrompt]           = useState('')
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['en'])
  const [langOpen, setLangOpen]       = useState(false)
  const [voice, setVoice]             = useState('en-US-JennyNeural')
  const [voiceName, setVoiceName]     = useState('Jenny (English US - Female)')
  const [voiceProvider, setVoiceProvider] = useState('edge-tts')
  const [voiceSpeed, setVoiceSpeed]   = useState(0)
  const [noiseSensitivity, setNoiseSens] = useState(0.5)
  const [voicePickerOpen, setVoicePickerOpen] = useState(false)
  const [knowledgeBaseIds, setKnowledgeBaseIds] = useState<string[]>([])
  const [kbOpen, setKbOpen] = useState(false)
  const [kbs, setKbs] = useState<any[]>([])

  const { providers: voiceProviders, loading: voicesLoadingHook, allVoices } = useVoices()

  useEffect(() => {
    if (voice && allVoices && allVoices.length > 0) {
      const v = allVoices.find(x => x.voiceId === voice)
      if (v) {
        setVoiceName(v.name)
        setVoiceProvider(v.providerName || v.provider)
      }
    }
  }, [voice, allVoices])

  useEffect(() => {
    knowledgeBaseApi.getAll().then(res => setKbs(res.data)).catch(console.error)
  }, [])

  // ── Post-call tab fields ──
  const [meetingOpen, setMeetingOpen]   = useState(false)
  const [webhookOpen, setWebhookOpen]   = useState(false)
  const [webhookUrl, setWebhookUrl]     = useState('')
  const [sendSMS, setSendSMS]           = useState(false)
  const [sendWhatsApp, setSendWhatsApp] = useState(false)
  const [smsTemplate, setSmsTemplate]   = useState('')
  const [waTemplate, setWaTemplate]     = useState('')
  const [collectFields, setCollectFields] = useState<CollectField[]>([
    { id: uid(), label: '', type: '' },
  ])
  const [qualCriteria, setQualCriteria] = useState<QualCriteria[]>([
    { id: uid(), value: '' },
  ])

  const langRef = useRef<HTMLDivElement>(null)
  const kbRef = useRef<HTMLDivElement>(null)

  // ── Load agent ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!agentId) return
    agentsApi.getById(agentId)
      .then((res: any) => {
        const a = res.agent
        setAgent(a)
        setAgentName(a.name || '')
        setWelcomeMsg(a.firstMessage || '')
        setPrompt(a.systemPrompt || '')
        setVoice(a.voice?.voiceId || VOICES[0])
        // Convert backend speed (0.5-2.0) → slider (-4 to +4)
        const rawSpeed = a.voice?.speed ?? 1.0
        setVoiceSpeed(Math.round((rawSpeed - 1.0) * 4))
        setNoiseSens(a.advanced?.interruptionSensitivity ?? 0.5)
        setSelectedLangs([a.language || 'en'])
        setKnowledgeBaseIds(a.knowledgeBaseIds || [])
        setWebhookUrl(a.webhooks?.callEnded || '')
        setSendSMS(a.postCallActions?.sendSMS || false)
        setSendWhatsApp(a.postCallActions?.sendWhatsApp || false)
        setSmsTemplate(a.postCallActions?.smsTemplate || '')
        setWaTemplate(a.postCallActions?.whatsappTemplate || '')
      })
      .catch(() => setError('Failed to load agent'))
      .finally(() => setLoading(false))
  }, [agentId])

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!agentName.trim()) { toast.error('Agent name is required'); return }
    if (!welcomeMsg.trim()) { toast.error('Welcome message is required'); return }
    if (!prompt.trim())    { toast.error('Prompt is required'); return }
    setSaving(true)
    try {
      // Convert slider value back to backend speed (0.5-2.0)
      const backendSpeed = Math.round((1.0 + voiceSpeed / 4) * 100) / 100

      await agentsApi.update(agentId, {
        name: agentName,
        systemPrompt: prompt,
        firstMessage: welcomeMsg,
        language: selectedLangs[0] || 'en',
        voice: {
          provider: agent?.voice?.provider || 'edge-tts',
          voiceId: voice,
          speed: backendSpeed,
        },
        llm: {
          provider: 'openrouter',
          model: 'meta-llama/llama-3.3-70b-instruct',
        },
        temperature: agent?.temperature ?? 0.7,
        maxDuration: agent?.maxDuration ?? 600,
        knowledgeBaseIds: knowledgeBaseIds,
        webhooks: {
          ...agent?.webhooks,
          callEnded: webhookUrl,
        },
        postCallActions: {
          sendSMS,
          sendWhatsApp,
          smsTemplate,
          whatsappTemplate: waTemplate,
        },
        advanced: {
          ...agent?.advanced,
          interruptionSensitivity: noiseSensitivity,
        },
      })
      toast.success('Agent saved!')
      router.push('/agents')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save agent')
    } finally {
      setSaving(false)
    }
  }

  // ── Language helpers ──
  const toggleLang = (code: string) => {
    setSelectedLangs(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  // ── Knowledge Base helpers ──
  const toggleKb = (id: string) => {
    setKnowledgeBaseIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  // ── Collect field helpers ──
  const addField      = () => setCollectFields(f => [...f, { id: uid(), label: '', type: '' }])
  const removeField   = (id: string) => setCollectFields(f => f.filter(x => x.id !== id))
  const updateField   = (id: string, key: keyof CollectField, val: string) =>
    setCollectFields(f => f.map(x => x.id === id ? { ...x, [key]: val } : x))

  // ── Qual criteria helpers ──
  const addCriteria    = () => setQualCriteria(c => [...c, { id: uid(), value: '' }])
  const removeCriteria = (id: string) => setQualCriteria(c => c.filter(x => x.id !== id))
  const updateCriteria = (id: string, val: string) =>
    setQualCriteria(c => c.map(x => x.id === id ? { ...x, value: val } : x))

  const speedMarks = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
  const noiseMarks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

  // ── Embed code ──
  const embedCode = `<script \n  src="${BACKEND_URL}/widget.js" \n  data-agent-id="${agentId}"\n  data-color="#06b6d4"\n  data-position="bottom-right"\n></script>`

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1117]">
        <div className="flex flex-col items-center gap-3 text-cyan-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading agent…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1117]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] transition-colors duration-300">

      {/* ── Topbar ── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#1e2230]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/agents')}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1d2e] transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-none truncate">
                {agentName || 'Edit Agent'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Edit agent configuration</p>
            </div>
          </div>

          {/* Right: embed + save */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {agent && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 dark:border-[#2a2d40] text-slate-600 dark:text-slate-300 hover:border-cyan-400 dark:hover:border-[#00d4c8] rounded-lg text-xs gap-1.5"
                  >
                    <Code2 size={13} /> Embed Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-[#1e2230] text-slate-900 dark:text-white">
                  <DialogHeader>
                    <DialogTitle className="text-cyan-600 dark:text-[#00d4c8]">Embed Voice Agent</DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                      Copy and paste this script into your website's HTML.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="relative p-4 bg-slate-50 dark:bg-black/50 rounded-xl border border-slate-200 dark:border-[#1e2230] my-2">
                    <pre className="text-sm font-mono text-emerald-600 dark:text-green-400 whitespace-pre-wrap break-all">
                      {embedCode}
                    </pre>
                    <button
                      onClick={() => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                      className="absolute top-3 right-3 p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-md text-cyan-600 dark:text-cyan-400 transition-colors"
                    >
                      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#00d4c8] hover:bg-[#00bfb4] disabled:opacity-60 text-black font-semibold text-sm rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 max-w-6xl mx-auto border-t border-slate-100 dark:border-[#1e2230]">
          {(['agent', 'postcall'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'text-cyan-600 dark:text-[#00d4c8] border-cyan-500 dark:border-[#00d4c8]'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t === 'agent' ? 'Agent' : 'Post Call'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto">

        {/* ════════════════ AGENT TAB ════════════════ */}
        {tab === 'agent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-[#1e2230]">

            {/* Left */}
            <div className="p-6 space-y-5">

              {/* Agent Name */}
              <div>
                <label className={labelCls}>
                  Agent Name <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="Enter a unique name for your agent"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  className={`${inputCls} h-11`}
                />
              </div>

              {/* Welcome Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls + ' mb-0'}>
                    Welcome Message <span className="text-red-400">*</span>
                  </label>
                  <button className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-[#00d4c8] hover:opacity-80 border border-cyan-300 dark:border-[#00d4c8]/30 hover:border-cyan-500 dark:hover:border-[#00d4c8]/60 px-2.5 py-1 rounded-md transition-colors">
                    <Plus size={11} /> Insert Contact Fields <ChevronDown size={11} />
                  </button>
                </div>
                <Textarea
                  placeholder="How should the agent greet customers?"
                  value={welcomeMsg}
                  onChange={e => setWelcomeMsg(e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls + ' mb-0'}>
                    Prompt <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-[#00d4c8] hover:opacity-80 border border-cyan-300 dark:border-[#00d4c8]/30 hover:border-cyan-500 dark:hover:border-[#00d4c8]/60 px-2.5 py-1 rounded-md transition-colors">
                      <Plus size={11} /> Insert Contact Fields <ChevronDown size={11} />
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:opacity-80 border border-purple-300 dark:border-purple-400/30 hover:border-purple-500 dark:hover:border-purple-400/60 px-2.5 py-1 rounded-md transition-colors">
                      <Wand2 size={11} /> Optimize prompt
                    </button>
                  </div>
                </div>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={16}
                  className={`${inputCls} font-mono text-sm leading-relaxed resize-none`}
                />
              </div>
            </div>

            {/* Right */}
            <div className="p-6 space-y-5">

              {/* Tool Call */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls + ' mb-0'}>
                    Select Tool call{' '}
                    <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">(Multiple can be selected)</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger className={`flex-1 h-11 ${selectTriggerCls}`}>
                      <SelectValue placeholder="Select tool call" />
                    </SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      <SelectItem value="none">No tools</SelectItem>
                    </SelectContent>
                  </Select>
                  <button className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-[#00d4c8] hover:text-white hover:bg-cyan-500 dark:hover:bg-[#00d4c8] hover:border-cyan-500 dark:hover:border-[#00d4c8] border border-cyan-300 dark:border-[#00d4c8]/40 px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap">
                    <Plus size={13} /> Add Tool call
                  </button>
                </div>
              </div>

              {/* Knowledge Base */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls + ' mb-0'}>
                    Knowledge Base
                  </label>
                </div>
                <div className="relative" ref={kbRef}>
                  <div
                    className={`min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 cursor-pointer transition-colors ${selectTriggerCls}`}
                    onClick={() => setKbOpen(o => !o)}
                  >
                    {knowledgeBaseIds.map(id => {
                      const kb = kbs.find(k => k._id === id)
                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-[#2a2d40] text-slate-700 dark:text-slate-200 text-xs rounded"
                        >
                          {kb?.name || 'Unknown'}
                          <button
                            onClick={e => { e.stopPropagation(); toggleKb(id) }}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white ml-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      )
                    })}
                    {knowledgeBaseIds.length === 0 && (
                      <span className="text-slate-400 dark:text-slate-500 text-sm flex-1 min-w-[100px]">Select Knowledge Bases</span>
                    )}
                    <div className="flex-1" />
                    <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  </div>
                  {kbOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1d2e] border border-slate-200 dark:border-[#2a2d40] rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-y-auto">
                      {kbs.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500 text-center">No knowledge bases found</div>
                      ) : (
                        kbs.map(kb => (
                          <button
                            key={kb._id}
                            onClick={() => toggleKb(kb._id)}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              knowledgeBaseIds.includes(kb._id)
                                ? 'text-cyan-600 dark:text-[#00d4c8] bg-cyan-50 dark:bg-[#00d4c8]/10'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f1117] hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {kb.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className={labelCls}>
                  Languages <span className="text-red-400">*</span>
                </label>
                <div className="relative" ref={langRef}>
                  <div
                    className="min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 bg-slate-50 dark:bg-[#1a1d2e] border border-slate-200 dark:border-[#2a2d40] rounded-lg cursor-pointer hover:border-cyan-400 dark:hover:border-[#00d4c8]/50 transition-colors"
                    onClick={() => setLangOpen(o => !o)}
                  >
                    {selectedLangs.map(code => {
                      const lang = LANGUAGES.find(l => l.code === code)
                      return (
                        <span
                          key={code}
                          className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-[#2a2d40] text-slate-700 dark:text-slate-200 text-xs rounded"
                        >
                          {lang?.label || code}
                          <button
                            onClick={e => { e.stopPropagation(); toggleLang(code) }}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white ml-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      )
                    })}
                    <span className="text-slate-400 dark:text-slate-500 text-sm flex-1 min-w-[100px]">Select languages</span>
                    <ChevronDown size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  </div>
                  {langOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1d2e] border border-slate-200 dark:border-[#2a2d40] rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-y-auto">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => toggleLang(lang.code)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            selectedLangs.includes(lang.code)
                              ? 'text-cyan-600 dark:text-[#00d4c8] bg-cyan-50 dark:bg-[#00d4c8]/10'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f1117] hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Voice */}
              <div>
                <label className={labelCls}>
                  Voice <span className="text-red-400">*</span>
                </label>
                <button
                  onClick={() => setVoicePickerOpen(true)}
                  className={`w-full flex items-center gap-3 h-11 px-3 ${inputCls} hover:border-cyan-400 dark:hover:border-[#00d4c8]/60 cursor-pointer text-left group`}
                >
                  <div className="w-7 h-7 rounded-full bg-cyan-100 dark:bg-[#00d4c8]/15 flex items-center justify-center flex-shrink-0">
                    <Mic size={13} className="text-cyan-600 dark:text-[#00d4c8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 dark:text-slate-200 text-sm truncate">{voiceName}</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">{voiceProvider}</p>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-[#00d4c8] transition-colors flex-shrink-0" />
                </button>
              </div>

              {/* Voice Speed */}
              <div>
                <label className={labelCls}>Voice Speed <span className="text-red-400">*</span></label>
                <Slider
                  value={[voiceSpeed]}
                  onValueChange={([v]) => setVoiceSpeed(v)}
                  min={-4} max={4} step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {speedMarks.map(m => (
                    <span
                      key={m}
                      className={m === voiceSpeed ? 'text-cyan-600 dark:text-[#00d4c8] font-semibold' : ''}
                    >
                      {m === 0 ? '0' : m > 0 ? `+${m}` : m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Noise Sensitivity */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <label className={labelCls + ' mb-0'}>
                    Noise Sensitivity <span className="text-red-400">*</span>
                  </label>
                  <Info size={13} className="text-slate-400 dark:text-slate-500" />
                </div>
                <Slider
                  value={[noiseSensitivity]}
                  onValueChange={([v]) => setNoiseSens(Math.round(v * 10) / 10)}
                  min={0.1} max={0.9} step={0.1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {noiseMarks.map(m => (
                    <span
                      key={m}
                      className={Math.abs(m - noiseSensitivity) < 0.05 ? 'text-cyan-600 dark:text-[#00d4c8] font-semibold' : ''}
                    >
                      {m.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ POST CALL TAB ════════════════ */}
        {tab === 'postcall' && (
          <div className="p-6 max-w-3xl space-y-5">

            {/* Meeting Automation */}
            <div className="border border-slate-200 dark:border-[#1e2230] rounded-xl overflow-hidden">
              <button
                onClick={() => setMeetingOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1d2e] transition-colors"
              >
                <span className="text-sm font-medium">Meeting Automation</span>
                {meetingOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {meetingOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 dark:border-[#1e2230]">
                  <p className="text-slate-500 dark:text-slate-500 text-sm mt-4">
                    Configure automated meeting scheduling after calls.
                  </p>
                </div>
              )}
            </div>

            {/* Post Call Webhook */}
            <div className="border border-slate-200 dark:border-[#1e2230] rounded-xl overflow-hidden">
              <button
                onClick={() => setWebhookOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1d2e] transition-colors"
              >
                <span className="text-sm font-medium">Post Call Webhook</span>
                {webhookOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {webhookOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 dark:border-[#1e2230] space-y-4 mt-4">
                  <div>
                    <label className={labelCls}>Webhook URL</label>
                    <Input
                      placeholder="https://your-server.com/webhook"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      className={`${inputCls} h-10`}
                    />
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={sendSMS} onChange={e => setSendSMS(e.target.checked)}
                        className="w-4 h-4 rounded accent-cyan-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Send SMS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={sendWhatsApp} onChange={e => setSendWhatsApp(e.target.checked)}
                        className="w-4 h-4 rounded accent-cyan-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Send WhatsApp</span>
                    </label>
                  </div>
                  {sendSMS && (
                    <div>
                      <label className={labelCls}>SMS Template</label>
                      <Textarea
                        value={smsTemplate}
                        onChange={e => setSmsTemplate(e.target.value)}
                        rows={3}
                        className={`${inputCls} resize-none`}
                        placeholder="Thank you for your call with {{agentName}}."
                      />
                    </div>
                  )}
                  {sendWhatsApp && (
                    <div>
                      <label className={labelCls}>WhatsApp Template</label>
                      <Textarea
                        value={waTemplate}
                        onChange={e => setWaTemplate(e.target.value)}
                        rows={3}
                        className={`${inputCls} resize-none`}
                        placeholder="🎙️ *Call Summary*"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collect Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Collect Information</h3>
                <Info size={14} className="text-slate-400 dark:text-slate-500" />
              </div>
              <div className="space-y-2">
                {collectFields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 text-sm w-5 text-right flex-shrink-0">{idx + 1}.</span>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 dark:bg-[#1a1d2e] border border-slate-200 dark:border-[#2a2d40] rounded text-xs text-slate-500 flex-shrink-0">
                      <Copy size={10} />
                      <span>ID: {field.id.slice(0, 8)}…</span>
                    </div>
                    <Input
                      placeholder="e.g., Customer's name, Company size"
                      value={field.label}
                      onChange={e => updateField(field.id, 'label', e.target.value)}
                      className={`flex-1 ${inputCls} h-10 text-sm`}
                    />
                    <Select value={field.type} onValueChange={v => updateField(field.id, 'type', v)}>
                      <SelectTrigger className={`w-32 ${selectTriggerCls} h-10 text-sm`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {COLLECT_TYPES.map(t => (
                          <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => removeField(field.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addField}
                className="flex items-center gap-1.5 text-sm text-cyan-600 dark:text-[#00d4c8] hover:opacity-80 mt-3 transition-colors"
              >
                <Plus size={14} /> Add Field
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-[#1e2230]" />

            {/* Qualification Criteria */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Qualification Criteria</h3>
                <Info size={14} className="text-slate-400 dark:text-slate-500" />
              </div>
              <div className="space-y-2">
                {qualCriteria.map((crit, idx) => (
                  <div key={crit.id} className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 text-sm w-5 text-right flex-shrink-0">{idx + 1}.</span>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 dark:bg-[#1a1d2e] border border-slate-200 dark:border-[#2a2d40] rounded text-xs text-slate-500 flex-shrink-0">
                      <span>id: {crit.id.slice(0, 8)}…</span>
                      <button onClick={() => navigator.clipboard?.writeText(crit.id)}>
                        <Copy size={10} className="hover:text-slate-900 dark:hover:text-white transition-colors" />
                      </button>
                    </div>
                    <Input
                      placeholder="e.g., Budget > $10,000, Team size > 50 employees"
                      value={crit.value}
                      onChange={e => updateCriteria(crit.id, e.target.value)}
                      className={`flex-1 ${inputCls} h-10 text-sm`}
                    />
                    <button
                      onClick={() => removeCriteria(crit.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addCriteria}
                className="flex items-center gap-1.5 text-sm text-cyan-600 dark:text-[#00d4c8] hover:opacity-80 mt-3 transition-colors"
              >
                <Plus size={14} /> Add Criteria
              </button>
            </div>

            {/* Bottom Save */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#1e2230]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#00d4c8] hover:bg-[#00bfb4] disabled:opacity-60 text-black font-semibold text-sm rounded-lg transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Voice Picker Modal ── */}
      <VoicePickerModal
        open={voicePickerOpen}
        onClose={() => setVoicePickerOpen(false)}
        selectedVoiceId={voice}
        onSelect={(v) => {
          setVoice(v.voiceId)
          setVoiceName(v.name)
          setVoiceProvider(v.provider)
        }}
      />
    </div>
  )
}
