'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { knowledgeBaseApi, callFlowsApi, agentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
  Bot, Mic, BrainCircuit, Wrench, PhoneCall, Radio, MessageSquare, 
  Settings2, Sparkles, Volume2, Globe, Activity 
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Shared styles ────────────────────────────────────────────────────
const inputCls =
  'mt-2 h-11 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all duration-300'

const textareaCls =
  'mt-2 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl transition-all duration-300 resize-none'

const selectTriggerCls =
  'mt-2 h-11 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-slate-100 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300'

const selectContentCls =
  'bg-white dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-700/50 rounded-xl shadow-2xl dark:shadow-cyan-500/10'

const labelCls = 'text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center gap-2'
const helperCls = 'text-xs text-slate-500 mt-1 mb-2 font-light'

// ── Schema ──────────────────────────────────────────────────────────────────
const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  firstMessage: z.string().min(1, 'First message is required'),
  voiceProvider: z.string(),
  voiceId: z.string().optional(),
  language: z.string().default('en'),
  llmProvider: z.string(),
  llmModel: z.string(),
  temperature: z.number().min(0).max(1),
  maxDuration: z.number().min(1),
  toolsJson: z.string().optional(),
  knowledgeBaseId: z.string().optional(),
  workflowId: z.string().optional(),
  customLlmUrl: z.string().optional(),
  transferToAgentId: z.string().optional(),
  voiceSpeed: z.number().min(0.5).max(2.0).optional(),
  interruptionSensitivity: z.number().min(0).max(1).optional(),
  backgroundDenoising: z.enum(['none', 'default', 'high']).optional(),
  fillerWords: z.boolean().optional(),
  ambientNoise: z.enum(['none', 'office', 'cafe']).optional(),
  transferNumber: z.string().optional(),
  voicemailMessage: z.string().optional(),
  sendSMS: z.boolean().optional(),
  sendWhatsApp: z.boolean().optional(),
  smsTemplate: z.string().optional(),
  whatsappTemplate: z.string().optional(),
})

type AgentFormData = z.infer<typeof agentFormSchema>

interface AgentFormProps {
  onSubmit: (data: AgentFormData) => void
  defaultValues?: Partial<AgentFormData>
  submitLabel?: string
}

export function AgentForm({ onSubmit, defaultValues, submitLabel = 'Deploy Agent' }: AgentFormProps) {
  const [activeTab, setActiveTab] = useState('identity')
  const [kbs, setKbs] = useState<any[]>([])
  const [flows, setFlows] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    knowledgeBaseApi.getAll().then(res => setKbs(res.data)).catch(console.error)
    callFlowsApi.getAll().then(res => setFlows(res.flows)).catch(console.error)
    agentsApi.getAll().then(res => setAgents(res.agents)).catch(console.error)
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      temperature: 0.7,
      maxDuration: 600,
      voiceProvider: 'edge-tts',
      language: 'en',
      llmProvider: 'groq',
      llmModel: 'llama-3.1-8b-instant',
      ...defaultValues,
    },
  })

  const temperature = watch('temperature')
  const llmProvider = watch('llmProvider')
  const language = watch('language')

  // ── Visual Tool Builder State ──────────────────────────────────────
  type ToolParam = { name: string; type: string; description: string; required: boolean }
  type VisualTool = { name: string; description: string; parameters: ToolParam[] }

  const [toolsViewMode, setToolsViewMode] = useState<'visual' | 'json'>('visual')
  const [visualTools, setVisualTools] = useState<VisualTool[]>(() => {
    try {
      const raw = defaultValues?.toolsJson
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return parsed.map((t: any) => ({
        name: t.function?.name || '',
        description: t.function?.description || '',
        parameters: Object.entries(t.function?.parameters?.properties || {}).map(([k, v]: any) => ({
          name: k, type: v.type || 'string', description: v.description || '',
          required: (t.function?.parameters?.required || []).includes(k),
        })),
      }))
    } catch { return [] }
  })

  const syncToolsToJson = (tools: VisualTool[]) => {
    const json = tools.filter(t => t.name).map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        ...(t.parameters.length > 0 ? {
          parameters: {
            type: 'object',
            properties: Object.fromEntries(t.parameters.map(p => [p.name, { type: p.type, description: p.description }])),
            required: t.parameters.filter(p => p.required).map(p => p.name),
          }
        } : {}),
      },
    }))
    setValue('toolsJson', json.length > 0 ? JSON.stringify(json, null, 2) : '')
  }

  const addVisualTool = () => {
    const updated = [...visualTools, { name: '', description: '', parameters: [] }]
    setVisualTools(updated)
  }
  const removeVisualTool = (idx: number) => {
    const updated = visualTools.filter((_, i) => i !== idx)
    setVisualTools(updated)
    syncToolsToJson(updated)
  }
  const updateVisualTool = (idx: number, field: string, value: string) => {
    const updated = [...visualTools]
    ;(updated[idx] as any)[field] = value
    setVisualTools(updated)
    syncToolsToJson(updated)
  }
  const addToolParam = (toolIdx: number) => {
    const updated = [...visualTools]
    updated[toolIdx].parameters.push({ name: '', type: 'string', description: '', required: false })
    setVisualTools(updated)
  }
  const removeToolParam = (toolIdx: number, paramIdx: number) => {
    const updated = [...visualTools]
    updated[toolIdx].parameters = updated[toolIdx].parameters.filter((_, i) => i !== paramIdx)
    setVisualTools(updated)
    syncToolsToJson(updated)
  }
  const updateToolParam = (toolIdx: number, paramIdx: number, field: string, value: any) => {
    const updated = [...visualTools]
    ;(updated[toolIdx].parameters[paramIdx] as any)[field] = value
    setVisualTools(updated)
    syncToolsToJson(updated)
  }

  const llmModels: Record<string, string[]> = {
    openai: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    groq: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  }

  const tabs = [
    { id: 'identity', label: 'Identity', icon: Bot, desc: 'Personality & Prompt' },
    { id: 'model', label: 'Intelligence', icon: BrainCircuit, desc: 'LLM & Context' },
    { id: 'voice', label: 'Voice & Audio', icon: Mic, desc: 'TTS & Acoustics' },
    { id: 'routing', label: 'Call Routing', icon: PhoneCall, desc: 'Handoff & Limits' },
    { id: 'tools', label: 'Tools', icon: Wrench, desc: 'Function Calling' },
    { id: 'actions', label: 'Post-Call', icon: MessageSquare, desc: 'SMS & Webhooks' },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-7xl mx-auto">
      {/* ── Sidebar Navigation ── */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
        <div className="mb-6 px-2 hidden lg:block">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-cyan-400" />
            Configuration
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure your AI agent parameters</p>
        </div>

        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 text-left whitespace-nowrap lg:whitespace-normal group relative overflow-hidden",
                  isActive 
                    ? "bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                    : "bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                )}
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  isActive ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300" : "bg-slate-100 dark:bg-slate-800/50 text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm tracking-wide">{tab.label}</div>
                  <div className="text-[10px] text-slate-500 hidden lg:block uppercase tracking-wider">{tab.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main Form Area ── */}
      <div className="flex-1 min-w-0">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white/60 dark:bg-slate-950/50 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
          {/* Cyberpunk Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Form Sections */}
          <div className="relative z-10 min-h-[400px]">
            {/* TAB: IDENTITY */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", activeTab === 'identity' ? 'block' : 'hidden')}>
              <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Bot className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> Identity & Persona
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Define who the agent is and how it behaves.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="name" className={labelCls}>Agent Name</Label>
                  <Input id="name" placeholder="e.g., Nexus Support Bot" {...register('name')} className={inputCls} />
                  {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="systemPrompt" className={labelCls}>System Prompt <Sparkles className="w-3 h-3 text-cyan-500" /></Label>
                  <p className={helperCls}>The core directive. Describe personality, rules, and objectives.</p>
                  <Textarea id="systemPrompt" placeholder="You are a highly efficient AI assistant..." {...register('systemPrompt')} className={cn(textareaCls, "h-48 font-mono text-sm leading-relaxed bg-slate-50 dark:bg-slate-950/80")} />
                  {errors.systemPrompt && <p className="text-red-400 text-xs mt-1.5">{errors.systemPrompt.message}</p>}
                </div>

                <div>
                  <Label htmlFor="firstMessage" className={labelCls}>Greeting Message</Label>
                  <p className={helperCls}>What the agent says immediately when the call connects.</p>
                  <Input id="firstMessage" placeholder="System online. How may I assist you?" {...register('firstMessage')} className={inputCls} />
                  {errors.firstMessage && <p className="text-red-400 text-xs mt-1.5">{errors.firstMessage.message}</p>}
                </div>
              </div>
            </div>

            {/* TAB: INTELLIGENCE */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", activeTab === 'model' ? 'block' : 'hidden')}>
               <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> Core Intelligence
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure the neural engine and knowledge base.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <Label className={labelCls}>LLM Provider</Label>
                    <Select value={llmProvider} onValueChange={(value) => { setValue('llmProvider', value); setValue('llmModel', llmModels[value][0]) }}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                        <SelectItem value="groq">Groq (LPU Fast)</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className={labelCls}>Model Version</Label>
                    <Select value={watch('llmModel')} onValueChange={(v) => setValue('llmModel', v)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {(llmModels[llmProvider] || []).map((model) => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-5 bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/50">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className={labelCls}>Creativity (Temp): <span className="text-cyan-600 dark:text-cyan-400 font-mono">{temperature.toFixed(2)}</span></Label>
                    </div>
                    <Slider value={[temperature]} onValueChange={(v) => setValue('temperature', v[0])} min={0} max={1} step={0.01} className="py-2" />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 uppercase">
                      <span>Strict</span><span>Balanced</span><span>Creative</span>
                    </div>
                  </div>

                  <div>
                     <Label className={labelCls}>Custom LLM URL (BYOL)</Label>
                     <Input placeholder="https://your-api.com/v1/chat" {...register('customLlmUrl')} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                <div>
                  <Label className={labelCls}>Knowledge Base (RAG)</Label>
                  <p className={helperCls}>Attach documents for factual grounding.</p>
                  <Select value={watch('knowledgeBaseId') || 'none'} onValueChange={(val) => setValue('knowledgeBaseId', val === 'none' ? undefined : val)}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Standalone Mode" /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      <SelectItem value="none">Standalone Mode</SelectItem>
                      {kbs.map(kb => <SelectItem key={kb._id} value={kb._id}>{kb.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={labelCls}>Visual Workflow Override</Label>
                  <p className={helperCls}>Use a node-based flow instead of pure prompt.</p>
                  <Select value={watch('workflowId') || 'none'} onValueChange={(val) => setValue('workflowId', val === 'none' ? undefined : val)}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Standard LLM Execution" /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      <SelectItem value="none">Standard LLM Execution</SelectItem>
                      {flows.map(flow => <SelectItem key={flow._id} value={flow._id}>{flow.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* TAB: VOICE & AUDIO */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", activeTab === 'voice' ? 'block' : 'hidden')}>
               <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Mic className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> Voice Synthesis
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure speech, language, and acoustic parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className={labelCls}><Globe className="w-4 h-4 text-blue-400"/> Primary Language</Label>
                  <Select value={language} onValueChange={(value) => setValue('language', value)}>
                    <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                    <SelectContent className={selectContentCls}>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="en-IN">English (India)</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="hi-Latn">Hinglish</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                      <SelectItem value="te">Telugu</SelectItem>
                      <SelectItem value="multi">Multilingual Auto-Detect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className={labelCls}>Voice Provider</Label>
                    <Select defaultValue={defaultValues?.voiceProvider || 'edge-tts'} onValueChange={(v) => setValue('voiceProvider' as any, v)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        <SelectItem value="edge-tts">Edge TTS (Fast)</SelectItem>
                        <SelectItem value="eleven-labs">ElevenLabs (HD)</SelectItem>
                        <SelectItem value="azure">Azure Cognitive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className={labelCls}>Speaker ID</Label>
                    <Select value={watch('voiceId') || 'en-US-JennyNeural'} onValueChange={(v) => setValue('voiceId', v)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {language.startsWith('hi') ? (
                          <>
                            <SelectItem value="hi-IN-SwaraNeural">Swara (F)</SelectItem>
                            <SelectItem value="hi-IN-MadhurNeural">Madhur (M)</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="en-US-JennyNeural">Jenny (F)</SelectItem>
                            <SelectItem value="en-US-GuyNeural">Guy (M)</SelectItem>
                            <SelectItem value="en-IN-NeerjaNeural">Neerja (F)</SelectItem>
                            <SelectItem value="en-IN-PrabhatNeural">Prabhat (M)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/50 mt-4 space-y-6">
                <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400 font-medium text-sm border-b border-slate-200 dark:border-slate-800/50 pb-2">
                  <Volume2 className="w-4 h-4" /> Acoustic Tuning
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-slate-700 dark:text-slate-300 text-sm">Talk Speed: <span className="text-cyan-600 dark:text-cyan-400 font-mono">{watch('voiceSpeed')?.toFixed(1) || '1.0'}x</span></Label>
                    </div>
                    <Slider value={[watch('voiceSpeed') || 1.0]} onValueChange={(v) => setValue('voiceSpeed', v[0])} min={0.5} max={2.0} step={0.1} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-slate-700 dark:text-slate-300 text-sm">Interruptible: <span className="text-cyan-600 dark:text-cyan-400 font-mono">{watch('interruptionSensitivity')?.toFixed(2) || '0.50'}</span></Label>
                    </div>
                    <Slider value={[watch('interruptionSensitivity') || 0.5]} onValueChange={(v) => setValue('interruptionSensitivity', v[0])} min={0} max={1} step={0.1} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <Label className={labelCls}>Background Filter</Label>
                    <Select value={watch('backgroundDenoising') || 'default'} onValueChange={(val) => setValue('backgroundDenoising', val as any)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        <SelectItem value="none">Raw Audio</SelectItem>
                        <SelectItem value="default">Smart Denoise</SelectItem>
                        <SelectItem value="high">Aggressive Filter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={labelCls}>Ambient SoundFx</Label>
                    <Select value={watch('ambientNoise') || 'none'} onValueChange={(val) => setValue('ambientNoise', val as any)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        <SelectItem value="none">Digital Silence</SelectItem>
                        <SelectItem value="office">Office Chatter</SelectItem>
                        <SelectItem value="cafe">Cafe Ambience</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-200">Humanize (Filler Words)</Label>
                    <p className="text-xs text-slate-500">Injects "umm", "ahh" to sound less robotic</p>
                  </div>
                  <Switch checked={watch('fillerWords') || false} onCheckedChange={(val) => setValue('fillerWords', val)} className="data-[state=checked]:bg-cyan-500" />
                </div>
              </div>
            </div>

            {/* TAB: ROUTING */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", activeTab === 'routing' ? 'block' : 'hidden')}>
              <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <PhoneCall className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> Telephony & Limits
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage call duration, voicemail, and human handoffs.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="maxDuration" className={labelCls}>Timeout (Max Duration)</Label>
                  <p className={helperCls}>Hard limit in seconds before forceful disconnect.</p>
                  <Input id="maxDuration" type="number" {...register('maxDuration', { valueAsNumber: true })} className={cn(inputCls, "max-w-xs font-mono")} />
                  {errors.maxDuration && <p className="text-red-400 text-xs mt-1.5">{errors.maxDuration.message}</p>}
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/50 space-y-4">
                  <h4 className="text-cyan-600 dark:text-cyan-400 font-medium text-sm flex items-center gap-2"><Activity className="w-4 h-4"/> Handoff Protocol</h4>
                  
                  <div>
                    <Label className={labelCls}>Transfer PSTN Number</Label>
                    <Input placeholder="+1 234 567 8900" {...register('transferNumber')} className={inputCls} />
                  </div>

                  <div>
                    <Label className={labelCls}>AI-to-AI Escalation</Label>
                    <Select value={watch('transferToAgentId') || 'none'} onValueChange={(val) => setValue('transferToAgentId', val === 'none' ? undefined : val)}>
                      <SelectTrigger className={selectTriggerCls}><SelectValue placeholder="No escalation path" /></SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        <SelectItem value="none">None</SelectItem>
                        {agents.map(ag => <SelectItem key={ag._id} value={ag._id}>{ag.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className={labelCls}>Answering Machine Message</Label>
                  <p className={helperCls}>Payload delivered if voicemail beep is detected.</p>
                  <Textarea placeholder="Hi, leaving a message regarding..." {...register('voicemailMessage')} className={cn(textareaCls, "h-24")} />
                </div>
              </div>
            </div>

            {/* TAB: TOOLS */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", activeTab === 'tools' ? 'block' : 'hidden')}>
               <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Wrench className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> Function Calling
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Add custom tools your agent can invoke during conversations.</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="text-xs rounded-lg border-slate-200 dark:border-slate-700" onClick={() => setToolsViewMode(prev => prev === 'visual' ? 'json' : 'visual')}>
                  {toolsViewMode === 'visual' ? '{ } Raw JSON' : 'Visual Builder'}
                </Button>
              </div>

              {toolsViewMode === 'visual' ? (
                <div className="space-y-4">
                  {visualTools.map((tool, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Tool {idx + 1}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeVisualTool(idx)}>
                          <span className="text-lg leading-none">&times;</span>
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className={labelCls}>Function Name</Label>
                          <Input placeholder="book_appointment" value={tool.name} onChange={(e) => updateVisualTool(idx, 'name', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <Label className={labelCls}>Description</Label>
                          <Input placeholder="Books a calendar slot for the customer" value={tool.description} onChange={(e) => updateVisualTool(idx, 'description', e.target.value)} className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className={labelCls}>Parameters</Label>
                          <Button type="button" variant="ghost" size="sm" className="text-xs text-cyan-600 hover:text-cyan-700 h-7 px-2" onClick={() => addToolParam(idx)}>+ Add Param</Button>
                        </div>
                        {tool.parameters.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No parameters. Click "+ Add Param" to add one.</p>
                        ) : (
                          <div className="space-y-2">
                            {tool.parameters.map((param, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-3 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                                <Input placeholder="param_name" value={param.name} onChange={(e) => updateToolParam(idx, pIdx, 'name', e.target.value)} className="h-8 text-xs flex-1 bg-transparent border-slate-200 dark:border-slate-700 rounded-lg" />
                                <select value={param.type} onChange={(e) => updateToolParam(idx, pIdx, 'type', e.target.value)} className="h-8 text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-slate-700 dark:text-slate-300">
                                  <option value="string">string</option>
                                  <option value="number">number</option>
                                  <option value="boolean">boolean</option>
                                </select>
                                <Input placeholder="Description" value={param.description} onChange={(e) => updateToolParam(idx, pIdx, 'description', e.target.value)} className="h-8 text-xs flex-[2] bg-transparent border-slate-200 dark:border-slate-700 rounded-lg" />
                                <label className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                                  <input type="checkbox" checked={param.required} onChange={(e) => updateToolParam(idx, pIdx, 'required', e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 w-3.5 h-3.5" />
                                  Req
                                </label>
                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 shrink-0" onClick={() => removeToolParam(idx, pIdx)}>
                                  <span className="text-sm">&times;</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" className="w-full rounded-xl border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 transition-colors" onClick={addVisualTool}>
                    <Wrench className="w-4 h-4 mr-2" /> Add Tool
                  </Button>
                </div>
              ) : (
                <div>
                  <Label className={labelCls}>JSON Schema Array</Label>
                  <div className="mt-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
                    <div className="flex bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono">
                      <span className="text-cyan-600 dark:text-cyan-500">tools.json</span>
                    </div>
                    <Textarea
                      placeholder={`[\n  {\n    "type": "function",\n    "function": {\n      "name": "book_appointment",\n      "description": "Books a slot",\n      "parameters": {\n        "type": "object",\n        "properties": {\n          "date": { "type": "string", "description": "Date" }\n        },\n        "required": ["date"]\n      }\n    }\n  }\n]`}
                      {...register('toolsJson')}
                      className={cn(textareaCls, "mt-0 border-0 rounded-none h-64 font-mono text-xs text-emerald-600 dark:text-green-400 bg-transparent focus:ring-0")}
                    />
                  </div>
                  {errors.toolsJson && <p className="text-red-400 text-xs mt-1.5">{errors.toolsJson.message}</p>}
                </div>
              )}
            </div>

            {/* TAB: POST-CALL */}
            <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4 duration-500", activeTab === 'actions' ? 'block' : 'hidden')}>
              <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Radio className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> Webhooks & Messaging
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Automated events triggered upon call termination.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 cursor-pointer hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-cyan-50 dark:hover:bg-cyan-500/5 transition-all group shadow-sm">
                  <input type="checkbox" {...register('sendSMS')} className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Dispatch SMS</p>
                    <p className="text-xs text-slate-500">Send summary via Twilio</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 cursor-pointer hover:border-green-400 dark:hover:border-green-500/50 hover:bg-green-50 dark:hover:bg-green-500/5 transition-all group shadow-sm">
                  <input type="checkbox" {...register('sendWhatsApp')} className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-green-500 focus:ring-green-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">WhatsApp Packet</p>
                    <p className="text-xs text-slate-500">Send structured summary</p>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className={labelCls}>SMS Payload Template</Label>
                  <p className={helperCls}>Vars: {'{{agentName}}'}, {'{{summary}}'}, {'{{duration}}'}</p>
                  <Textarea placeholder="Call summary: {{summary}}" {...register('smsTemplate')} className={cn(textareaCls, "h-20")} />
                </div>

                <div>
                  <Label className={labelCls}>WhatsApp Payload Template</Label>
                  <Textarea placeholder="*Call Ended*\nDuration: {{duration}}\nLog: {{summary}}" {...register('whatsappTemplate')} className={cn(textareaCls, "h-32")} />
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer Action */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button
              type="submit"
              className="h-12 px-8 bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 font-bold tracking-wide rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] dark:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 hover:-translate-y-0.5"
            >
              {submitLabel} <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
