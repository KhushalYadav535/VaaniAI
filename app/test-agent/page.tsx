'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Volume2, VolumeX, Activity, MessageSquare, Clock,
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

const STATUS_DOT: Record<SessionStatus, string> = {
  idle: 'bg-zinc-300 dark:bg-zinc-700',
  connecting: 'bg-amber-500 animate-pulse',
  ready: 'bg-emerald-500 animate-pulse',
  listening: 'bg-emerald-500 animate-pulse',
  processing: 'bg-blue-500 animate-pulse',
  speaking: 'bg-violet-500 animate-pulse',
  ended: 'bg-red-500',
}

const MIC_CHUNK_MS = Number(process.env.NEXT_PUBLIC_MIC_CHUNK_MS || 100)

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
  // Grace period to prevent mic acoustic echo from interrupting the greeting.
  // Set to Date.now() + N ms when a first-message starts; barge-in is blocked until expired.
  const greetingGracePeriodEndRef = useRef<number>(0)

  const wsRef = useRef<ReconnectingVoiceSession | null>(null)
  const micStreamerRef = useRef<RealtimeMicStreamer | null>(null)
  const audioPlayerRef = useRef<WorkletJitterAudioPlayer | null>(null)
  const micContextRef = useRef<AudioContext | null>(null)  // Separate context for mic capture
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioChunksBufferRef = useRef<ArrayBuffer[]>([]) // Accumulate decoded ArrayBuffers
  const playbackQueueRef = useRef<AudioBuffer[]>([]) // For decoded sentences ready to play
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const isPlayingRef = useRef(false)
  const lastInterruptAtRef = useRef(0)
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

  useEffect(() => {
    audioPlayerRef.current?.setMuted(isMuted)
    if (isMuted) interruptAgentPlayback()
  }, [isMuted])

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
    micStreamerRef.current?.stop()
    micStreamerRef.current = null
    audioPlayerRef.current?.close().catch(() => {})
    audioPlayerRef.current = null
    // Stop mic capture
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
    }
    if (micContextRef.current && micContextRef.current.state !== 'closed') {
      micContextRef.current.close().catch(() => { })
      micContextRef.current = null
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
    setStatusText('Opening voice channel...')
    setMessages([])
    setCallDuration(0)

    audioPlayerRef.current = new WorkletJitterAudioPlayer({
      onPlaybackStart: () => {
        isPlayingRef.current = true
        isAgentSpeakingRef.current = true
        micStreamerRef.current?.setAgentSpeaking(true)
        setStatus('speaking')
      },
      onPlaybackEnd: () => {
        isPlayingRef.current = false
        isAgentSpeakingRef.current = false
        micStreamerRef.current?.setAgentSpeaking(false)
        setStatus('listening')
        if (isSimulating) processNextScriptLine()
      },
    })
    await audioPlayerRef.current.start()

    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }

    // Reconnecting WS — survives transient network drops without ending the call.
    const ws = new ReconnectingVoiceSession({
      wsUrl: WS_URL,
      agentId: selectedAgentId,
      token,
      initOptions: {
        preferBinaryAudio: false,
        streamProtocol: true,
        inputAudio: { mode: 'raw', encoding: 'linear16', sampleRate: 16000, channels: 1 },
      },
      onMessage: (event) => {
        try {
          if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data)
            handleWsMessage(msg)
          } else if (event.data instanceof ArrayBuffer) {
            decodeAndQueueAudio(event.data)
          } else if (event.data instanceof Blob) {
            event.data.arrayBuffer().then((buf) => {
              decodeAndQueueAudio(buf)
            }).catch((e) => console.error('Binary audio parse error', e))
          }
        } catch (e) {
          console.error('WS parse error', e)
        }
      },
      onError: () => {
        setStatusText('Connection blip — reconnecting...')
      },
      onReconnectAttempt: (attempt, delayMs) => {
        setStatusText(`Network blip — retry ${attempt} in ${Math.round(delayMs / 100) / 10}s...`)
      },
      onReconnect: () => {
        setStatusText('Reconnected ✅')
      },
      onGiveUp: () => {
        setStatusText('Could not reconnect after multiple attempts.')
        setStatus('ended')
      },
      onClose: (event) => {
        // 1013 = server busy. Other clean (1000) closes also stop reconnect.
        if (event.code === 1013) {
          setStatusText('Server busy — too many concurrent calls. Try again in a moment.')
        }
        if (status !== 'ended') setStatus('ended')
        setIsRecording(false)
      },
    })
    wsRef.current = ws
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
          // Replace (full) — last assistant message gets overwritten with the
          // final canonical text. Immutable update so React detects the change.
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: msg.text }]
            }
            return [...prev, { role: 'assistant', content: msg.text, timestamp: new Date() }]
          })
          setStatus('speaking')
          isAgentSpeakingRef.current = true;
          // Every time the agent starts speaking, set a short grace window.
          // This prevents the agent's own TTS audio (especially short filler
          // words like "Hmm...") from being picked up by the mic and triggering
          // a false barge-in interrupt (acoustic echo).
          // First message gets 5s (full greeting), subsequent turns get 1.5s
          // (enough to clear filler words before real user speech is detected).
          const graceDuration = msg.isFirstMessage ? 2500 : 1500;
          greetingGracePeriodEndRef.current = Date.now() + graceDuration;
        }
        break

      case 'response_text_chunk':
        if (msg.text) {
          // Append (chunk) — concatenate to the in-flight assistant message.
          // CRITICAL: must be immutable so message ordering stays correct
          // when chunks arrive faster than React commits.
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant') {
              const sep = last.content && !last.content.endsWith(' ') ? ' ' : ''
              return [...prev.slice(0, -1), { ...last, content: last.content + sep + msg.text }]
            }
            return [...prev, { role: 'assistant', content: msg.text, timestamp: new Date() }]
          });
          setStatus('speaking');
        }
        break

      case 'text_stream':
        if (msg.content) {
          // Append (chunk) — immutable so React detects the change
          // and ordering stays correct under fast streaming.
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant') {
              const sep = last.content && !last.content.endsWith(' ') ? ' ' : ''
              return [...prev.slice(0, -1), { ...last, content: last.content + sep + msg.content }]
            }
            return [...prev, { role: 'assistant', content: msg.content, timestamp: new Date() }]
          })
          setStatus('speaking')
          isAgentSpeakingRef.current = true
        }
        break

      case 'text_stream_end':
        // Canonical full text at end of stream — replace the accumulated
        // chunks with the authoritative version. Without this, any chunk
        // boundary spacing differences cause visible duplication.
        if (msg.content) {
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: msg.content }]
            }
            return prev
          })
        }
        break

      case 'audio':
      case 'audio_stream':
        if (!isMuted && (msg.data || msg.chunk)) {
          audioPlayerRef.current?.enqueuePacket(msg).catch((e) => console.error('Audio queue error:', e))
        }
        break

      case 'audio_end':
      case 'audio_stream_end':
        audioPlayerRef.current?.handleStreamEnd(msg)

        setTimeout(() => {
          if (!isPlayingRef.current) setStatus('listening')
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
        if (status === 'connecting') {
          setStatus('ended')
        } else if (status === 'processing') {
          // Don't leave the UI stuck on "AI is thinking..." after an LLM
          // failure — backend has already played a fallback line. Move
          // back to listening so the user can speak again.
          setStatus('listening')
        }
        break

      case 'interrupt':
      case 'clear_audio':
        interruptAgentPlayback()
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
      await audioPlayerRef.current?.enqueueArrayBuffer(arrayBuffer)
    } catch (e) {
      console.error('Audio decode error:', e)
    }
  }

  const playNextAudio = async () => {
    await audioPlayerRef.current?.start()
  }

  const interruptAgentPlayback = () => {
    audioChunksBufferRef.current = []
    playbackQueueRef.current = []
    isPlayingRef.current = false
    isAgentSpeakingRef.current = false
    micStreamerRef.current?.setAgentSpeaking(false)
    audioPlayerRef.current?.clear()

    try {
      currentAudioSourceRef.current?.stop()
    } catch {}
    currentAudioSourceRef.current = null
  }

  const startMicRecording = async () => {
    try {
      const mic = new RealtimeMicStreamer({
        targetSampleRate: 16000,
        chunkMs: MIC_CHUNK_MS,
        silenceMs: 700,
        vadThreshold: 0.012,
        // 0.08: high enough to survive acoustic echo of the agent's own TTS
        // audio coming back through the mic (filler words, greetings).
        // A real human voice at conversational level is typically 0.1-0.3 RMS.
        interruptionThreshold: 0.08,
        onStarted: (cfg) => {
          wsRef.current?.send(JSON.stringify({
            type: 'mic_config',
            sampleRate: cfg.sampleRate,
            encoding: cfg.encoding,
            channels: cfg.channels,
            mode: cfg.mode,
          }))
        },
        onAudioFrame: (frame) => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) return
          lastAudioChunkSentAtRef.current = Date.now()
          // Binary frame: skip JSON+base64 — saves ~33% bandwidth +
          // base64 encode CPU cost (10 frames/sec on the hot path).
          // Backend handleAudioChunkBinary forwards directly to Deepgram.
          wsRef.current.send(frame.data)
        },
        onSpeechStart: () => {
          // INSTANT LOCAL BARGE-IN: if the agent is currently speaking and
          // the user starts talking, stop our playback IMMEDIATELY on the
          // client instead of waiting for the backend to round-trip an
          // 'interrupt' message (200-600ms of the agent talking over the
          // user — the #1 thing that makes an agent feel robotic).
          // The mic worklet already uses a higher interruptionThreshold
          // (0.04) while the agent speaks, so this is a confident signal,
          // not background noise.
          if (isAgentSpeakingRef.current) {
            const now = Date.now()
            // GREETING GRACE PERIOD: block barge-in for the first few seconds
            // of a call. Without this, the mic picks up the greeting audio
            // through the speakers (acoustic echo) and immediately fires an
            // interrupt, cutting the greeting after just one word.
            if (now < greetingGracePeriodEndRef.current) return;
            // Debounce so a burst of speech_start frames doesn't thrash.
            if (now - lastInterruptAtRef.current > 400) {
              lastInterruptAtRef.current = now
              interruptAgentPlayback()
              setStatus('listening')
              setStatusText('Listening...')
              // Tell the backend to abort its in-flight generation so it
              // stops sending audio and frees the LLM slot.
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'barge_in' }))
              }
            }
          }
          if (wsRef.current?.readyState !== WebSocket.OPEN) return
          wsRef.current.send(JSON.stringify({ type: 'user_speech_start' }))
        },
        onSpeechEnd: () => {
          wsRef.current?.send(JSON.stringify({ type: 'user_speech_end' }))
        },
      })

      micStreamerRef.current = mic
      await mic.start()

      setIsRecording(true)
      setStatus('listening')
      setIsMicOn(true)
    } catch (err) {
      console.error(err);
      setStatusText('⚠️ Microphone access denied. Please allow microphone access.')
    }
  }

  const stopMicRecording = () => {
    micStreamerRef.current?.stop()
    micStreamerRef.current = null
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

  const isCallActive = status !== 'idle' && status !== 'ended' && status !== 'connecting'

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Call sandbox</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Test your agent in real time</p>
            </div>
          </div>
          {isCallActive && (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 tracking-wide">Live</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-mono tabular-nums text-zinc-700 dark:text-zinc-300">{formatDuration(callDuration)}</span>
              </div>
            </div>
          )}
        </header>

        {/* ── Main grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

          {/* ─── Left column: controls ─── */}
          <aside className="space-y-4 lg:space-y-3">

            {/* Agent selector */}
            <Card title="Agent" icon={Bot}>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
                disabled={isCallActive}
              >
                <SelectTrigger className="w-full h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-normal focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10">
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-md">
                  {agents.map(a => (
                    <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                  ))}
                  {agents.length === 0 && (
                    <SelectItem value="_empty" disabled>No active agents</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Card>

            {/* Status */}
            <Card title="Status" icon={Activity}>
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
                <span className="text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">{status}</span>
              </div>
              <p className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono leading-relaxed break-words">{statusText}</p>
            </Card>

            {/* Controls */}
            <Card title="Controls" icon={Sparkles}>
              {!isCallActive ? (
                <Button
                  onClick={startCall}
                  disabled={!selectedAgentId || status === 'connecting'}
                  className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Start call
                </Button>
              ) : (
                <Button
                  onClick={endCall}
                  className="w-full h-10 bg-red-600 hover:bg-red-500 text-white font-medium rounded-md transition-colors"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End call
                </Button>
              )}

              {/* Script Simulator */}
              <Dialog open={isScriptModalOpen} onOpenChange={setIsScriptModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 mt-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-md gap-2 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Run script
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <DialogHeader>
                    <DialogTitle className="text-zinc-900 dark:text-zinc-50">Simulate conversation</DialogTitle>
                    <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                      Paste a script — each line is sent as a user message after the agent finishes speaking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-2">
                    <Textarea
                      placeholder={"Hello, I need help with my account.\nMy email is john@example.com\nThanks!"}
                      className="min-h-[200px] resize-none font-mono text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-zinc-50/5"
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="border-zinc-200 dark:border-zinc-800" onClick={() => setIsScriptModalOpen(false)}>Cancel</Button>
                    <Button
                      onClick={startSimulation}
                      disabled={!scriptText.trim() || !selectedAgentId}
                      className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 font-medium"
                    >
                      Start simulation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {isSimulating && (
                <div className="mt-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md flex items-center justify-between">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Script · {simulationQueueRef.current.length} left</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    onClick={() => setIsSimulating(false)}
                  >
                    Stop
                  </button>
                </div>
              )}

              {isCallActive && (
                <div className="mt-3 space-y-2">
                  {/* Recording indicator */}
                  <div className={`h-12 rounded-md flex items-center justify-center gap-2 transition-colors border ${isRecording
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                  }`}>
                    {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    <span className="text-xs font-medium">{isRecording ? 'Listening' : 'Mic off'}</span>
                  </div>

                  {/* Mute toggle */}
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-full h-9 rounded-md border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${isMuted
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {isMuted ? 'Agent muted' : 'Mute agent'}
                  </button>
                </div>
              )}
            </Card>

            {/* Transfer banner */}
            {transferInfo && (
              <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Transfer initiated</h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">→ {transferInfo.transferTo}</p>
                    <p className="text-[11px] font-mono text-amber-700/70 dark:text-amber-400/60 mt-1 break-words">{transferInfo.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sentiment */}
            {isCallActive && (
              <Card title="Sentiment" icon={Heart}>
                {liveSentiment ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center text-lg ${
                          liveSentiment.sentiment === 'positive'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40'
                            : liveSentiment.sentiment === 'negative'
                            ? 'bg-red-50 dark:bg-red-950/40'
                            : 'bg-zinc-50 dark:bg-zinc-900'
                        }`}
                        aria-hidden="true"
                      >
                        {liveSentiment.sentiment === 'positive' ? '🙂' : liveSentiment.sentiment === 'negative' ? '🙁' : '😐'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold capitalize ${
                            liveSentiment.sentiment === 'positive'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : liveSentiment.sentiment === 'negative'
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {liveSentiment.sentiment}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono tabular-nums mt-0.5">
                          {(liveSentiment.score >= 0 ? '+' : '') + liveSentiment.score?.toFixed(2)}
                        </p>
                      </div>
                      {liveSentiment.sentiment === 'positive' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                      {liveSentiment.sentiment === 'negative' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {liveSentiment.sentiment === 'neutral' && <Minus className="w-4 h-4 text-zinc-400" />}
                    </div>

                    {/* Score bar */}
                    <div className="relative h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden" aria-label={`Sentiment score ${liveSentiment.score?.toFixed(2)}`}>
                      <div
                        className={`absolute top-0 left-1/2 h-full rounded-full transition-all duration-500 ${
                          liveSentiment.score >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.abs(liveSentiment.score) * 50}%`,
                          transform: liveSentiment.score >= 0 ? 'none' : 'translateX(-100%)',
                        }}
                      />
                      <div className="absolute top-0 left-1/2 w-px h-full bg-zinc-300 dark:bg-zinc-700" />
                    </div>

                    {/* Timeline dots */}
                    {sentimentHistory.length > 1 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {sentimentHistory.slice(-12).map((s, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.sentiment === 'positive'
                                ? 'bg-emerald-500'
                                : s.sentiment === 'negative'
                                ? 'bg-red-500'
                                : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                            title={`${s.sentiment}: ${s.text?.substring(0, 50)}...`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 py-1">Waiting for first user message...</p>
                )}
              </Card>
            )}
          </aside>

          {/* ─── Right column: transcript ─── */}
          <section className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col min-h-[60vh] lg:h-[700px] overflow-hidden">

            {/* Transcript header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Transcript</h2>
              <span className="text-xs text-zinc-400 tabular-nums">· {messages.length}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Bot className="w-5 h-5 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {isCallActive ? 'Listening...' : 'Standing by'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                    {isCallActive
                      ? 'Speak into your microphone. Your transcript will appear here.'
                      : 'Pick an agent and start a call to begin a conversation.'}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      : 'bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900'
                    }`}>
                      {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3.5 py-2.5 ${msg.role === 'user'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
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
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <div className="flex gap-2">
                <Input
                  placeholder={isCallActive ? 'Type a message...' : 'Start a call to chat'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                  disabled={!isCallActive || status === 'processing'}
                  className="flex-1 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-md text-sm focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-zinc-50/5"
                />
                <Button
                  onClick={sendTextMessage}
                  disabled={!isCallActive || !textInput.trim() || status === 'processing'}
                  className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 rounded-md"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/** Tiny card primitive — single source of truth for left-column blocks. */
function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</h2>
      </div>
      {children}
    </div>
  )
}
