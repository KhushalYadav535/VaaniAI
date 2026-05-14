'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { agentsApi, createVoiceSession } from '@/lib/api'
import {
  Mic, MicOff, Phone, PhoneOff, Send, Bot, User,
  Volume2, VolumeX, Zap, Activity, MessageSquare, Clock,
  Heart, TrendingUp, TrendingDown, Minus, PlayCircle,
  Terminal, Sparkles
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

const STATUS_LABELS: Record<SessionStatus, string> = {
  idle: 'Select an agent to start',
  connecting: 'Connecting...',
  ready: 'Connected — Listening',
  listening: 'Listening...',
  processing: 'Processing...',
  speaking: 'Agent speaking...',
  ended: 'Call ended',
}

const STATUS_COLORS: Record<SessionStatus, string> = {
  idle: 'bg-slate-400',
  connecting: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse',
  ready: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse',
  listening: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse',
  processing: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse',
  speaking: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-pulse',
  ended: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
}

const MIC_CHUNK_MS = Number(process.env.NEXT_PUBLIC_MIC_CHUNK_MS || 1000)

export default function TestAgentPage() {
  const router = useRouter()
  // Add UseSearchParams
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
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

  // Script Simulator State
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false)
  const [scriptText, setScriptText] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const simulationQueueRef = useRef<string[]>([])
  const isAgentSpeakingRef = useRef(false)
  const lastAudioChunkSentAtRef = useRef<number | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const micContextRef = useRef<AudioContext | null>(null)  // Separate context for mic capture
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioChunksBufferRef = useRef<ArrayBuffer[]>([]) // Accumulate decoded ArrayBuffers
  const playbackQueueRef = useRef<AudioBuffer[]>([]) // For decoded sentences ready to play
  const isPlayingRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const callStartRef = useRef<Date | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }

    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const agentIdFromUrl = params.get('agentId');
    if (agentIdFromUrl) {
      setSelectedAgentId(agentIdFromUrl);
    }

    loadAgents()
    return () => cleanup()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadAgents = async () => {
    try {
      const data: any = await agentsApi.getAll({ status: 'active' })
      setAgents(data.agents || [])
    } catch {
      setAgents([])
    }
  }

  const cleanup = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    // Stop mic capture
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
    }
    if (micContextRef.current && micContextRef.current.state !== 'closed') {
      micContextRef.current.close().catch(() => { })
      micContextRef.current = null
    }
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop() } catch (e) { }
      mediaRecorderRef.current = null
    }
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => { })
    }
    audioContextRef.current = null
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause()
      ambientAudioRef.current = null
    }
    audioChunksBufferRef.current = []
    playbackQueueRef.current = []
    isPlayingRef.current = false
  }

  const startCall = async () => {
    if (!selectedAgentId) return
    setStatus('connecting')
    setMessages([])
    setCallDuration(0)

    // Pre-create AudioContext on user gesture to unlock browser autoplay policy
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext()
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }

    const ws = createVoiceSession(selectedAgentId, { preferBinaryAudio: true })
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data)
          handleWsMessage(msg)
        } else if (event.data instanceof ArrayBuffer) {
          audioChunksBufferRef.current.push(event.data)
        } else if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buf) => {
            audioChunksBufferRef.current.push(buf)
          }).catch((e) => console.error('Binary audio parse error', e))
        }
      } catch (e) {
        console.error('WS parse error', e)
      }
    }

    ws.onerror = () => {
      setStatusText('Connection error. Is the backend running at localhost:5000?')
      setStatus('ended')
    }

    ws.onclose = () => {
      if (status !== 'ended') setStatus('ended')
      setIsRecording(false)
    }
  }

  const handleWsMessage = (msg: any) => {
    switch (msg.type) {
      case 'connected':
        setStatusText('Initializing agent...')
        break

      case 'status':
        setStatusText(msg.message)
        break

      case 'ready':
        setStatus('ready')
        setStatusText('🎙️ Ready — speak freely, mic is actively listening')
        callStartRef.current = new Date()
        callTimerRef.current = setInterval(() => {
          if (callStartRef.current) {
            setCallDuration(Math.floor((Date.now() - callStartRef.current.getTime()) / 1000))
          }
        }, 1000)

        // Process script queue if any
        if (isSimulating && simulationQueueRef.current.length > 0) {
          setTimeout(processNextScriptLine, 1000);
        }

        // Start ambient noise if configured
        if (msg.ambientNoise && msg.ambientNoise !== 'none') {
          const noiseUrl = msg.ambientNoise === 'office'
            ? 'https://actions.google.com/sounds/v1/crowds/restaurant_chatter.ogg'
            : 'https://actions.google.com/sounds/v1/crowds/battle_crowd_celebration.ogg';

          ambientAudioRef.current = new Audio(noiseUrl);
          ambientAudioRef.current.loop = true;
          ambientAudioRef.current.volume = 0.15;
          ambientAudioRef.current.play().catch(e => console.error("Ambient audio error", e));
        }

        startMicRecording()
        break

      case 'transcript':
        if (msg.isFinal && msg.text) {
          setMessages(prev => [...prev, {
            role: 'user',
            content: msg.text,
            timestamp: new Date(),
          }])
          setStatus('processing')
        } else if (!msg.isFinal && msg.text) {
          setStatusText(`🗣️ You: ${msg.text}...`);
        }
        break

      case 'response_text':
        if (msg.text) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];

            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content = msg.text;
              return [...newMessages];
            } else {
              return [...prev, {
                role: 'assistant',
                content: msg.text,
                timestamp: new Date(),
              }];
            }
          })
          setStatus('speaking')
          isAgentSpeakingRef.current = true;
        }
        break

      case 'response_text_chunk':
        if (msg.text) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];

            if (lastMsg && lastMsg.role === 'assistant') {
              lastMsg.content += ' ' + msg.text;
              return [...newMessages];
            } else {
              return [...prev, {
                role: 'assistant',
                content: msg.text,
                timestamp: new Date(),
              }];
            }
          });
          setStatus('speaking');
        }
        break

      case 'audio':
        if (!isMuted && msg.data) {
          try {
            const binary = atob(msg.data)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            audioChunksBufferRef.current.push(bytes.buffer)
          } catch (e) {
            console.error('Base64 decode error:', e)
          }
        }
        break

      case 'audio_end':
        if (audioChunksBufferRef.current.length > 0) {
          const totalLength = audioChunksBufferRef.current.reduce((acc, curr) => acc + curr.byteLength, 0)
          const combined = new Uint8Array(totalLength)
          let offset = 0
          for (const buffer of audioChunksBufferRef.current) {
            combined.set(new Uint8Array(buffer), offset)
            offset += buffer.byteLength
          }

          decodeAndQueueAudio(combined.buffer)
          audioChunksBufferRef.current = []
        }

        isAgentSpeakingRef.current = false;

        setTimeout(() => {
          setStatus('listening')
          if (isSimulating) {
            processNextScriptLine();
          }
        }, 500)
        break

      case 'transfer_initiated':
        setTransferInfo({
          transferTo: msg.transferTo,
          reason: msg.reason
        })
        setStatusText(`Call transferring to ${msg.transferTo}...`)
        break

      case 'session_ended':
        setStatus('ended')
        setStatusText(`Call ended — ${Math.floor(msg.duration / 60)}m ${msg.duration % 60}s`)
        if (callTimerRef.current) clearInterval(callTimerRef.current)
        break

      case 'error':
        setStatusText(`⚠️ ${msg.message}`)
        break

      case 'interrupt':
      case 'clear_audio':
        audioChunksBufferRef.current = []
        playbackQueueRef.current = []
        isPlayingRef.current = false
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          audioContextRef.current.suspend().then(() => {
            audioContextRef.current?.resume().catch(() => { })
          }).catch(() => { })
        }
        setStatusText('Agent interrupted');
        setStatus('listening')
        break

      case 'sentiment':
        if (msg.sentiment) {
          setLiveSentiment({ sentiment: msg.sentiment, score: msg.score, text: msg.text || '' })
          setSentimentHistory(prev => [
            ...prev.slice(-19),
            { sentiment: msg.sentiment, score: msg.score, text: msg.text || '', time: new Date() }
          ])
        }
        break

      case 'latency_metrics':
        if (msg.metrics) {
          const firstText = msg.metrics.stt_to_first_text_ms
          const firstAudio = msg.metrics.stt_to_first_audio_ms
          if (firstText || firstAudio) {
            setStatusText(`⚡ First text: ${firstText ?? '-'}ms | First audio: ${firstAudio ?? '-'}ms`)
          }
        }
        break
    }
  }

  const decodeAndQueueAudio = async (arrayBuffer: ArrayBuffer) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      const decoded = await audioContextRef.current.decodeAudioData(arrayBuffer)
      playbackQueueRef.current.push(decoded)

      if (!isPlayingRef.current) {
        playNextAudio()
      }
    } catch (e) {
      console.error('Audio decode error:', e)
    }
  }

  const playNextAudio = async () => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }

    isPlayingRef.current = true

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }

      const audioBuffer = playbackQueueRef.current.shift()!
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)

      source.onended = () => {
        playNextAudio()
      }

      source.start()
    } catch (e) {
      console.error('Playback error:', e)
      isPlayingRef.current = false
      playNextAudio()
    }
  }

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      micStreamRef.current = stream

      const micCtx = new AudioContext()
      micContextRef.current = micCtx

      if (micCtx.state === 'suspended') {
        await micCtx.resume()
      }

      const actualSampleRate = micCtx.sampleRate

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'mic_config', sampleRate: actualSampleRate, encoding: 'linear16', channels: 1 }))
      }

      const source = micCtx.createMediaStreamSource(stream)
      const processor = micCtx.createScriptProcessor(4096, 1, 1)

      processor.onaudioprocess = (event) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return
        const inputData = event.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const clamped = Math.max(-1, Math.min(1, inputData[i]))
          int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
        }
        wsRef.current.send(int16.buffer)
      }

      source.connect(processor)
      const silentNode = micCtx.createGain()
      silentNode.gain.value = 0
      processor.connect(silentNode)
      silentNode.connect(micCtx.destination)

      setIsRecording(true)
      setStatus('listening')
      setIsMicOn(true)
    } catch (err) {
      console.error(err);
      setStatusText('⚠️ Microphone access denied. Please allow microphone access.')
    }
  }

  const stopMicRecording = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
    }
    if (micContextRef.current && micContextRef.current.state !== 'closed') {
      micContextRef.current.close().catch(() => { })
      micContextRef.current = null
    }
    setIsRecording(false)
    setIsMicOn(false)
    wsRef.current?.send(JSON.stringify({ type: 'end_audio' }))
  }

  const sendTextMessage = () => {
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'text', text: textInput }))
    setTextInput('')
  }

  const endCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_session' }))
    }
    cleanup()
    setStatus('idle')
    setStatusText('Select an agent to start')
    setIsMicOn(false)
    setIsRecording(false)
  }

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const isCallActive = status !== 'idle' && status !== 'ended'

  const startSimulation = () => {
    if (!scriptText.trim() || !selectedAgentId) return;

    const lines = scriptText.split('\n')
      .map(line => line.replace(/^(User:|Customer:)/i, '').trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) return;

    simulationQueueRef.current = lines;
    setIsSimulating(true);
    setIsScriptModalOpen(false);

    if (!isCallActive) {
      startCall();
    } else {
      processNextScriptLine();
    }
  }

  const processNextScriptLine = () => {
    if (!isSimulating || simulationQueueRef.current.length === 0) {
      setIsSimulating(false);
      return;
    }

    if (isAgentSpeakingRef.current || status === 'processing' || status === 'speaking') {
      setTimeout(processNextScriptLine, 1000);
      return;
    }

    const nextLine = simulationQueueRef.current.shift();
    if (nextLine && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: nextLine }));
    }

    if (simulationQueueRef.current.length === 0) {
      setIsSimulating(false);
      setStatusText('Simulation complete');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 relative overflow-hidden font-sans transition-colors duration-300">

      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10 pt-4">

        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-3xl blur-xl" />
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.05)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <Terminal className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Neural Sandbox</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-light flex items-center gap-1">
                    Live duplex interface <Zap className="w-3 h-3 text-amber-500" />
                  </p>
                </div>
              </div>
              {isCallActive && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-xs font-bold tracking-widest text-emerald-700 dark:text-emerald-400">LIVE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm font-mono font-medium">{formatDuration(callDuration)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Control Panel */}
          <div className="space-y-4">

            {/* Agent selector */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm">
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-500" /> Subject Profile
              </h2>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
                disabled={isCallActive}
              >
                <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-700/50 rounded-xl font-light text-slate-900 dark:text-slate-100 focus:ring-cyan-500/20">
                  <SelectValue placeholder="Select a neural agent..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-xl border-slate-200 dark:border-slate-800">
                  {agents.map(a => (
                    <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                  ))}
                  {agents.length === 0 && (
                    <SelectItem value="_empty" disabled>No active agents</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm">
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" /> Telemetry
              </h2>
              <div className="flex items-center gap-3 mb-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/50">
                <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize tracking-wide">{status}</span>
              </div>
              <p className="text-xs font-mono text-slate-600 dark:text-cyan-400/80 break-words leading-relaxed">{statusText}</p>
            </div>

            {/* Controls */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 space-y-4 shadow-sm">
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" /> Operations
              </h2>

              {!isCallActive ? (
                <Button
                  onClick={startCall}
                  disabled={!selectedAgentId || status === 'connecting'}
                  className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Initiate Link
                </Button>
              ) : (
                <Button
                  onClick={endCall}
                  className="w-full h-12 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300"
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  Terminate Link
                </Button>
              )}

              {/* Script Simulator Dialog */}
              <Dialog open={isScriptModalOpen} onOpenChange={setIsScriptModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-11 border-slate-300 dark:border-slate-700 font-medium rounded-xl gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all text-slate-700 dark:text-slate-300 bg-transparent">
                    <PlayCircle className="w-4 h-4 text-cyan-500" />
                    Automated Script
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <DialogHeader>
                    <DialogTitle className="text-cyan-600 dark:text-cyan-400">Simulate Conversation</DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400">
                      Paste a script or a list of user responses. The simulator will automatically send each line as a text message, waiting for the agent to reply before sending the next one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="e.g.&#10;Hello, I need help with my account.&#10;Yes, my email is john@example.com&#10;Thank you!"
                      className="min-h-[200px] resize-none font-mono text-sm bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="border-slate-200 dark:border-slate-700" onClick={() => setIsScriptModalOpen(false)}>Cancel</Button>
                    <Button
                      onClick={startSimulation}
                      disabled={!scriptText.trim() || !selectedAgentId}
                      className="bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 font-bold"
                    >
                      Start Simulation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {isSimulating && (
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 rounded-xl flex items-center justify-between animate-pulse">
                  <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Auto-Script Active ({simulationQueueRef.current.length} left)</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-cyan-700 hover:bg-cyan-200 dark:hover:bg-cyan-900" onClick={() => setIsSimulating(false)}>Stop</Button>
                </div>
              )}

              {isCallActive && (
                <>
                  {/* Continuous Voice Indicator */}
                  <div className={`w-full h-16 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 ${isRecording
                      ? 'bg-cyan-500 text-white dark:text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] relative overflow-hidden'
                      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isRecording && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
                    {isRecording ? <Mic className="w-6 h-6 animate-bounce" /> : <MicOff className="w-5 h-5" />}
                    <span className="text-xs relative z-10 tracking-widest uppercase">{isRecording ? 'Listening' : 'Mic Off'}</span>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-full h-10 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isMuted
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                        : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/50'
                      }`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isMuted ? 'Agent Muted' : 'Mute Agent'}
                  </button>
                </>
              )}
            </div>

            {/* Transfer Banner */}
            {transferInfo && (
              <div className="bg-gradient-to-r from-amber-50 dark:from-amber-500/10 to-orange-50 dark:to-orange-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">Transfer Initiated</h3>
                    <p className="text-xs font-medium text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                      Target: {transferInfo.transferTo}
                    </p>
                    <p className="text-[10px] font-mono text-amber-600/60 mt-1">Reason: {transferInfo.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Live Sentiment Indicator */}
            {isCallActive && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm">
                <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Emotional Analytics
                </h2>

                {liveSentiment ? (
                  <div className="space-y-4">
                    {/* Current Sentiment */}
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${liveSentiment.sentiment === 'positive'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50'
                          : liveSentiment.sentiment === 'negative'
                            ? 'bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50'
                            : 'bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50'
                        }`}>
                        {liveSentiment.sentiment === 'positive' ? '😊' : liveSentiment.sentiment === 'negative' ? '😠' : '😐'}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold uppercase tracking-wider ${liveSentiment.sentiment === 'positive'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : liveSentiment.sentiment === 'negative'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                          {liveSentiment.sentiment}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-1">Confidence: {liveSentiment.score?.toFixed(2)}</p>
                      </div>
                      {liveSentiment.sentiment === 'positive' && <TrendingUp className="w-5 h-5 text-emerald-500" />}
                      {liveSentiment.sentiment === 'negative' && <TrendingDown className="w-5 h-5 text-red-500" />}
                      {liveSentiment.sentiment === 'neutral' && <Minus className="w-5 h-5 text-amber-500" />}
                    </div>

                    {/* Score Bar */}
                    <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-1/2 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor] ${liveSentiment.score >= 0 ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'
                          }`}
                        style={{
                          width: `${Math.abs(liveSentiment.score) * 50}%`,
                          transform: liveSentiment.score >= 0 ? 'none' : 'translateX(-100%)',
                        }}
                      />
                      <div className="absolute top-0 left-1/2 w-0.5 h-full bg-slate-400 dark:bg-slate-600" />
                    </div>

                    {/* Sentiment Timeline Dots */}
                    {sentimentHistory.length > 1 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-2">
                        {sentimentHistory.slice(-12).map((s, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${s.sentiment === 'positive'
                                ? 'bg-emerald-500 shadow-emerald-500/50'
                                : s.sentiment === 'negative'
                                  ? 'bg-red-500 shadow-red-500/50'
                                  : 'bg-amber-500 shadow-amber-500/50'
                              }`}
                            title={`${s.sentiment}: ${s.text?.substring(0, 50)}...`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 font-mono">Awaiting emotional context...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conversation Stream */}
          <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col shadow-sm" style={{ height: '700px' }}>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50 rounded-t-2xl">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="text-sm font-medium text-slate-800 dark:text-slate-200">Neural Transcript</h2>
              <div className="ml-auto flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                <Activity className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-medium">{messages.length} blocks</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                  <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center mb-6 shadow-inner">
                    <Bot className="w-10 h-10 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Connection Standby</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-light text-sm max-w-sm">
                    {isCallActive ? 'Audio channel open. Speak into your microphone to transmit data.' : 'Select a neural agent and initialize link to begin duplex communication.'}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user'
                        ? 'bg-slate-800 dark:bg-slate-200'
                        : 'bg-cyan-500 shadow-cyan-500/30'
                      }`}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white dark:text-slate-900" /> : <Bot className="w-5 h-5 text-white" />}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${msg.role === 'user'
                        ? 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-tr-sm'
                        : 'bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50 rounded-tl-sm'
                      }`}>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{msg.content}</p>
                      <div className={`flex items-center gap-1.5 mt-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Text input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 rounded-b-2xl">
              <div className="flex gap-3">
                <Input
                  placeholder={isCallActive ? "Transmit text data to agent..." : "Initialize link to transmit..."}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                  disabled={!isCallActive || status === 'processing'}
                  className="flex-1 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm focus:border-cyan-500/50 focus:ring-cyan-500/20 shadow-inner"
                />
                <Button
                  onClick={sendTextMessage}
                  disabled={!isCallActive || !textInput.trim() || status === 'processing'}
                  className="h-12 w-16 bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 rounded-xl shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
