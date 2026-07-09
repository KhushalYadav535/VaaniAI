'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { agentsApi, WS_URL, ReconnectingVoiceSession } from '@/lib/api'
import {
  WorkletJitterAudioPlayer,
  RealtimeMicStreamer,
} from '@/lib/realtime-voice-audio'
import {
  Mic, MicOff, Phone, PhoneOff, Send, Bot, User,
  Volume2, VolumeX, MessageSquare, Clock,
  Heart, TrendingUp, TrendingDown, Minus, PlayCircle,
  Sparkles, X, Radio, BarChart2, Layers
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

type SessionStatus = 'idle' | 'connecting' | 'ready' | 'listening' | 'processing' | 'speaking' | 'ended'

const STATUS_CONFIG: Record<SessionStatus, { color: string; darkColor: string; pulse: boolean; label: string }> = {
  idle:       { color: '#9ca3af', darkColor: '#6b7280', pulse: false, label: 'Idle' },
  connecting: { color: '#f59e0b', darkColor: '#f59e0b', pulse: true,  label: 'Connecting' },
  ready:      { color: '#10b981', darkColor: '#10b981', pulse: true,  label: 'Ready' },
  listening:  { color: '#10b981', darkColor: '#10b981', pulse: true,  label: 'Listening' },
  processing: { color: '#3b82f6', darkColor: '#3b82f6', pulse: true,  label: 'Processing' },
  speaking:   { color: '#8b5cf6', darkColor: '#8b5cf6', pulse: true,  label: 'Speaking' },
  ended:      { color: '#ef4444', darkColor: '#ef4444', pulse: false, label: 'Ended' },
}

const MIC_CHUNK_MS = Number(process.env.NEXT_PUBLIC_MIC_CHUNK_MS || 100)

export default function TestAgentPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const [isMicOn, setIsMicOn] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [statusText, setStatusText] = useState('Select an agent to start')
  const [callDuration, setCallDuration] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [liveSentiment, setLiveSentiment] = useState<{ sentiment: string; score: number; text: string } | null>(null)
  const [sentimentHistory, setSentimentHistory] = useState<Array<{ sentiment: string; score: number; text: string; time: Date }>>([])
  const [transferInfo, setTransferInfo] = useState<{ transferTo: string; reason: string } | null>(null)

  // Script Simulator
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false)
  const [scriptText, setScriptText] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const simulationQueueRef = useRef<string[]>([])
  const isAgentSpeakingRef = useRef(false)
  const lastAudioChunkSentAtRef = useRef<number | null>(null)
  const greetingGracePeriodEndRef = useRef<number>(0)

  const wsRef = useRef<ReconnectingVoiceSession | null>(null)
  const micStreamerRef = useRef<RealtimeMicStreamer | null>(null)
  const audioPlayerRef = useRef<WorkletJitterAudioPlayer | null>(null)
  const micContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioChunksBufferRef = useRef<ArrayBuffer[]>([])
  const playbackQueueRef = useRef<AudioBuffer[]>([])
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const isPlayingRef = useRef(false)
  const lastInterruptAtRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const callStartRef = useRef<Date | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }
    const params = new URLSearchParams(window.location.search)
    const agentIdFromUrl = params.get('agentId')
    if (agentIdFromUrl) setSelectedAgentId(agentIdFromUrl)
    loadAgents()
    return () => cleanup()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    audioPlayerRef.current?.setMuted(isMuted)
    if (isMuted) interruptAgentPlayback()
  }, [isMuted])

  useEffect(() => {
    if (selectedAgentId && agents.length > 0) {
      const agent = agents.find(a => a._id === selectedAgentId)
      setSelectedAgent(agent || null)
    }
  }, [selectedAgentId, agents])

  const loadAgents = async () => {
    try {
      const data: any = await agentsApi.getAll({ status: 'active' })
      setAgents(data.agents || [])
    } catch { setAgents([]) }
  }

  const cleanup = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    micStreamerRef.current?.stop(); micStreamerRef.current = null
    audioPlayerRef.current?.close().catch(() => {}); audioPlayerRef.current = null
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null }
    if (micContextRef.current && micContextRef.current.state !== 'closed') { micContextRef.current.close().catch(() => {}); micContextRef.current = null }
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') { audioContextRef.current.close().catch(() => {}) }
    audioContextRef.current = null
    if (ambientAudioRef.current) { ambientAudioRef.current.pause(); ambientAudioRef.current = null }
    audioChunksBufferRef.current = []; playbackQueueRef.current = []; isPlayingRef.current = false
  }

  const startCall = async () => {
    if (!selectedAgentId) return
    setStatus('connecting'); setStatusText('Opening voice channel...'); setMessages([]); setCallDuration(0)
    audioPlayerRef.current = new WorkletJitterAudioPlayer({
      onPlaybackStart: () => { isPlayingRef.current = true; isAgentSpeakingRef.current = true; micStreamerRef.current?.setAgentSpeaking(true); setStatus('speaking') },
      onPlaybackEnd: () => { isPlayingRef.current = false; isAgentSpeakingRef.current = false; micStreamerRef.current?.setAgentSpeaking(false); setStatus('listening'); if (isSimulating) processNextScriptLine() },
    })
    await audioPlayerRef.current.start()
    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }
    const ws = new ReconnectingVoiceSession({
      wsUrl: WS_URL, agentId: selectedAgentId, token,
      initOptions: { preferBinaryAudio: false, streamProtocol: true, inputAudio: { mode: 'raw', encoding: 'linear16', sampleRate: 16000, channels: 1 } },
      onMessage: (event) => {
        try {
          if (typeof event.data === 'string') handleWsMessage(JSON.parse(event.data))
          else if (event.data instanceof ArrayBuffer) decodeAndQueueAudio(event.data)
          else if (event.data instanceof Blob) event.data.arrayBuffer().then(buf => decodeAndQueueAudio(buf)).catch(e => console.error('Binary audio parse error', e))
        } catch (e) { console.error('WS parse error', e) }
      },
      onError: () => setStatusText('Connection blip — reconnecting...'),
      onReconnectAttempt: (attempt, delayMs) => setStatusText(`Network blip — retry ${attempt} in ${Math.round(delayMs / 100) / 10}s...`),
      onReconnect: () => setStatusText('Reconnected ✅'),
      onGiveUp: () => { setStatusText('Could not reconnect after multiple attempts.'); setStatus('ended') },
      onClose: (event) => { if (event.code === 1013) setStatusText('Server busy — too many concurrent calls. Try again in a moment.'); if (status !== 'ended') setStatus('ended'); setIsRecording(false) },
    })
    wsRef.current = ws
  }

  const handleWsMessage = (msg: any) => {
    switch (msg.type) {
      case 'connected': setStatusText('Initializing agent...'); break
      case 'status': setStatusText(msg.message); break
      case 'ready':
        setStatus('ready'); setStatusText('🎙️ Ready — speak freely, mic is actively listening')
        callStartRef.current = new Date()
        callTimerRef.current = setInterval(() => { if (callStartRef.current) setCallDuration(Math.floor((Date.now() - callStartRef.current.getTime()) / 1000)) }, 1000)
        if (isSimulating && simulationQueueRef.current.length > 0) setTimeout(processNextScriptLine, 1000)
        if (msg.ambientNoise && msg.ambientNoise !== 'none') {
          const noiseUrl = msg.ambientNoise === 'office' ? 'https://actions.google.com/sounds/v1/crowds/restaurant_chatter.ogg' : 'https://actions.google.com/sounds/v1/crowds/battle_crowd_celebration.ogg'
          ambientAudioRef.current = new Audio(noiseUrl); ambientAudioRef.current.loop = true; ambientAudioRef.current.volume = 0.15; ambientAudioRef.current.play().catch(e => console.error("Ambient audio error", e))
        }
        startMicRecording(); break
      case 'transcript':
        if (msg.isFinal && msg.text) { setMessages(prev => [...prev, { role: 'user', content: msg.text, timestamp: new Date() }]); setStatus('processing') }
        else if (!msg.isFinal && msg.text) setStatusText(`🗣️ You: ${msg.text}...`)
        break
      case 'response_text':
        if (msg.text) {
          setMessages(prev => { const last = prev[prev.length - 1]; if (last && last.role === 'assistant') return [...prev.slice(0, -1), { ...last, content: msg.text }]; return [...prev, { role: 'assistant', content: msg.text, timestamp: new Date() }] })
          setStatus('speaking'); isAgentSpeakingRef.current = true
          greetingGracePeriodEndRef.current = Date.now() + (msg.isFirstMessage ? 2500 : 1500)
        }
        break
      case 'response_text_chunk':
        if (msg.text) {
          setMessages(prev => { const last = prev[prev.length - 1]; if (last && last.role === 'assistant') { const sep = last.content && !last.content.endsWith(' ') ? ' ' : ''; return [...prev.slice(0, -1), { ...last, content: last.content + sep + msg.text }] }; return [...prev, { role: 'assistant', content: msg.text, timestamp: new Date() }] })
          setStatus('speaking')
        }
        break
      case 'text_stream':
        if (msg.content) {
          setMessages(prev => { const last = prev[prev.length - 1]; if (last && last.role === 'assistant') { const sep = last.content && !last.content.endsWith(' ') ? ' ' : ''; return [...prev.slice(0, -1), { ...last, content: last.content + sep + msg.content }] }; return [...prev, { role: 'assistant', content: msg.content, timestamp: new Date() }] })
          setStatus('speaking'); isAgentSpeakingRef.current = true
        }
        break
      case 'text_stream_end':
        if (msg.content) setMessages(prev => { const last = prev[prev.length - 1]; if (last && last.role === 'assistant') return [...prev.slice(0, -1), { ...last, content: msg.content }]; return prev })
        break
      case 'audio': case 'audio_stream':
        if (!isMuted && (msg.data || msg.chunk)) audioPlayerRef.current?.enqueuePacket(msg).catch(e => console.error('Audio queue error:', e))
        break
      case 'audio_end': case 'audio_stream_end':
        audioPlayerRef.current?.handleStreamEnd(msg)
        setTimeout(() => { if (!isPlayingRef.current) setStatus('listening'); if (isSimulating) processNextScriptLine() }, 500)
        break
      case 'transfer_initiated': setTransferInfo({ transferTo: msg.transferTo, reason: msg.reason }); setStatusText(`Call transferring to ${msg.transferTo}...`); break
      case 'session_ended': setStatus('ended'); setStatusText(`Call ended — ${Math.floor(msg.duration / 60)}m ${msg.duration % 60}s`); if (callTimerRef.current) clearInterval(callTimerRef.current); break
      case 'error': setStatusText(`⚠️ ${msg.message}`); if (status === 'connecting') setStatus('ended'); else if (status === 'processing') setStatus('listening'); break
      case 'interrupt': case 'clear_audio': interruptAgentPlayback(); setStatusText('Agent interrupted'); setStatus('listening'); break
      case 'sentiment':
        if (msg.sentiment) { setLiveSentiment({ sentiment: msg.sentiment, score: msg.score, text: msg.text || '' }); setSentimentHistory(prev => [...prev.slice(-19), { sentiment: msg.sentiment, score: msg.score, text: msg.text || '', time: new Date() }]) }
        break
      case 'latency_metrics': break
    }
  }

  const decodeAndQueueAudio = async (arrayBuffer: ArrayBuffer) => {
    try { await audioPlayerRef.current?.enqueueArrayBuffer(arrayBuffer) } catch (e) { console.error('Audio decode error:', e) }
  }

  const interruptAgentPlayback = () => {
    audioChunksBufferRef.current = []; playbackQueueRef.current = []; isPlayingRef.current = false; isAgentSpeakingRef.current = false
    micStreamerRef.current?.setAgentSpeaking(false); audioPlayerRef.current?.clear()
    try { currentAudioSourceRef.current?.stop() } catch {}
    currentAudioSourceRef.current = null
  }

  const startMicRecording = async () => {
    try {
      const mic = new RealtimeMicStreamer({
        targetSampleRate: 16000, chunkMs: MIC_CHUNK_MS, silenceMs: 700, vadThreshold: 0.012, interruptionThreshold: 0.08,
        onStarted: (cfg) => wsRef.current?.send(JSON.stringify({ type: 'mic_config', sampleRate: cfg.sampleRate, encoding: cfg.encoding, channels: cfg.channels, mode: cfg.mode })),
        onAudioFrame: (frame) => { if (wsRef.current?.readyState !== WebSocket.OPEN) return; lastAudioChunkSentAtRef.current = Date.now(); wsRef.current.send(frame.data) },
        onSpeechStart: () => {
          if (isAgentSpeakingRef.current) { const now = Date.now(); if (now < greetingGracePeriodEndRef.current) return; if (now - lastInterruptAtRef.current > 400) { lastInterruptAtRef.current = now; interruptAgentPlayback(); setStatus('listening'); setStatusText('Listening...'); if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'barge_in' })) } }
          if (wsRef.current?.readyState !== WebSocket.OPEN) return
          wsRef.current.send(JSON.stringify({ type: 'user_speech_start' }))
        },
        onSpeechEnd: () => wsRef.current?.send(JSON.stringify({ type: 'user_speech_end' })),
      })
      micStreamerRef.current = mic; await mic.start(); setIsRecording(true); setStatus('listening'); setIsMicOn(true)
    } catch (err) { console.error(err); setStatusText('⚠️ Microphone access denied. Please allow microphone access.') }
  }

  const sendTextMessage = () => {
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'text', text: textInput })); setTextInput('')
  }

  const endCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'end_session' }))
    cleanup(); setStatus('idle'); setStatusText('Select an agent to start'); setIsMicOn(false); setIsRecording(false)
  }

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const isCallActive = status !== 'idle' && status !== 'ended' && status !== 'connecting'

  const startSimulation = () => {
    if (!scriptText.trim() || !selectedAgentId) return
    const lines = scriptText.split('\n').map(l => l.replace(/^(User:|Customer:)/i, '').trim()).filter(l => l.length > 0)
    if (lines.length === 0) return
    simulationQueueRef.current = lines; setIsSimulating(true); setIsScriptModalOpen(false)
    if (!isCallActive) startCall(); else processNextScriptLine()
  }

  const processNextScriptLine = () => {
    if (!isSimulating || simulationQueueRef.current.length === 0) { setIsSimulating(false); return }
    if (isAgentSpeakingRef.current || status === 'processing' || status === 'speaking') { setTimeout(processNextScriptLine, 1000); return }
    const nextLine = simulationQueueRef.current.shift()
    if (nextLine && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'text', text: nextLine }))
    if (simulationQueueRef.current.length === 0) { setIsSimulating(false); setStatusText('Simulation complete') }
  }

  const statusCfg = STATUS_CONFIG[status]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0b0f] text-slate-900 dark:text-white font-sans antialiased flex flex-col transition-colors duration-300">

      {/* Ambient gradient — only in dark mode */}
      <div className="fixed inset-0 pointer-events-none hidden dark:block">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* ── Top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#0d0e14]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">Test Agent</h1>
            <p className="text-[10px] text-slate-400 dark:text-white/40 leading-none mt-0.5">Live voice sandbox</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isCallActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{formatDuration(callDuration)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all"
              style={{ backgroundColor: statusCfg.color, boxShadow: statusCfg.pulse ? `0 0 6px ${statusCfg.color}` : 'none' }}
            />
            <span className="text-xs font-medium" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
          </div>

          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ── Left Sidebar ── */}
        <aside className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d0e14]/60 backdrop-blur-sm flex flex-col overflow-y-auto">

          {/* Agent Selector */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 block">Agent</label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId} disabled={isCallActive}>
              <SelectTrigger
                id="agent-selector"
                className="w-full h-10 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-sm rounded-xl hover:border-cyan-400 dark:hover:border-cyan-500/50 focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:ring-0 transition-colors"
              >
                <SelectValue placeholder="Select an agent..." />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1a1d2e] border-slate-200 dark:border-white/10 rounded-xl">
                {agents.map(a => (
                  <SelectItem key={a._id} value={a._id} className="text-slate-800 dark:text-white focus:bg-slate-50 dark:focus:bg-white/10">
                    {a.name}
                  </SelectItem>
                ))}
                {agents.length === 0 && (
                  <SelectItem value="_empty" disabled className="text-slate-400 dark:text-white/40">No active agents</SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Agent preview card */}
            {selectedAgent && (
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-cyan-50 to-violet-50 dark:from-cyan-500/10 dark:to-violet-500/10 border border-cyan-100 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {selectedAgent.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{selectedAgent.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-white/40 truncate">{selectedAgent.language || 'en'} · {selectedAgent.voice?.provider || 'TTS'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 block">Status</label>
            <p className="text-xs text-slate-500 dark:text-white/50 font-mono leading-relaxed">{statusText}</p>
          </div>

          {/* Controls */}
          <div className="p-4 space-y-2 border-b border-slate-100 dark:border-white/5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 block">Controls</label>

            {!isCallActive ? (
              <button
                id="start-call-btn"
                onClick={startCall}
                disabled={!selectedAgentId || status === 'connecting'}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" />
                Start Call
              </button>
            ) : (
              <button
                id="end-call-btn"
                onClick={endCall}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold text-sm transition-all active:scale-[0.98]"
              >
                <PhoneOff className="w-4 h-4" />
                End Call
              </button>
            )}

            {/* Script Runner */}
            <Dialog open={isScriptModalOpen} onOpenChange={setIsScriptModalOpen}>
              <DialogTrigger asChild>
                <button
                  id="run-script-btn"
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white font-medium text-xs transition-all"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  Run Script
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-cyan-500" />
                    Simulate Conversation
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 dark:text-white/40">
                    Paste a script — each line is sent as a user message after the agent finishes speaking.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <Textarea
                    placeholder={"Hello, I need help with my account.\nMy email is john@example.com\nThanks!"}
                    className="min-h-[200px] resize-none font-mono text-sm bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:ring-0 rounded-xl"
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl" onClick={() => setIsScriptModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={startSimulation}
                    disabled={!scriptText.trim() || !selectedAgentId}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-semibold rounded-xl"
                  >
                    Start Simulation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {isSimulating && (
              <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-between">
                <span className="text-xs text-violet-600 dark:text-violet-300">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {simulationQueueRef.current.length} messages left
                </span>
                <button
                  type="button"
                  className="text-[10px] font-medium text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-white transition-colors"
                  onClick={() => setIsSimulating(false)}
                >
                  Stop
                </button>
              </div>
            )}
          </div>

          {/* Mic & Audio controls */}
          {isCallActive && (
            <div className="p-4 space-y-2 border-b border-slate-100 dark:border-white/5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 block">Mic & Audio</label>

              <div className={`h-12 rounded-xl flex items-center justify-center gap-2 border transition-all ${
                isRecording
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30'
              }`}>
                {isRecording
                  ? <><Mic className="w-4 h-4" /><span className="text-xs font-medium">Mic Active</span></>
                  : <><MicOff className="w-4 h-4" /><span className="text-xs font-medium">Mic Off</span></>
                }
              </div>

              <button
                id="mute-toggle-btn"
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 border text-xs font-medium transition-all ${
                  isMuted
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                {isMuted
                  ? <><VolumeX className="w-3.5 h-3.5" />Agent Muted</>
                  : <><Volume2 className="w-3.5 h-3.5" />Mute Agent</>
                }
              </button>
            </div>
          )}

          {/* Transfer banner */}
          {transferInfo && (
            <div className="m-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <div className="flex items-start gap-2.5">
                <Phone className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Transfer initiated</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400/70 mt-0.5">→ {transferInfo.transferTo}</p>
                  <p className="text-[10px] font-mono text-amber-500/70 dark:text-amber-400/50 mt-1 break-words">{transferInfo.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sentiment */}
          {isCallActive && (
            <div className="p-4">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-3 block">Sentiment</label>
              {liveSentiment ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                      liveSentiment.sentiment === 'positive' ? 'bg-emerald-50 dark:bg-emerald-500/10'
                        : liveSentiment.sentiment === 'negative' ? 'bg-red-50 dark:bg-red-500/10'
                        : 'bg-slate-100 dark:bg-white/5'
                    }`}>
                      {liveSentiment.sentiment === 'positive' ? '🙂' : liveSentiment.sentiment === 'negative' ? '🙁' : '😐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold capitalize ${
                        liveSentiment.sentiment === 'positive' ? 'text-emerald-600 dark:text-emerald-400'
                          : liveSentiment.sentiment === 'negative' ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-600 dark:text-white/60'
                      }`}>{liveSentiment.sentiment}</p>
                      <p className="text-[10px] text-slate-400 dark:text-white/30 font-mono">
                        {(liveSentiment.score >= 0 ? '+' : '') + liveSentiment.score?.toFixed(2)}
                      </p>
                    </div>
                    {liveSentiment.sentiment === 'positive' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    {liveSentiment.sentiment === 'negative' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {liveSentiment.sentiment === 'neutral' && <Minus className="w-4 h-4 text-slate-400 dark:text-white/30" />}
                  </div>
                  <div className="relative h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-1/2 h-full rounded-full transition-all duration-500 ${liveSentiment.score >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.abs(liveSentiment.score) * 50}%`, transform: liveSentiment.score >= 0 ? 'none' : 'translateX(-100%)' }}
                    />
                    <div className="absolute top-0 left-1/2 w-px h-full bg-slate-300 dark:bg-white/20" />
                  </div>
                  {sentimentHistory.length > 1 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {sentimentHistory.slice(-12).map((s, i) => (
                        <div key={i}
                          className={`w-1.5 h-1.5 rounded-full ${s.sentiment === 'positive' ? 'bg-emerald-500' : s.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-300 dark:bg-white/20'}`}
                          title={`${s.sentiment}: ${s.text?.substring(0, 50)}...`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-white/20 italic">Waiting for first message...</p>
              )}
            </div>
          )}

          <div className="flex-1" />
        </aside>

        {/* ── Center: Transcript ── */}
        <main className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-transparent">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-[#0d0e14]/60 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-cyan-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Live Transcription</h2>
              {messages.length > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-white/30 tabular-nums bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full">
                  {messages.length}
                </span>
              )}
            </div>

            {isCallActive && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isRecording
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30'
              }`}>
                {isRecording ? (
                  <>
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                      <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </>
                ) : (
                  <><MicOff className="w-3 h-3" />Muted</>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-slate-50/50 dark:bg-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-50 to-violet-50 dark:from-cyan-500/10 dark:to-violet-500/10 border border-slate-100 dark:border-white/5 flex items-center justify-center mb-4">
                  <Bot className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-white/60 mb-1">
                  {isCallActive ? 'Listening...' : 'Ready to begin'}
                </h3>
                <p className="text-xs text-slate-400 dark:text-white/25 max-w-xs leading-relaxed">
                  {isCallActive
                    ? 'Speak into your microphone. The conversation will appear here.'
                    : 'Select an agent and start a call to begin your conversation.'}
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60'
                      : 'bg-gradient-to-br from-cyan-500 to-violet-600 text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-cyan-500 text-white rounded-tr-sm shadow-sm shadow-cyan-500/20'
                        : 'bg-white dark:bg-white/5 border border-slate-100 dark:border-white/8 text-slate-700 dark:text-white/80 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-white/20 font-mono px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Text input */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0d0e14]/60">
            <div className="flex gap-2.5">
              <Input
                id="chat-text-input"
                placeholder={isCallActive ? 'Type a message...' : 'Start a call to chat'}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                disabled={!isCallActive || status === 'processing'}
                className="flex-1 h-11 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-xl text-sm focus:border-cyan-400 dark:focus:border-cyan-500/50 focus:ring-0 transition-colors"
              />
              <button
                id="send-message-btn"
                onClick={sendTextMessage}
                disabled={!isCallActive || !textInput.trim() || status === 'processing'}
                className="h-11 px-4 rounded-xl bg-cyan-50 dark:bg-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* ── Right Panel: Data Collection ── */}
        <aside className="w-72 flex-shrink-0 bg-white dark:bg-[#0d0e14]/60 backdrop-blur-sm flex flex-col overflow-y-auto border-l border-slate-200 dark:border-transparent">
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-violet-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Data Collection</h2>
            </div>
          </div>

          <div className="p-4 space-y-5 flex-1">
            {selectedAgent ? (
              <>
                {/* Agent Info */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Agent Name</p>
                  <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{selectedAgent.name}</p>
                </div>

                {/* Session stats */}
                {isCallActive && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Session</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] text-slate-400 dark:text-white/30 mb-1">Duration</p>
                        <p className="text-sm font-mono text-slate-700 dark:text-white">{formatDuration(callDuration)}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] text-slate-400 dark:text-white/30 mb-1">Messages</p>
                        <p className="text-sm font-mono text-slate-700 dark:text-white">{messages.length}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collected data */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Data Collected</p>
                  {messages.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-white/20 italic">Data will be shown after the call.</p>
                  ) : (
                    <div className="space-y-2">
                      {[
                        { label: 'Customer name', value: null },
                        { label: 'Mobile number', value: null },
                        { label: 'Customer email', value: null },
                        { label: 'Customer issue', value: 'Being analyzed...' },
                      ].map((item, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                          <p className="text-[10px] text-slate-400 dark:text-white/30 mb-0.5">{item.label}</p>
                          <p className="text-xs text-slate-500 dark:text-white/50">{item.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qualification */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Qualification Result</p>
                  {messages.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-white/20 italic">Data will be shown after the call.</p>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <p className="text-[10px] text-slate-400 dark:text-white/30 mb-0.5">Status</p>
                      <p className="text-xs text-slate-500 dark:text-white/50">N/A</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center mb-3">
                  <Layers className="w-5 h-5 text-slate-300 dark:text-white/20" />
                </div>
                <p className="text-xs text-slate-400 dark:text-white/20 italic">Data will be shown after the call.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
