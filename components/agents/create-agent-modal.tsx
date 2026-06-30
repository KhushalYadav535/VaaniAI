'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Trash2, ChevronDown, ChevronUp, Wand2, Copy, Info, Loader2, Mic } from 'lucide-react'
import { useVoices } from '@/hooks/useVoices'
import { VoicePickerModal } from '@/components/agents/voice-picker-modal'
import { knowledgeBaseApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CollectField { id: string; label: string; type: string }
interface QualCriteria  { id: string; value: string }

interface CreateAgentModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10)

const LANGUAGES = [
  { code: 'hi',    label: 'Hindi' },
  { code: 'en',    label: 'English' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'ta',    label: 'Tamil' },
  { code: 'te',    label: 'Telugu' },
  { code: 'mr',    label: 'Marathi' },
  { code: 'bn',    label: 'Bengali' },
  { code: 'gu',    label: 'Gujarati' },
]

const COLLECT_TYPES = ['Text', 'Number', 'Email', 'Phone', 'Date', 'Boolean']

const DEFAULT_PROMPT = `# Role

# Task

# Instructions

# About Company

# Features

# Conversation Flow`

// ── Component ─────────────────────────────────────────────────────────────────
export function CreateAgentModal({ open, onClose, onSubmit }: CreateAgentModalProps) {
  const [tab, setTab]           = useState<'agent' | 'postcall'>('agent')
  const [agentName, setAgentName]           = useState('')
  const [welcomeMsg, setWelcomeMsg]         = useState('')
  const [prompt, setPrompt]                 = useState(DEFAULT_PROMPT)
  const [selectedLangs, setSelectedLangs]   = useState<string[]>(['hi'])
  const [langOpen, setLangOpen]             = useState(false)
  const [voice, setVoice]                   = useState('hi-IN-SwaraNeural')
  const [voiceName, setVoiceName]           = useState('Swara (Hindi - Female)')
  const [voiceProvider, setVoiceProvider]   = useState('edge-tts')
  const [voiceSpeed, setVoiceSpeed]         = useState(0)
  const [noiseSensitivity, setNoiseSens]    = useState(0.7)
  const [voicePickerOpen, setVoicePickerOpen] = useState(false)
  const [knowledgeBaseIds, setKnowledgeBaseIds] = useState<string[]>([])
  const [kbOpen, setKbOpen]                 = useState(false)
  const [kbs, setKbs] = useState<any[]>([])

  useEffect(() => {
    knowledgeBaseApi.getAll().then(res => setKbs(res.data)).catch(console.error)
  }, [])

  const { providers: voiceProviders, loading: voicesLoading } = useVoices()
  const [toolCalls, setToolCalls]           = useState<string[]>([])
  const [meetingOpen, setMeetingOpen]       = useState(false)
  const [webhookOpen, setWebhookOpen]       = useState(false)
  const [collectFields, setCollectFields]   = useState<CollectField[]>([
    { id: uid(), label: '', type: '' },
  ])
  const [qualCriteria, setQualCriteria]     = useState<QualCriteria[]>([
    { id: uid(), value: '' },
  ])

  const langRef = useRef<HTMLDivElement>(null)
  const kbRef = useRef<HTMLDivElement>(null)

  if (!open) return null

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
  const addField = () => setCollectFields(f => [...f, { id: uid(), label: '', type: '' }])
  const removeField = (id: string) => setCollectFields(f => f.filter(x => x.id !== id))
  const updateField = (id: string, key: keyof CollectField, val: string) =>
    setCollectFields(f => f.map(x => x.id === id ? { ...x, [key]: val } : x))

  // ── Qual criteria helpers ──
  const addCriteria = () => setQualCriteria(c => [...c, { id: uid(), value: '' }])
  const removeCriteria = (id: string) => setQualCriteria(c => c.filter(x => x.id !== id))
  const updateCriteria = (id: string, val: string) =>
    setQualCriteria(c => c.map(x => x.id === id ? { ...x, value: val } : x))

  // ── Submit ──
  const handleCreate = () => {
    onSubmit({
      name: agentName,
      firstMessage: welcomeMsg,
      systemPrompt: prompt,
      language: selectedLangs[0] || 'hi',
      voice: {
        provider: voiceProvider,
        voiceId:  voice,
        speed:    1.0,
      },
      llm: {
        provider: 'openrouter',
        model:    'meta-llama/llama-3.3-70b-instruct',
      },
      temperature: 0.7,
      maxDuration: 600,
      knowledgeBaseIds: knowledgeBaseIds,
    })
  }

  // ── Voice speed labels ──
  const speedMarks = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
  const noiseMarks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0f1117] border border-[#1e2230] rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2230]">
          <h2 className="text-xl font-semibold text-white">Create Agent</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-[#00d4c8] hover:bg-[#00bfb4] text-black font-semibold text-sm rounded-lg transition-colors"
            >
              <Plus size={15} /> Create Agent
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 px-6 border-b border-[#1e2230]">
          {(['agent', 'postcall'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'text-[#00d4c8] border-[#00d4c8]'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              {t === 'agent' ? 'Agent' : 'Post Call'}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════════════════ AGENT TAB ════════════════ */}
          {tab === 'agent' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-[#1e2230]">

              {/* Left column */}
              <div className="p-6 space-y-5">

                {/* Agent Name */}
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">
                    Agent Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    placeholder="Enter a unique name for your agent"
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                    className="bg-[#1a1d2e] border-[#2a2d40] text-white placeholder:text-slate-500 rounded-lg h-11 focus:border-[#00d4c8] focus:ring-0"
                  />
                </div>

                {/* Welcome Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-slate-300">
                      Welcome Message <span className="text-red-400">*</span>
                    </label>
                    <button className="flex items-center gap-1.5 text-xs text-[#00d4c8] hover:text-[#00bfb4] border border-[#00d4c8]/30 hover:border-[#00d4c8]/60 px-2.5 py-1 rounded-md transition-colors">
                      <Plus size={11} /> Insert Contact Fields <ChevronDown size={11} />
                    </button>
                  </div>
                  <Textarea
                    placeholder="How should the agent greet customers?"
                    value={welcomeMsg}
                    onChange={e => setWelcomeMsg(e.target.value)}
                    rows={3}
                    className="bg-[#1a1d2e] border-[#2a2d40] text-white placeholder:text-slate-500 rounded-lg resize-none focus:border-[#00d4c8] focus:ring-0"
                  />
                </div>

                {/* Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-slate-300">
                      Prompt <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 text-xs text-[#00d4c8] hover:text-[#00bfb4] border border-[#00d4c8]/30 hover:border-[#00d4c8]/60 px-2.5 py-1 rounded-md transition-colors">
                        <Plus size={11} /> Insert Contact Fields <ChevronDown size={11} />
                      </button>
                      <button className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 border border-purple-400/30 hover:border-purple-400/60 px-2.5 py-1 rounded-md transition-colors">
                        <Wand2 size={11} /> Optimize prompt
                      </button>
                    </div>
                  </div>
                  <Textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={12}
                    className="bg-[#1a1d2e] border-[#2a2d40] text-slate-300 font-mono text-sm rounded-lg resize-none focus:border-[#00d4c8] focus:ring-0 leading-relaxed"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="p-6 space-y-5">

                {/* Select Tool Call */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-slate-300">
                      Select Tool call{' '}
                      <span className="text-slate-500 font-normal text-xs">(Multiple tool call can be selected)</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="flex-1 bg-[#1a1d2e] border-[#2a2d40] text-slate-400 rounded-lg h-11 hover:border-[#00d4c8]/50 focus:ring-0">
                        <SelectValue placeholder="Select tool call" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d2e] border-[#2a2d40] text-white rounded-lg">
                        <SelectItem value="none">No tools</SelectItem>
                      </SelectContent>
                    </Select>
                    <button className="flex items-center gap-1.5 text-xs text-[#00d4c8] hover:text-white border border-[#00d4c8]/40 hover:bg-[#00d4c8] hover:border-[#00d4c8] px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap">
                      <Plus size={13} /> Add Tool call
                    </button>
                  </div>
                </div>

                {/* Knowledge Base */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-slate-300">
                      Knowledge Base
                    </label>
                  </div>
                  <div className="relative" ref={kbRef}>
                    <div
                      className="min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 bg-[#1a1d2e] border border-[#2a2d40] rounded-lg cursor-pointer hover:border-[#00d4c8]/50 transition-colors"
                      onClick={() => setKbOpen(o => !o)}
                    >
                      {knowledgeBaseIds.map(id => {
                        const kb = kbs.find(k => k._id === id)
                        return (
                          <span
                            key={id}
                            className="flex items-center gap-1 px-2 py-0.5 bg-[#0f1117] border border-[#2a2d40] text-slate-200 text-xs rounded"
                          >
                            {kb?.name || 'Unknown'}
                            <button
                              onClick={e => { e.stopPropagation(); toggleKb(id) }}
                              className="text-slate-400 hover:text-white ml-0.5"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        )
                      })}
                      {knowledgeBaseIds.length === 0 && (
                        <span className="text-slate-500 text-sm flex-1 min-w-[100px]">Select Knowledge Bases</span>
                      )}
                      <div className="flex-1" />
                      <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
                    </div>
                    {kbOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d2e] border border-[#2a2d40] rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-y-auto">
                        {kbs.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-slate-500 text-center">No knowledge bases found</div>
                        ) : (
                          kbs.map(kb => (
                            <button
                              key={kb._id}
                              onClick={() => toggleKb(kb._id)}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                knowledgeBaseIds.includes(kb._id)
                                  ? 'text-[#00d4c8] bg-[#00d4c8]/10'
                                  : 'text-slate-300 hover:bg-[#0f1117] hover:text-white'
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
                  <label className="text-sm text-slate-300 mb-1.5 block">
                    Languages <span className="text-red-400">*</span>
                  </label>
                  <div className="relative" ref={langRef}>
                    <div
                      className="min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 bg-[#1a1d2e] border border-[#2a2d40] rounded-lg cursor-pointer hover:border-[#00d4c8]/50 transition-colors"
                      onClick={() => setLangOpen(o => !o)}
                    >
                      {selectedLangs.map(code => {
                        const lang = LANGUAGES.find(l => l.code === code)
                        return (
                          <span
                            key={code}
                            className="flex items-center gap-1 px-2 py-0.5 bg-[#0f1117] border border-[#2a2d40] text-slate-200 text-xs rounded"
                          >
                            {lang?.label}
                            <button
                              onClick={e => { e.stopPropagation(); toggleLang(code) }}
                              className="text-slate-400 hover:text-white ml-0.5"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        )
                      })}
                      <span className="text-slate-500 text-sm flex-1 min-w-[100px]">Select languages</span>
                      <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
                    </div>
                    {langOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d2e] border border-[#2a2d40] rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-y-auto">
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => toggleLang(lang.code)}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                              selectedLangs.includes(lang.code)
                                ? 'text-[#00d4c8] bg-[#00d4c8]/10'
                                : 'text-slate-300 hover:bg-[#0f1117] hover:text-white'
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
                  <label className="text-sm text-slate-300 mb-1.5 block">
                    Voice <span className="text-red-400">*</span>
                  </label>
                  <button
                    onClick={() => setVoicePickerOpen(true)}
                    className="w-full flex items-center gap-3 h-11 px-3 bg-[#1a1d2e] border border-[#2a2d40] hover:border-[#00d4c8]/60 rounded-lg transition-colors text-left group"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#00d4c8]/15 flex items-center justify-center flex-shrink-0">
                      <Mic size={13} className="text-[#00d4c8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm truncate">{voiceName}</p>
                      <p className="text-slate-500 text-xs">{voiceProvider}</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-500 group-hover:text-[#00d4c8] transition-colors flex-shrink-0" />
                  </button>
                </div>

                {/* Voice Speed */}
                <div>
                  <label className="text-sm text-slate-300 mb-3 block">
                    Voice Speed <span className="text-red-400">*</span>
                  </label>
                  <Slider
                    value={[voiceSpeed]}
                    onValueChange={([v]) => setVoiceSpeed(v)}
                    min={-4} max={4} step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    {speedMarks.map(m => (
                      <span
                        key={m}
                        className={m === voiceSpeed ? 'text-[#00d4c8] font-semibold' : ''}
                      >
                        {m === 0 ? '0' : m > 0 ? `+${m}` : m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Noise Sensitivity */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <label className="text-sm text-slate-300">
                      Noise Sensitivity <span className="text-red-400">*</span>
                    </label>
                    <Info size={13} className="text-slate-500" />
                  </div>
                  <Slider
                    value={[noiseSensitivity]}
                    onValueChange={([v]) => setNoiseSens(Math.round(v * 10) / 10)}
                    min={0.1} max={0.9} step={0.1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    {noiseMarks.map(m => (
                      <span
                        key={m}
                        className={Math.abs(m - noiseSensitivity) < 0.05 ? 'text-[#00d4c8] font-semibold' : ''}
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
            <div className="p-6 space-y-5 max-w-3xl">

              {/* Meeting Automation */}
              <div className="border border-[#1e2230] rounded-xl overflow-hidden">
                <button
                  onClick={() => setMeetingOpen(o => !o)}
                  className="w-full flex items-center justify-between px-5 py-4 text-slate-300 hover:bg-[#1a1d2e] transition-colors"
                >
                  <span className="text-sm font-medium">Meeting Automation</span>
                  {meetingOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {meetingOpen && (
                  <div className="px-5 pb-5 border-t border-[#1e2230]">
                    <p className="text-slate-500 text-sm mt-4">
                      Configure automated meeting scheduling after calls.
                    </p>
                  </div>
                )}
              </div>

              {/* Post Call Webhook */}
              <div className="border border-[#1e2230] rounded-xl overflow-hidden">
                <button
                  onClick={() => setWebhookOpen(o => !o)}
                  className="w-full flex items-center justify-between px-5 py-4 text-slate-300 hover:bg-[#1a1d2e] transition-colors"
                >
                  <span className="text-sm font-medium">Post Call Webhook</span>
                  {webhookOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {webhookOpen && (
                  <div className="px-5 pb-5 border-t border-[#1e2230]">
                    <div className="mt-4">
                      <label className="text-xs text-slate-400 mb-1.5 block">Webhook URL</label>
                      <Input
                        placeholder="https://your-server.com/webhook"
                        className="bg-[#1a1d2e] border-[#2a2d40] text-white placeholder:text-slate-500 rounded-lg h-10 focus:border-[#00d4c8] focus:ring-0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Collect Information */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-semibold text-white">Collect Information</h3>
                  <Info size={14} className="text-slate-500" />
                </div>
                <div className="space-y-2">
                  {collectFields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm w-5 text-right flex-shrink-0">{idx + 1}.</span>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#1a1d2e] border border-[#2a2d40] rounded text-xs text-slate-500 flex-shrink-0">
                        <Copy size={10} />
                        <span>ID: {field.id.slice(0, 8)}...</span>
                      </div>
                      <Input
                        placeholder="e.g., Customer's name, Company size"
                        value={field.label}
                        onChange={e => updateField(field.id, 'label', e.target.value)}
                        className="flex-1 bg-[#1a1d2e] border-[#2a2d40] text-white placeholder:text-slate-500 rounded-lg h-10 text-sm focus:border-[#00d4c8] focus:ring-0"
                      />
                      <Select value={field.type} onValueChange={v => updateField(field.id, 'type', v)}>
                        <SelectTrigger className="w-32 bg-[#1a1d2e] border-[#2a2d40] text-slate-400 rounded-lg h-10 focus:ring-0 text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1d2e] border-[#2a2d40] text-white rounded-lg">
                          {COLLECT_TYPES.map(t => (
                            <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addField}
                  className="flex items-center gap-1.5 text-sm text-[#00d4c8] hover:text-[#00bfb4] mt-3 transition-colors"
                >
                  <Plus size={14} /> Add Field
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-[#1e2230]" />

              {/* Qualification Criteria */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-semibold text-white">Qualification Criteria</h3>
                  <Info size={14} className="text-slate-500" />
                </div>
                <div className="space-y-2">
                  {qualCriteria.map((crit, idx) => (
                    <div key={crit.id} className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm w-5 text-right flex-shrink-0">{idx + 1}.</span>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#1a1d2e] border border-[#2a2d40] rounded text-xs text-slate-500 flex-shrink-0">
                        <span>id: {crit.id.slice(0, 8)}...</span>
                        <button onClick={() => navigator.clipboard?.writeText(crit.id)}>
                          <Copy size={10} className="hover:text-white transition-colors" />
                        </button>
                      </div>
                      <Input
                        placeholder="e.g., Budget > $10,000, Team size > 50 employees"
                        value={crit.value}
                        onChange={e => updateCriteria(crit.id, e.target.value)}
                        className="flex-1 bg-[#1a1d2e] border-[#2a2d40] text-white placeholder:text-slate-500 rounded-lg h-10 text-sm focus:border-[#00d4c8] focus:ring-0"
                      />
                      <button
                        onClick={() => removeCriteria(crit.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addCriteria}
                  className="flex items-center gap-1.5 text-sm text-[#00d4c8] hover:text-[#00bfb4] mt-3 transition-colors"
                >
                  <Plus size={14} /> Add Criteria
                </button>
              </div>
            </div>
          )}
        </div>
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
