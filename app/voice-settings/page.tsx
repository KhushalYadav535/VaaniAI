'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { publicApi, agentsApi, twilioApi } from '@/lib/api'
import {
  Volume2, Play, Pause, Phone, Zap, Settings,
  Loader2, PhoneOutgoing, Bot, Globe, Check
} from 'lucide-react'

const VOICES = [
  { id: 'en-US-JennyNeural', name: 'Jenny', lang: 'English (US)', gender: 'Female', personality: 'Friendly & professional' },
  { id: 'en-US-GuyNeural', name: 'Guy', lang: 'English (US)', gender: 'Male', personality: 'Clear & confident' },
  { id: 'en-US-AriaNeural', name: 'Aria', lang: 'English (US)', gender: 'Female', personality: 'Warm & natural' },
  { id: 'en-US-DavisNeural', name: 'Davis', lang: 'English (US)', gender: 'Male', personality: 'Deep & engaging' },
  { id: 'en-US-ChristopherNeural', name: 'Christopher', lang: 'English (US)', gender: 'Male', personality: 'Authoritative' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', lang: 'English (UK)', gender: 'Female', personality: 'Elegant & articulate' },
  { id: 'en-GB-RyanNeural', name: 'Ryan', lang: 'English (UK)', gender: 'Male', personality: 'Crisp British accent' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara', lang: 'Hindi (India)', gender: 'Female', personality: 'Warm Indian voice' },
  { id: 'hi-IN-MadhurNeural', name: 'Madhur', lang: 'Hindi (India)', gender: 'Male', personality: 'Smooth Indian voice' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira', lang: 'Spanish (ES)', gender: 'Female', personality: 'Vivid & expressive' },
]

const PREVIEW_TEXTS: Record<string, string> = {
  'hi-IN-SwaraNeural': 'नमस्ते! मैं आपकी AI असिस्टेंट हूं। आज मैं आपकी कैसे मदद कर सकती हूं?',
  'hi-IN-MadhurNeural': 'नमस्ते! मैं Vocred का AI असिस्टेंट हूं। मुझसे कोई भी सवाल पूछें।',
  'es-ES-ElviraNeural': 'Hola! Soy tu asistente de inteligencia artificial. ¿En qué puedo ayudarte hoy?',
}
const DEFAULT_PREVIEW = "Hello! I'm your AI assistant powered by Vocred. How can I help you today?"

export default function VoiceSettingsPage() {
  const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural')
  const [speed, setSpeed] = useState(1.0)
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW)
  const [playing, setPlaying] = useState<string | null>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [callTo, setCallTo] = useState('')
  const [calling, setCalling] = useState(false)
  const [callStatus, setCallStatus] = useState('')
  const [filter, setFilter] = useState('all')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    agentsApi.getAll({ status: 'active' }).then((d: any) => setAgents(d.agents || [])).catch(() => {})
  }, [])

  const previewVoice = async (voiceId: string) => {
    if (playing === voiceId) {
      audioRef.current?.pause()
      setPlaying(null)
      return
    }

    setPlaying(voiceId)
    try {
      const text = PREVIEW_TEXTS[voiceId] || DEFAULT_PREVIEW
      // Call backend TTS preview endpoint
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/voice-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, voiceId, speed }),
      })

      if (!res.ok) throw new Error('Preview failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      if (audioRef.current) audioRef.current.pause()
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setPlaying(null)
      audioRef.current.onerror = () => setPlaying(null)
      await audioRef.current.play()
    } catch (e) {
      setPlaying(null)
    }
  }

  const makeCall = async () => {
    if (!callTo || !selectedAgent) return
    setCalling(true)
    setCallStatus('')
    try {
      const data: any = await twilioApi.makeOutboundCall(callTo, selectedAgent)
      setCallStatus(`✅ Calling ${callTo}... Call SID: ${data.callSid}`)
    } catch (err: any) {
      setCallStatus(`❌ ${err.message}`)
    } finally {
      setCalling(false)
    }
  }

  const filteredVoices = filter === 'all' ? VOICES :
    VOICES.filter(v => {
      if (filter === 'hindi') return v.lang.includes('Hindi')
      if (filter === 'english') return v.lang.includes('English')
      if (filter === 'female') return v.gender === 'Female'
      if (filter === 'male') return v.gender === 'Male'
      return true
    })

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-pink-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Voice Settings</h1>
              <p className="text-sm text-slate-500 font-light">Choose voices, preview them, and make outbound calls</p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 border border-green-200/50">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-light text-green-700 dark:text-green-400">FREE — No API Key needed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Voice Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-1.5 flex gap-1 flex-wrap">
            {[
              { id: 'all', label: 'All Voices' },
              { id: 'english', label: '🇺🇸 English' },
              { id: 'hindi', label: '🇮🇳 Hindi' },
              { id: 'female', label: '👩 Female' },
              { id: 'male', label: '👨 Male' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`flex-1 py-2 px-3 rounded-2xl text-sm font-light transition-all ${
                  filter === f.id
                    ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Voice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVoices.map(voice => (
              <div key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedVoice === voice.id
                    ? 'border-purple-400/60 dark:border-purple-600/60 bg-gradient-to-br from-violet-600/5 to-purple-600/5'
                    : 'border-slate-200/50 dark:border-slate-800/50 hover:border-purple-300/50'
                }`}>
                {selectedVoice === voice.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-light flex-shrink-0 ${
                    voice.gender === 'Female' ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {voice.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-slate-800 dark:text-slate-200">{voice.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-light">{voice.lang} · {voice.gender}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-light mt-0.5 truncate">{voice.personality}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); previewVoice(voice.id) }}
                  className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-light transition-all ${
                    playing === voice.id
                      ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-950/30 hover:text-purple-600'
                  }`}>
                  {playing === voice.id
                    ? <><Pause className="w-3 h-3" /> Playing...</>
                    : <><Play className="w-3 h-3" /> Preview Voice</>}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Preview Controls */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-light text-slate-700 dark:text-slate-300">Preview Settings</h2>
            </div>

            {/* Speed slider */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-light text-slate-600 dark:text-slate-400">Speed</label>
                <span className="text-xs font-light text-purple-600 dark:text-purple-400">{speed}x</span>
              </div>
              <Slider
                value={[speed]}
                min={0.5} max={2.0} step={0.1}
                onValueChange={([v]) => setSpeed(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 font-light">
                <span>0.5x Slow</span>
                <span>1x Normal</span>
                <span>2x Fast</span>
              </div>
            </div>

            {/* Preview text */}
            <div className="space-y-2">
              <label className="text-xs font-light text-slate-600 dark:text-slate-400">Preview text</label>
              <textarea
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-xs font-light text-slate-700 dark:text-slate-300 resize-none focus:outline-none focus:border-purple-400"
              />
            </div>

            <button
              onClick={() => previewVoice(selectedVoice)}
              disabled={!!playing}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-light hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-60"
            >
              {playing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              {playing ? 'Playing...' : 'Preview Selected Voice'}
            </button>

            {/* Selected voice info */}
            {(() => {
              const v = VOICES.find(v => v.id === selectedVoice)
              return v ? (
                <div className="mt-3 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/30">
                  <p className="text-xs font-light text-purple-700 dark:text-purple-300">
                    Selected: <strong>{v.name}</strong> — {v.lang}
                  </p>
                  <p className="text-xs text-slate-500 font-light mt-0.5">Copy voice ID to use in agents:</p>
                  <code className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">{v.id}</code>
                </div>
              ) : null
            })()}
          </div>

          {/* Outbound Call Panel */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <PhoneOutgoing className="w-4 h-4 text-green-600" />
              <h2 className="text-sm font-light text-slate-700 dark:text-slate-300">Make Outbound Call</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-light text-slate-600 dark:text-slate-400 mb-1 block">Select Agent</label>
                <select
                  value={selectedAgent}
                  onChange={e => setSelectedAgent(e.target.value)}
                  className="w-full h-9 px-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-sm font-light text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-400"
                >
                  <option value="">Choose agent...</option>
                  {agents.map(a => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-light text-slate-600 dark:text-slate-400 mb-1 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="+1234567890"
                    value={callTo}
                    onChange={e => setCallTo(e.target.value)}
                    className="pl-9 h-9 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl font-light text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={makeCall}
                disabled={calling || !callTo || !selectedAgent}
                className="w-full h-9 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-light rounded-xl text-sm shadow-lg shadow-green-500/25 transition-all hover:scale-[1.02] disabled:opacity-60"
              >
                {calling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PhoneOutgoing className="w-4 h-4 mr-2" />}
                {calling ? 'Calling...' : 'Start Call'}
              </Button>

              {callStatus && (
                <div className={`p-3 rounded-xl text-xs font-light ${
                  callStatus.startsWith('✅')
                    ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/50'
                    : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/50'
                }`}>
                  {callStatus}
                </div>
              )}

              <p className="text-xs text-slate-400 font-light">
                Requires Twilio credentials in Settings. Free trial includes limited call minutes.
              </p>
            </div>
          </div>

          {/* Free badge */}
          <div className="bg-gradient-to-br from-violet-600/5 to-pink-600/5 rounded-3xl border border-purple-200/30 dark:border-purple-800/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-light text-purple-700 dark:text-purple-300">Edge TTS — 100% Free</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
              All 30+ voices use Microsoft&apos;s Neural TTS. No API key, no cost, no limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
