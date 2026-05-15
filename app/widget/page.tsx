'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, PhoneOff, Mic, Loader2 } from 'lucide-react'

type SessionStatus = 'idle' | 'connecting' | 'ready' | 'listening' | 'processing' | 'speaking' | 'ended'

const MIC_CHUNK_MS = 100

export default function WidgetView() {
  const [agentId, setAgentId] = useState<string>('')
  const [agentName, setAgentName] = useState<string>('AI Support')
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [transcript, setTranscript] = useState<string>('')
  const [themeColor, setThemeColor] = useState<string>('#8b5cf6')
  const [isEmbed, setIsEmbed] = useState(false)
  const [backendUrl, setBackendUrl] = useState<string>('')
  const [wsUrl, setWsUrl] = useState<string>('')
  const [widgetToken, setWidgetToken] = useState<string>('')
  
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioChunksBufferRef = useRef<ArrayBuffer[]>([])
  const playbackQueueRef = useRef<AudioBuffer[]>([])
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const isPlayingRef = useRef(false)
  const isAgentSpeakingRef = useRef(false)
  const lastAudioChunkSentAtRef = useRef<number | null>(null)
  const lastInterruptAtRef = useRef(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('agentId')
    const color = params.get('color')
    const mode = params.get('mode')
    const backend = params.get('backend')

    if (color) setThemeColor(decodeURIComponent(color))
    if (mode === 'embed') setIsEmbed(true)

    // Determine backend URL
    const resolvedBackend = backend
      ? decodeURIComponent(backend)
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '')
    
    setBackendUrl(resolvedBackend + '/api')
    setWsUrl(resolvedBackend.replace('http', 'ws'))

    if (id) {
      setAgentId(id)
      // Fetch agent config via public widget API
      fetch(`${resolvedBackend}/api/widget/${id}/config`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.agent) {
            setAgentName(data.agent.name)
          }
        })
        .catch(console.error)
    }

    return () => cleanup()
  }, [])

  const cleanup = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    playbackQueueRef.current = []
    audioChunksBufferRef.current = []
    isPlayingRef.current = false
  }, [])

  const startCall = async () => {
    if (!agentId || !backendUrl) return
    setStatus('connecting')
    setTranscript('')

    try {
      // Get widget session token from backend
      const sessionRes = await fetch(`${backendUrl}/widget/${agentId}/session`, { method: 'POST' })
      const sessionData = await sessionRes.json()

      if (!sessionData.success) {
        console.error('Failed to get widget session:', sessionData.message)
        setStatus('ended')
        return
      }

      const token = sessionData.token
      setWidgetToken(token)

      // Connect WebSocket
      const ws = new WebSocket(`${wsUrl}/ws/voice`)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'init',
          agentId,
          token,
          enableStt: true,
          preferBinaryAudio: true,
          streamProtocol: true,
        }))
      }

      ws.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data)
            handleWsMessage(msg)
          } else if (event.data instanceof ArrayBuffer) {
            decodeAndQueueAudio(event.data)
          }
        } catch (e) {
          console.error('WS parse error', e)
        }
      }

      ws.onerror = () => {
        setStatus('ended')
      }

      ws.onclose = () => {
        setStatus('ended')
      }
    } catch (err) {
      console.error('Start call error:', err)
      setStatus('ended')
    }
  }

  const handleWsMessage = (msg: any) => {
    switch (msg.type) {
      case 'ready':
        setStatus('ready')
        startMicRecording()
        break

      case 'transcript':
        if (msg.text && msg.text.trim()) {
          setTranscript(msg.text)
        }
        if (msg.isFinal) {
          setStatus('processing')
        }
        break

      case 'response_text':
      case 'response_text_chunk':
        setStatus('speaking')
        isAgentSpeakingRef.current = true
        if (msg.text) setTranscript(msg.text)
        break

      case 'text_stream':
        setStatus('speaking')
        isAgentSpeakingRef.current = true
        if (msg.content) setTranscript(prev => `${prev}${prev ? ' ' : ''}${msg.content}`)
        break

      case 'audio':
      case 'audio_stream':
        if (msg.data || msg.chunk) {
          try {
            const binary = atob(msg.data || msg.chunk)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            decodeAndQueueAudio(bytes.buffer)
          } catch (e) {
            console.error('Base64 decode error:', e)
          }
        }
        break

      case 'audio_end':
      case 'audio_stream_end':
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
        setTimeout(() => {
          if (!isPlayingRef.current) setStatus('listening')
        }, 500)
        break

      case 'session_ended':
        setStatus('ended')
        break

      case 'interrupt':
      case 'clear_audio':
        interruptAgentPlayback()
        setStatus('listening')
        break

      case 'error':
        console.error('Widget error:', msg.message)
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
      if (!isPlayingRef.current) playNextAudio()
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
      currentAudioSourceRef.current = source
      source.onended = () => {
        currentAudioSourceRef.current = null
        if (playbackQueueRef.current.length === 0) {
          isAgentSpeakingRef.current = false
          setStatus('listening')
        }
        playNextAudio()
      }
      source.start()
    } catch (e) {
      console.error('Playback error:', e)
      isPlayingRef.current = false
      playNextAudio()
    }
  }

  const interruptAgentPlayback = () => {
    audioChunksBufferRef.current = []
    playbackQueueRef.current = []
    isPlayingRef.current = false
    isAgentSpeakingRef.current = false

    try {
      currentAudioSourceRef.current?.stop()
    } catch {}
    currentAudioSourceRef.current = null
  }

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          lastAudioChunkSentAtRef.current = Date.now()
          const shouldInterrupt = isAgentSpeakingRef.current && Date.now() - lastInterruptAtRef.current > 350
          if (shouldInterrupt) {
            lastInterruptAtRef.current = Date.now()
            interruptAgentPlayback()
            wsRef.current.send(JSON.stringify({ type: 'interrupt' }))
          }
          wsRef.current.send(e.data)
        }
      }

      mediaRecorder.start(MIC_CHUNK_MS)
      setStatus('listening')
    } catch (err) {
      console.error('Mic error:', err)
      setStatus('ended')
    }
  }

  const endCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_session' }))
    }
    cleanup()
    setStatus('ended')
    // Notify parent iframe
    if (isEmbed && window.parent !== window) {
      window.parent.postMessage({ type: 'vaani-call-ended' }, '*')
    }
  }

  const isCallActive = status !== 'idle' && status !== 'ended'

  const statusLabel: Record<SessionStatus, string> = {
    idle: 'Ready to talk',
    connecting: 'Connecting...',
    ready: 'Connected',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
    ended: 'Call ended',
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans" style={{ background: '#fafbfc' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: themeColor }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-white font-semibold text-sm leading-tight">{agentName}</h2>
          <p className="text-white/70 text-xs">{statusLabel[status]}</p>
        </div>
        {isCallActive && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium">Live</span>
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        {/* Mic Visualizer */}
        <div className="relative">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
              status === 'speaking'
                ? 'scale-110'
                : status === 'listening'
                ? 'scale-105'
                : status === 'connecting'
                ? 'animate-pulse'
                : ''
            }`}
            style={{
              background:
                status === 'speaking' || status === 'listening'
                  ? themeColor + '18'
                  : status === 'connecting'
                  ? '#fef3c7'
                  : '#f1f5f9',
            }}
          >
            <Mic
              className="w-10 h-10 transition-colors"
              style={{
                color:
                  status === 'speaking' || status === 'listening'
                    ? themeColor
                    : status === 'connecting'
                    ? '#f59e0b'
                    : '#94a3b8',
              }}
            />
          </div>

          {(status === 'speaking' || status === 'listening') && (
            <>
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ border: `2px solid ${themeColor}` }}
              />
              <div
                className="absolute inset-[-16px] rounded-full animate-ping opacity-10"
                style={{ border: `1px solid ${themeColor}`, animationDelay: '300ms' }}
              />
            </>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2 max-w-full">
          <p className="text-sm font-medium" style={{ color: themeColor }}>
            {statusLabel[status]}
          </p>
          {transcript && isCallActive && (
            <p className="text-xs text-slate-500 px-4 max-h-16 overflow-y-auto leading-relaxed">
              {transcript}
            </p>
          )}
        </div>

        {/* Status idle info */}
        {status === 'idle' && (
          <div className="text-center space-y-1 px-6">
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the button below to start a voice conversation with our AI assistant.
            </p>
          </div>
        )}

        {/* Ended state */}
        {status === 'ended' && (
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-400">Call has ended. Click below to start a new call.</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="p-4 bg-white border-t border-slate-100">
        {!isCallActive ? (
          <button
            className="w-full h-12 text-sm font-semibold rounded-full text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: themeColor,
              boxShadow: `0 4px 20px ${themeColor}40`,
            }}
            onClick={startCall}
            disabled={status === 'connecting' || !agentId}
          >
            {status === 'connecting' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
            {status === 'connecting' ? 'Connecting...' : status === 'ended' ? 'Call Again' : 'Start Voice Call'}
          </button>
        ) : (
          <button
            className="w-full h-12 text-sm font-semibold rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={endCall}
          >
            <PhoneOff className="w-5 h-5" />
            End Call
          </button>
        )}
      </div>

      {/* Powered by */}
      <div className="py-2 text-center">
        <p className="text-[10px] text-slate-300">Powered by VaaniAI</p>
      </div>
    </div>
  )
}
