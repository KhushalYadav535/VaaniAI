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

// ── Shared class strings ────────────────────────────────────────────────────
const inputCls =
  'mt-2 h-11 bg-white/60 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-purple-400 dark:focus:border-purple-600 rounded-xl font-light backdrop-blur-sm'

const textareaCls =
  'mt-2 bg-white/60 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-purple-400 dark:focus:border-purple-600 rounded-xl font-light backdrop-blur-sm'

const selectTriggerCls =
  'mt-2 h-11 bg-white/60 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 rounded-xl font-light backdrop-blur-sm'

const selectContentCls =
  'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-xl shadow-xl'

const labelCls = 'text-slate-700 dark:text-slate-300 font-medium text-sm'

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
})

type AgentFormData = z.infer<typeof agentFormSchema>

interface AgentFormProps {
  onSubmit: (data: AgentFormData) => void
  defaultValues?: Partial<AgentFormData>
  submitLabel?: string
}

export function AgentForm({ onSubmit, defaultValues, submitLabel = 'Create Agent' }: AgentFormProps) {
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

  const llmModels: Record<string, string[]> = {
    openai: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    groq: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    gemini: ['gemini-1.5-pro', 'gemini-1.0-pro'],
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">

      {/* Section: Identity */}
      <div className="space-y-1 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">Identity</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div>
        <Label htmlFor="name" className={labelCls}>Agent Name</Label>
        <Input
          id="name"
          placeholder="e.g., Customer Support Bot"
          {...register('name')}
          className={inputCls}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="systemPrompt" className={labelCls}>System Prompt</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">Define the agent's personality, goals, and behavior.</p>
        <Textarea
          id="systemPrompt"
          placeholder="You are a professional, friendly assistant for..."
          {...register('systemPrompt')}
          className={`${textareaCls} min-h-36`}
        />
        {errors.systemPrompt && <p className="text-red-500 text-xs mt-1.5">{errors.systemPrompt.message}</p>}
      </div>

      <div>
        <Label className={labelCls}>Knowledge Base (RAG)</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">Select a document base to ground the agent's knowledge.</p>
        <Select
          value={watch('knowledgeBaseId') || 'none'}
          onValueChange={(val) => setValue('knowledgeBaseId', val === 'none' ? undefined : val)}
        >
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue placeholder="No Knowledge Base" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="none">No Knowledge Base (LLM default knowledge only)</SelectItem>
            {kbs.map(kb => (
              <SelectItem key={kb._id} value={kb._id}>{kb.name} ({kb.status})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={labelCls}>Advanced Workflow (Visual Flow)</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">Override default AI logic with a visual node-based workflow.</p>
        <Select
          value={watch('workflowId') || 'none'}
          onValueChange={(val) => setValue('workflowId', val === 'none' ? undefined : val)}
        >
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue placeholder="Standard Prompt Logic" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="none">Standard Prompt Logic</SelectItem>
            {flows.map(flow => (
              <SelectItem key={flow._id} value={flow._id}>{flow.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="firstMessage" className={labelCls}>First Message</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">What the agent says when the call begins.</p>
        <Input
          id="firstMessage"
          placeholder="Hello! How can I help you today?"
          {...register('firstMessage')}
          className={inputCls}
        />
        {errors.firstMessage && <p className="text-red-500 text-xs mt-1.5">{errors.firstMessage.message}</p>}
      </div>

      {/* Section: Language */}
      <div className="space-y-1 pb-2 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">Language</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div>
        <Label className={`${labelCls} flex items-center gap-2`}>
          🌐 Agent Language
          <span className="text-xs text-purple-500 dark:text-purple-400 font-normal normal-case tracking-normal">Controls STT + LLM response language</span>
        </Label>
        <Select value={language} onValueChange={(value) => setValue('language', value)}>
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="en">🇺🇸 English</SelectItem>
            <SelectItem value="en-IN">🇮🇳 Indian English</SelectItem>
            {/* Hindi & Variations */}
            <SelectItem value="hi">🇮🇳 Hindi — हिंदी (Devanagari)</SelectItem>
            <SelectItem value="hi-Latn">🇮🇳 Hinglish — Hindi in Roman script</SelectItem>
            {/* South Indian Languages */}
            <SelectItem value="ta">🇮🇳 Tamil — தமிழ்</SelectItem>
            <SelectItem value="te">🇮🇳 Telugu — తెలుగు</SelectItem>
            <SelectItem value="kn">🇮🇳 Kannada — ಕನ್ನಡ</SelectItem>
            <SelectItem value="ml">🇮🇳 Malayalam — മലയാളം</SelectItem>
            {/* West Indian Languages */}
            <SelectItem value="mr">🇮🇳 Marathi — मराठी</SelectItem>
            <SelectItem value="gu">🇮🇳 Gujarati — ગુજરાતી</SelectItem>
            {/* East Indian Languages */}
            <SelectItem value="bn">🇮🇳 Bengali — বাংলা</SelectItem>
            {/* Others */}
            <SelectItem value="ur">🇮🇳 Urdu — اردو</SelectItem>
            <SelectItem value="pa">🇮🇳 Punjabi — ਪੰਜਾਬੀ</SelectItem>
            <SelectItem value="multi">🌏 Multilingual (Auto-detect Hindi/English)</SelectItem>
          </SelectContent>
        </Select>
        {language === 'hi' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-2.5">
            ⚠️ Hindi mode: Use a Hindi TTS voice like <strong>hi-IN-SwaraNeural</strong> or <strong>hi-IN-MadhurNeural</strong>.
          </p>
        )}
        {language === 'hi-Latn' && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl px-3 py-2.5">
            ℹ️ Hinglish: AI replies in casual Hindi written in English letters (e.g. &quot;Aap kaise hain?&quot;).
          </p>
        )}
        {language === 'multi' && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl px-3 py-2.5">
            ✅ Agent detects user language automatically and responds in the same language.
          </p>
        )}
      </div>

      {/* Section: AI Model */}
      <div className="space-y-1 pb-2 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">AI Model</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label className={labelCls}>Voice Provider</Label>
          <Select
            defaultValue={defaultValues?.voiceProvider || 'edge-tts'}
            onValueChange={(v) => setValue('voiceProvider' as any, v)}
          >
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentCls}>
              <SelectItem value="edge-tts">Edge TTS (Free)</SelectItem>
              <SelectItem value="eleven-labs">ElevenLabs</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="azure">Azure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={labelCls}>Voice ID (Speaker)</Label>
          <Select
            value={watch('voiceId') || 'en-US-JennyNeural'}
            onValueChange={(v) => setValue('voiceId', v)}
          >
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentCls}>
              {language.startsWith('hi') ? (
                <>
                  <SelectItem value="hi-IN-SwaraNeural">Swara (Female, Hindi)</SelectItem>
                  <SelectItem value="hi-IN-MadhurNeural">Madhur (Male, Hindi)</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="en-US-JennyNeural">Jenny (Female, US)</SelectItem>
                  <SelectItem value="en-US-GuyNeural">Guy (Male, US)</SelectItem>
                  <SelectItem value="en-IN-NeerjaNeural">Neerja (Female, India)</SelectItem>
                  <SelectItem value="en-IN-PrabhatNeural">Prabhat (Male, India)</SelectItem>
                  <SelectItem value="en-GB-SoniaNeural">Sonia (Female, UK)</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={labelCls}>LLM Provider</Label>
          <Select
            value={llmProvider}
            onValueChange={(value) => {
              setValue('llmProvider', value)
              setValue('llmModel', llmModels[value][0])
            }}
          >
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentCls}>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className={labelCls}>LLM Model</Label>
        <Select
          defaultValue={defaultValues?.llmModel || 'llama-3.1-8b-instant'}
          onValueChange={(v) => setValue('llmModel', v)}
        >
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            {(llmModels[llmProvider] || []).map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={labelCls}>Custom LLM Webhook URL</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">Advanced: Bypass Groq and route conversation to your own external LLM server.</p>
        <Input
          placeholder="https://your-server.com/api/chat"
          {...register('customLlmUrl')}
          className={inputCls}
        />
      </div>

      {/* Section: Voice & Audio Settings */}
      <div className="space-y-1 pb-2 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">Audio Settings</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className={labelCls}>Voice Speed</Label>
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{watch('voiceSpeed')?.toFixed(1) || '1.0'}x</span>
          </div>
          <Slider
            value={[watch('voiceSpeed') || 1.0]}
            onValueChange={(val) => setValue('voiceSpeed', val[0])}
            min={0.5}
            max={2.0}
            step={0.1}
            className="mt-2"
          />
        </div>

        <div>
          <Label className={labelCls}>Background Denoising</Label>
          <Select
            value={watch('backgroundDenoising') || 'default'}
            onValueChange={(val) => setValue('backgroundDenoising', val as any)}
          >
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentCls}>
              <SelectItem value="none">No Denoising (Raw Audio)</SelectItem>
              <SelectItem value="default">Default (Smart Format)</SelectItem>
              <SelectItem value="high">High (Filter Background Voices)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={labelCls}>Ambient Sound (Background Noise)</Label>
          <Select
            value={watch('ambientNoise') || 'none'}
            onValueChange={(val) => setValue('ambientNoise', val as any)}
          >
            <SelectTrigger className={selectTriggerCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={selectContentCls}>
              <SelectItem value="none">None (Silent Background)</SelectItem>
              <SelectItem value="office">Busy Office</SelectItem>
              <SelectItem value="cafe">Coffee Shop</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Section: Behaviour */}
      <div className="space-y-1 pb-2 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">Behaviour</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label className={labelCls}>Temperature: <span className="text-purple-600 dark:text-purple-400">{temperature.toFixed(2)}</span></Label>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5">0 = precise &amp; factual · 1 = creative &amp; varied</p>
          </div>
          <div className="text-2xl font-thin text-slate-400">{temperature < 0.4 ? '🎯' : temperature < 0.7 ? '⚖️' : '🎨'}</div>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={(value) => setValue('temperature', value[0])}
          min={0}
          max={1}
          step={0.01}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="maxDuration" className={labelCls}>Max Call Duration</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">In seconds. Call will end automatically after this duration.</p>
        <Input
          id="maxDuration"
          type="number"
          {...register('maxDuration', { valueAsNumber: true })}
          className={inputCls}
        />
        {errors.maxDuration && <p className="text-red-500 text-xs mt-1.5">{errors.maxDuration.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <Label className={labelCls}>Interruption Sensitivity: <span className="text-purple-600 dark:text-purple-400">{watch('interruptionSensitivity')?.toFixed(2) || '0.50'}</span></Label>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5">0 = hard to interrupt · 1 = easily interrupted</p>
          </div>
        </div>
        <Slider
          value={[watch('interruptionSensitivity') || 0.5]}
          onValueChange={(val) => setValue('interruptionSensitivity', val[0])}
          min={0}
          max={1}
          step={0.1}
          className="mt-2"
        />
      </div>

      <div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40">
          <div>
            <Label className={labelCls}>Filler Words Injection</Label>
            <p className="text-xs text-slate-500 font-light mt-0.5">AI will occasionally say "um", "hmm" before answering.</p>
          </div>
          <Switch
            checked={watch('fillerWords') || false}
            onCheckedChange={(val) => setValue('fillerWords', val)}
          />
        </div>
      </div>

      {/* Section: Tools */}
      <div className="space-y-1 pb-2 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">Tools</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className={labelCls}>Custom Tools (JSON Array)</Label>
          <span className="text-xs bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full font-medium">Optional</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">Define function-calling tools for your agent to use.</p>
        <Textarea
          id="toolsJson"
          placeholder={`[\n  {\n    "type": "function",\n    "function": {\n      "name": "check_order",\n      "description": "Lookup order status"\n    }\n  }\n]`}
          {...register('toolsJson')}
          className={`${textareaCls} font-mono text-xs min-h-32`}
        />
        {errors.toolsJson && <p className="text-red-500 text-xs mt-1.5">{errors.toolsJson.message}</p>}
      </div>

      {/* Section: Voicemail & AMD */}
      <div className="space-y-1 pb-2 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">📞 Voicemail & AMD</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className={labelCls}>Voicemail Message</Label>
          <span className="text-xs bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-0.5 rounded-full font-medium">NEW</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">Message left when an answering machine is detected during outbound calls.</p>
        <Textarea
          id="voicemailMessage"
          placeholder="Hi, this is calling from [Company]. We wanted to reach out regarding your inquiry. Please call us back at your convenience. Thank you!"
          {...register('voicemailMessage' as any)}
          className={`${textareaCls} min-h-20`}
        />
      </div>

      {/* Section: Post-Call Automation */}
      <div className="space-y-1 pb-2 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">📱 Post-Call Automation</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 cursor-pointer hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
            <input
              type="checkbox"
              {...register('sendSMS' as any)}
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">📩 SMS Follow-up</p>
              <p className="text-xs text-slate-500 font-light">Send SMS after call ends</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 cursor-pointer hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
            <input
              type="checkbox"
              {...register('sendWhatsApp' as any)}
              className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">💬 WhatsApp Follow-up</p>
              <p className="text-xs text-slate-500 font-light">Send WhatsApp message</p>
            </div>
          </label>
        </div>

        <div>
          <Label className={labelCls}>SMS Template</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">
            Variables: {'{{agentName}}'}, {'{{summary}}'}, {'{{duration}}'}, {'{{actionItems}}'}, {'{{customerName}}'}, {'{{date}}'}
          </p>
          <Textarea
            placeholder="Thank you for your call with {{agentName}}. Summary: {{summary}}"
            {...register('smsTemplate' as any)}
            className={`${textareaCls} min-h-16 text-sm`}
          />
        </div>

        <div>
          <Label className={labelCls}>WhatsApp Template</Label>
          <Textarea
            placeholder={`🎙️ *Call Summary*\n\nAgent: {{agentName}}\nDuration: {{duration}}\n\n{{summary}}\n\n{{actionItems}}`}
            {...register('whatsappTemplate' as any)}
            className={`${textareaCls} min-h-24 text-sm`}
          />
        </div>
      </div>

      {/* Section: Transfer / Handoff */}
      <div className="space-y-1 pb-2 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400">🔄 Human Handoff</h3>
        <div className="h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
      </div>

      <div>
        <Label className={labelCls}>Transfer Phone Number</Label>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">When AI can't handle the call, transfer to this number.</p>
        <Input
          placeholder="+91-9876543210"
          {...register('transferNumber' as any)}
          className={inputCls}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className={labelCls}>Multi-Agent Handoff (AI-to-AI)</Label>
          <span className="text-xs bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full font-medium">NEW</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 mb-1">Select an agent to transfer the call to if requested by the user.</p>
        <Select
          value={watch('transferToAgentId' as any) || 'none'}
          onValueChange={(val) => setValue('transferToAgentId' as any, val === 'none' ? undefined : val)}
        >
          <SelectTrigger className={selectTriggerCls}>
            <SelectValue placeholder="No AI Handoff" />
          </SelectTrigger>
          <SelectContent className={selectContentCls}>
            <SelectItem value="none">No AI Handoff</SelectItem>
            {agents.map(ag => (
              <SelectItem key={ag._id} value={ag._id}>{ag.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-medium shadow-lg shadow-purple-500/25 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.01]"
      >
        {submitLabel}
      </Button>
    </form>
  )
}
