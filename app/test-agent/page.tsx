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
  Heart, TrendingUp, TrendingDown, Minus, PlayCircle
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
  connecting: 'bg-yellow-400 animate-pulse',
  ready: 'bg-green-400 animate-pulse',
  listening: 'bg-green-500 animate-pulse',
  processing: 'bg-blue-400 animate-pulse',
  speaking: 'bg-purple-500 animate-pulse',
  ended: 'bg-red-400',
}

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

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
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
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop() }
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    if (audioContextRef.current) audioContextRef.current.close()
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause()
      ambientAudioRef.current = null
    }
  }

  const startCall = async () => {
    if (!selectedAgentId) return
    setStatus('connecting')
    setMessages([])
    setCallDuration(0)

    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }

    const ws = createVoiceSession(selectedAgentId)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        handleWsMessage(msg)
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
          // Using free public audio files as placeholders for ambient noise
          const noiseUrl = msg.ambientNoise === 'office' 
            ? 'https://actions.google.com/sounds/v1/crowds/restaurant_chatter.ogg' 
            : 'https://actions.google.com/sounds/v1/crowds/battle_crowd_celebration.ogg';
          
          ambientAudioRef.current = new Audio(noiseUrl);
          ambientAudioRef.current.loop = true;
          ambientAudioRef.current.volume = 0.15; // Low volume background noise
          ambientAudioRef.current.play().catch(e => console.error("Ambient audio error", e));
        }

        startMicRecording() // Automatically start listening!
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
          setStatusText(`🗣️ You: ${msg.text}...`); // Show live VAD preview
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
              // Append to existing assistant message
              lastMsg.content += ' ' + msg.text;
              return [...newMessages];
            } else {
              // Start new assistant message
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
          // Join multiple ArrayBuffers if they were sent in chunks
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
        
        // Wait a bit, then if simulating, send next line
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
        audioChunksBufferRef.current = [] 
        playbackQueueRef.current = []
        isPlayingRef.current = false
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        setStatusText('Agent interrupted');
        setStatus('listening')
        break

      case 'sentiment':
        if (msg.sentiment) {
          setLiveSentiment({ sentiment: msg.sentiment, score: msg.score, text: msg.text || '' })
          setSentimentHistory(prev => [
            ...prev.slice(-19), // Keep last 20
            { sentiment: msg.sentiment, score: msg.score, text: msg.text || '', time: new Date() }
          ])
        }
        break
    }
  }

  const decodeAndQueueAudio = async (arrayBuffer: ArrayBuffer) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            wsRef.current?.send(JSON.stringify({ type: 'audio', data: base64 }))
          }
          reader.readAsDataURL(e.data)
        }
      }

      mediaRecorder.start(1000) // Chunk every 1 second to avoid WebM header fragmentation
      setIsRecording(true)
      setStatus('listening')
      setIsMicOn(true)
    } catch (err) {
      console.error(err);
      setStatusText('⚠️ Microphone access denied. Please allow microphone access.')
    }
  }

  const stopMicRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop())
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
    
    // Parse script into lines
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
      // Retry in a bit
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-pink-600/5 rounded-3xl blur-xl" />
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Test Agent</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Live voice conversation with your AI</p>
                </div>
              </div>
              {isCallActive && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-light text-green-700 dark:text-green-400">LIVE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-mono font-light">{formatDuration(callDuration)}</span>
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
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5">
              <h2 className="text-sm font-light text-slate-700 dark:text-slate-300 mb-3">Select Agent</h2>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
                disabled={isCallActive}
              >
                <SelectTrigger className="w-full h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-2xl font-light">
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl">
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
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5">
              <h2 className="text-sm font-light text-slate-700 dark:text-slate-300 mb-3">Status</h2>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="text-sm font-light text-slate-700 dark:text-slate-300 capitalize">{status}</span>
              </div>
              <p className="text-xs font-light text-slate-500 dark:text-slate-400">{statusText}</p>
            </div>

            {/* Controls */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 space-y-3">
              <h2 className="text-sm font-light text-slate-700 dark:text-slate-300">Controls</h2>
              
              {!isCallActive ? (
                <Button
                  onClick={startCall}
                  disabled={!selectedAgentId || status === 'connecting'}
                  className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-light rounded-2xl shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-[1.02]"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Start Call
                </Button>
              ) : (
                <Button
                  onClick={endCall}
                  className="w-full h-11 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-light rounded-2xl shadow-lg shadow-red-500/25 transition-all duration-300"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              )}

              {/* Script Simulator Dialog */}
              <Dialog open={isScriptModalOpen} onOpenChange={setIsScriptModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-11 border-slate-200/50 dark:border-slate-700/50 font-light rounded-2xl gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <PlayCircle className="w-4 h-4 text-purple-500" />
                    Simulate Script
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Simulate Conversation</DialogTitle>
                    <DialogDescription>
                      Paste a script or a list of user responses. The simulator will automatically send each line as a text message, waiting for the agent to reply before sending the next one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea 
                      placeholder="e.g.&#10;Hello, I need help with my account.&#10;Yes, my email is john@example.com&#10;Thank you!"
                      className="min-h-[200px] resize-none font-light"
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsScriptModalOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={startSimulation}
                      disabled={!scriptText.trim() || !selectedAgentId}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Start Simulation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {isSimulating && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl flex items-center justify-between animate-pulse">
                  <span className="text-xs text-purple-700 dark:text-purple-300">Script Simulation Running... ({simulationQueueRef.current.length} left)</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-purple-700 hover:bg-purple-200 dark:hover:bg-purple-900" onClick={() => setIsSimulating(false)}>Stop</Button>
                </div>
              )}

              {isCallActive && (
                <>
                  {/* Continuous Voice Indicator */}
                  <div className={`w-full h-16 rounded-2xl font-light text-white transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                      isRecording
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-purple-500/40 relative overflow-hidden'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    {isRecording && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />}
                    {isRecording ? <Mic className="w-5 h-5 animate-bounce" /> : <MicOff className="w-5 h-5" />}
                    <span className="text-xs relative z-10">{isRecording ? 'Listening...' : 'Mic Disabled'}</span>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-full h-10 rounded-2xl font-light text-sm flex items-center justify-center gap-2 transition-all ${
                      isMuted
                        ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50'
                        : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isMuted ? 'Unmute agent' : 'Mute agent audio'}
                  </button>
                </>
              )}
            </div>

            {/* Transfer Banner */}
            {transferInfo && (
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl border border-amber-500/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Transfer Initiated</h3>
                    <p className="text-xs font-light text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                      Connecting to human agent: {transferInfo.transferTo}
                    </p>
                    <p className="text-[10px] font-mono text-amber-600/60 mt-1">Reason: {transferInfo.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="bg-gradient-to-br from-violet-600/5 to-pink-600/5 rounded-3xl border border-purple-200/50 dark:border-purple-800/50 p-5">
              <div className="space-y-2 text-xs font-light text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Continuous duplex mode: just speak naturally!
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Or type below for text mode
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Needs Deepgram key for mic
                </div>
              </div>
            </div>

            {/* Live Sentiment Indicator */}
            {isCallActive && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                <h2 className="text-sm font-light text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Live Sentiment
                </h2>
                
                {liveSentiment ? (
                  <div className="space-y-3">
                    {/* Current Sentiment */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                        liveSentiment.sentiment === 'positive'
                          ? 'bg-green-100 dark:bg-green-950/40'
                          : liveSentiment.sentiment === 'negative'
                          ? 'bg-red-100 dark:bg-red-950/40'
                          : 'bg-yellow-100 dark:bg-yellow-950/40'
                      }`}>
                        {liveSentiment.sentiment === 'positive' ? '😊' : liveSentiment.sentiment === 'negative' ? '😠' : '😐'}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium capitalize ${
                          liveSentiment.sentiment === 'positive'
                            ? 'text-green-600 dark:text-green-400'
                            : liveSentiment.sentiment === 'negative'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {liveSentiment.sentiment}
                        </p>
                        <p className="text-xs text-slate-500 font-light">Score: {liveSentiment.score?.toFixed(2)}</p>
                      </div>
                      {liveSentiment.sentiment === 'positive' && <TrendingUp className="w-5 h-5 text-green-500" />}
                      {liveSentiment.sentiment === 'negative' && <TrendingDown className="w-5 h-5 text-red-500" />}
                      {liveSentiment.sentiment === 'neutral' && <Minus className="w-5 h-5 text-yellow-500" />}
                    </div>

                    {/* Score Bar */}
                    <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-1/2 h-full rounded-full transition-all duration-500 ${
                          liveSentiment.score >= 0 ? 'bg-green-500' : 'bg-red-500'
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
                      <div className="flex items-center gap-1 flex-wrap">
                        {sentimentHistory.slice(-15).map((s, i) => (
                          <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                              s.sentiment === 'positive'
                                ? 'bg-green-500'
                                : s.sentiment === 'negative'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                            title={`${s.sentiment}: ${s.text?.substring(0, 50)}...`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-light">Waiting for conversation...</p>
                )}
              </div>
            )}
          </div>

          {/* Conversation */}
          <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col" style={{ height: '600px' }}>
            {/* Header */}
            <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-sm font-light text-slate-700 dark:text-slate-300">Conversation</h2>
              <div className="ml-auto flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-light">{messages.length} messages</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/10 to-purple-600/10 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-light text-sm">
                    {isCallActive ? 'Start speaking or type a message...' : 'Start a call to begin conversation'}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-br from-violet-600 to-purple-600'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/30 dark:border-blue-800/30'
                        : 'bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-purple-200/30 dark:border-purple-800/30'
                    }`}>
                      <p className="text-sm font-light text-slate-800 dark:text-slate-200 leading-relaxed">{msg.content}</p>
                      <p className="text-xs text-slate-400 font-light mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Text input */}
            <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex gap-2">
                <Input
                  placeholder={isCallActive ? "Type a message to the agent..." : "Start a call first..."}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
                  disabled={!isCallActive || status === 'processing'}
                  className="flex-1 h-10 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-2xl font-light text-sm"
                />
                <Button
                  onClick={sendTextMessage}
                  disabled={!isCallActive || !textInput.trim() || status === 'processing'}
                  className="h-10 w-10 p-0 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
