'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Mic, MicOff, Phone, PhoneOff, Volume2, Settings, 
  Activity, AlertCircle, CheckCircle, Radio, Wifi, WifiOff
} from 'lucide-react'
import { agentsApi } from '@/lib/api'

interface WebRTCSession {
  id: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  peerConnection?: RTCPeerConnection
  dataChannel?: RTCDataChannel
  localStream?: MediaStream
  remoteStream?: MediaStream
}

export default function WebRTCTestPage() {
  const [session, setSession] = useState<WebRTCSession | null>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [connectionStats, setConnectionStats] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    agentsApi.getAll().then(res => setAgents(res.agents || [])).catch(console.error)
    return () => {
      if (session?.peerConnection) {
        session.peerConnection.close()
      }
      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const startWebRTCSession = async () => {
    if (!selectedAgent) {
      addLog('❌ Please select an agent first')
      return
    }

    setIsConnecting(true)
    addLog('🔌 Starting WebRTC connection...')

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      
      addLog('🎤 Microphone access granted')

      // Setup audio context for level monitoring
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      // Monitor audio levels
      const monitorAudio = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
          requestAnimationFrame(monitorAudio)
        }
      }
      monitorAudio()

      // Create WebSocket connection for signaling
      const token = localStorage.getItem('token')
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'}/webrtc`)
      websocketRef.current = ws

      ws.onopen = () => {
        addLog('📡 WebSocket connected')
        
        // Initialize session
        ws.send(JSON.stringify({
          type: 'init_session',
          token,
          agentId: selectedAgent,
        }))
      }

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'session_created':
            setSession({
              id: data.session_id,
              status: 'connecting',
              localStream: stream,
            })
            addLog(`✅ Session created: ${data.session_id}`)
            
            // Create WebRTC offer
            await createWebRTCOffer(ws, data.session_id, stream)
            break

          case 'session_ready':
            addLog('🟢 Session is ready')
            setSession(prev => prev ? { ...prev, status: 'connected' } : null)
            setIsConnecting(false)
            break

          case 'webrtc_answer':
            addLog('📞 Received WebRTC answer')
            await handleWebRTCAnswer(data.sdp)
            break

          case 'ice_candidate_ack':
            addLog('🧊 ICE candidate acknowledged')
            break

          case 'transcript':
            addLog(`📝 Transcript: "${data.text}"`)
            break

          case 'response_text':
            addLog(`🤖 AI: "${data.text}"`)
            break

          case 'audio':
            // Play audio received from server
            playAudioFromBase64(data.data)
            break

          case 'error':
            addLog(`❌ Error: ${data.message}`)
            setIsConnecting(false)
            break

          case 'session_ended':
            addLog(`🔚 Session ended: ${data.reason}`)
            endSession()
            break
        }
      }

      ws.onerror = (error) => {
        addLog('❌ WebSocket error')
        setIsConnecting(false)
      }

      ws.onclose = () => {
        addLog('📡 WebSocket disconnected')
        setIsConnecting(false)
      }

    } catch (error: any) {
      addLog(`❌ Failed to start session: ${error.message}`)
      setIsConnecting(false)
    }
  }

  const createWebRTCOffer = async (ws: WebSocket, sessionId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    })

    // Add local stream
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          type: 'ice_candidate',
          candidate: event.candidate.candidate,
        }))
      }
    }

    // Create offer
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    // Send offer
    ws.send(JSON.stringify({
      type: 'offer',
      sdp: offer.sdp,
    }))

    setSession(prev => prev ? { ...prev, peerConnection: pc } : null)
    addLog('📤 WebRTC offer sent')

    // Monitor connection stats
    setInterval(async () => {
      if (pc && pc.connectionState === 'connected') {
        const stats = await pc.getStats()
        setConnectionStats(stats)
      }
    }, 2000)
  }

  const handleWebRTCAnswer = async (sdp: string) => {
    if (!session?.peerConnection) return

    try {
      await session.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: sdp,
      })
      addLog('✅ WebRTC connection established')
    } catch (error) {
      addLog('❌ Failed to set remote description')
    }
  }

  const playAudioFromBase64 = (base64Audio: string) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`)
      audio.play()
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }

  const endSession = () => {
    if (session?.peerConnection) {
      session.peerConnection.close()
    }
    if (session?.localStream) {
      session.localStream.getTracks().forEach(track => track.stop())
    }
    if (websocketRef.current) {
      websocketRef.current.close()
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    setSession(null)
    setAudioLevel(0)
    setConnectionStats(null)
    addLog('🔚 Session ended')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-slate-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />
      case 'connecting': return <Activity className="w-4 h-4 animate-pulse" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Radio className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          WebRTC Audio Test
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Test low-latency audio streaming with WebRTC
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Select Agent
                </label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent to test" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent._id} value={agent._id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={startWebRTCSession}
                  disabled={!selectedAgent || isConnecting || session?.status === 'connected'}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : session?.status === 'connected' ? (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Connected
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Start Call
                    </>
                  )}
                </Button>

                {session && (
                  <Button
                    onClick={endSession}
                    variant="destructive"
                  >
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audio Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Audio Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Microphone Level</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-100"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round(audioLevel * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge 
                  variant={session?.status === 'connected' ? 'default' : 'secondary'}
                  className="flex items-center gap-2"
                >
                  {getStatusIcon(session?.status || 'disconnected')}
                  {session?.status || 'disconnected'}
                </Badge>

                {session?.status === 'connected' ? (
                  <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-3 h-3" />
                    WebRTC Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 text-slate-500">
                    <WifiOff className="w-3 h-3" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Connection Stats */}
          {connectionStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Connection Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Connection State:</span>
                    <p className="font-medium">{session?.peerConnection?.connectionState}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ice State:</span>
                    <p className="font-medium">{session?.peerConnection?.iceConnectionState}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Logs Panel */}
        <div className="lg:col-span-1">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Activity Log
              </CardTitle>
              <CardDescription>
                Real-time session events
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] overflow-y-auto">
              <div className="space-y-2 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-slate-500">No activity yet...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-slate-700 dark:text-slate-300">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
