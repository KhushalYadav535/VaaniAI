'use client'

import { useState, useEffect, useRef } from 'react'
import { agentsApi, createVoiceSession } from '@/lib/api'
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SessionStatus = 'idle' | 'connecting' | 'ready' | 'listening' | 'processing' | 'speaking' | 'ended'

const MIC_CHUNK_MS = Number(process.env.NEXT_PUBLIC_MIC_CHUNK_MS || 1000)

export default function WidgetView() {
  const [agentId, setAgentId] = useState<string>('')
  const [agentName, setAgentName] = useState<string>('AI Support')
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [isMicOn, setIsMicOn] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioChunksBufferRef = useRef<ArrayBuffer[]>([])
  const playbackQueueRef = useRef<AudioBuffer[]>([])
  const isPlayingRef = useRef(false)
  const isAgentSpeakingRef = useRef(false)
  const lastAudioChunkSentAtRef = useRef<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('agentId')
    if (id) {
      setAgentId(id)
      agentsApi.getById(id).then(res => {
        if (res.agent) setAgentName(res.agent.name)
      }).catch(console.error)
    }
    
    return () => cleanup()
  }, [])

  const cleanup = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop() }
    if (audioContextRef.current) audioContextRef.current.close()
  }

  const startCall = async () => {
    if (!agentId) return
    setStatus('connecting')

    const ws = createVoiceSession(agentId, { preferBinaryAudio: true })
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
      setStatus('ended')
    }

    ws.onclose = () => {
      setStatus('ended')
      setIsRecording(false)
    }
  }

  const handleWsMessage = (msg: any) => {
    switch (msg.type) {
      case 'ready':
        setStatus('ready')
        startMicRecording()
        break

      case 'transcript':
        if (msg.isFinal) {
          setStatus('processing')
        }
        break

      case 'response_text':
      case 'response_text_chunk':
        setStatus('speaking')
        isAgentSpeakingRef.current = true
        break

      case 'audio':
        if (msg.data) {
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
        isAgentSpeakingRef.current = false
        setTimeout(() => setStatus('listening'), 500)
        break

      case 'session_ended':
        setStatus('ended')
        break

      case 'interrupt':
        audioChunksBufferRef.current = [] 
        playbackQueueRef.current = []
        isPlayingRef.current = false
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {})
          audioContextRef.current = null
        }
        setStatus('listening')
        break

      case 'latency_metrics':
        if (msg.metrics) {
          console.debug('[widget-latency]', msg.stage, msg.metrics)
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
      source.onended = () => playNextAudio()
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
          const now = Date.now()
          const chunkIntervalMs = lastAudioChunkSentAtRef.current ? now - lastAudioChunkSentAtRef.current : null
          lastAudioChunkSentAtRef.current = now
          e.data.arrayBuffer()
            .then((buffer) => {
              wsRef.current?.send(buffer)
              if (chunkIntervalMs) {
                console.debug('[widget-latency] mic_chunk_interval_ms', chunkIntervalMs)
              }
            })
            .catch((err) => {
              console.error('Binary mic chunk send error:', err)
            })
        }
      }

      // MediaRecorder webm chunks are significantly more reliable at ~1s.
      mediaRecorder.start(MIC_CHUNK_MS)
      setIsRecording(true)
      setStatus('listening')
      setIsMicOn(true)
    } catch (err) {
      console.error(err)
      setStatus('ended')
    }
  }

  const endCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_session' }))
    }
    cleanup()
    setStatus('ended')
    setIsMicOn(false)
    setIsRecording(false)
  }

  const isCallActive = status !== 'idle' && status !== 'ended'

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-800">{agentName}</h2>
          <p className="text-sm text-slate-500 capitalize">{status === 'idle' ? 'Ready to call' : status}</p>
        </div>

        <div className="relative">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            status === 'speaking' || status === 'listening' ? 'bg-purple-100 scale-110 shadow-xl shadow-purple-500/20' : 
            status === 'connecting' ? 'bg-amber-100 animate-pulse' :
            'bg-slate-200'
          }`}>
            <Mic className={`w-12 h-12 transition-colors ${
              status === 'speaking' || status === 'listening' ? 'text-purple-600' : 'text-slate-400'
            }`} />
          </div>
          
          {(status === 'speaking' || status === 'listening') && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-20"></div>
              <div className="absolute inset-[-20px] rounded-full border border-purple-300 animate-ping opacity-10" style={{ animationDelay: '300ms' }}></div>
            </>
          )}
        </div>
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        {!isCallActive ? (
          <Button 
            className="w-full h-14 text-lg rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25"
            onClick={startCall}
            disabled={status === 'connecting' || !agentId}
          >
            {status === 'connecting' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Phone className="w-6 h-6 mr-2" />}
            {status === 'connecting' ? 'Connecting...' : 'Start Call'}
          </Button>
        ) : (
          <Button 
            className="w-full h-14 text-lg rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25"
            onClick={endCall}
          >
            <PhoneOff className="w-6 h-6 mr-2" />
            End Call
          </Button>
        )}
      </div>
    </div>
  )
}
