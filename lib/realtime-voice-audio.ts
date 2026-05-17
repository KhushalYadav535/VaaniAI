export type MicFrame = {
  data: ArrayBuffer
  seq: number
  timestamp: number
  sampleRate: number
  channels: number
  rms: number
  speech: boolean
}

export type IncomingAudioPacket = {
  seq?: number
  timestamp?: number
  generationId?: string
  mimeType?: string
  data?: string
  chunk?: string
  lastSeq?: number
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const batchSize = 0x8000
  for (let i = 0; i < bytes.length; i += batchSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + batchSize))
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

type MicOptions = {
  targetSampleRate?: number
  chunkMs?: number
  silenceMs?: number
  vadThreshold?: number
  interruptionThreshold?: number
  onStarted?: (config: { sampleRate: number; channels: number; encoding: 'linear16'; mode: 'raw' }) => void
  onAudioFrame: (frame: MicFrame) => void
  onSpeechStart?: (info: { rms: number; seq: number }) => void
  onSpeechEnd?: (info: { rms: number; seq: number }) => void
}

export class RealtimeMicStreamer {
  private options: Required<Omit<MicOptions, 'onStarted' | 'onSpeechStart' | 'onSpeechEnd'>> & Pick<MicOptions, 'onStarted' | 'onSpeechStart' | 'onSpeechEnd'>
  private stream: MediaStream | null = null
  private context: AudioContext | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private node: AudioWorkletNode | null = null
  private muteGain: GainNode | null = null
  private started = false

  constructor(options: MicOptions) {
    this.options = {
      targetSampleRate: options.targetSampleRate ?? 16000,
      chunkMs: options.chunkMs ?? 100,
      silenceMs: options.silenceMs ?? 700,
      vadThreshold: options.vadThreshold ?? 0.012,
      interruptionThreshold: options.interruptionThreshold ?? 0.04,
      onAudioFrame: options.onAudioFrame,
      onStarted: options.onStarted,
      onSpeechStart: options.onSpeechStart,
      onSpeechEnd: options.onSpeechEnd,
    }
  }

  async start() {
    if (this.started) return

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })

    this.context = new AudioContext({ latencyHint: 'interactive' })
    if (this.context.state === 'suspended') await this.context.resume()
    await this.context.audioWorklet.addModule('/audio-worklets/pcm-capture-processor.js')

    this.source = this.context.createMediaStreamSource(this.stream)
    this.node = new AudioWorkletNode(this.context, 'pcm-capture-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
    })
    this.muteGain = this.context.createGain()
    this.muteGain.gain.value = 0

    this.node.port.onmessage = (event: MessageEvent) => {
      const msg = event.data as { type: string; payload?: ArrayBuffer; seq?: number; sampleRate?: number; channels?: number; rms?: number; speech?: boolean }
      if (msg.type === 'audio' && msg.payload) {
        this.options.onAudioFrame({
          data: msg.payload,
          seq: msg.seq ?? 0,
          timestamp: Date.now(),
          sampleRate: msg.sampleRate ?? this.options.targetSampleRate,
          channels: msg.channels ?? 1,
          rms: msg.rms ?? 0,
          speech: !!msg.speech,
        })
      }
      if (msg.type === 'speech_start') {
        this.options.onSpeechStart?.({ rms: msg.rms ?? 0, seq: msg.seq ?? 0 })
      }
      if (msg.type === 'speech_end') {
        this.options.onSpeechEnd?.({ rms: msg.rms ?? 0, seq: msg.seq ?? 0 })
      }
    }

    this.postConfig()
    this.source.connect(this.node)
    this.node.connect(this.muteGain)
    this.muteGain.connect(this.context.destination)

    this.started = true
    this.options.onStarted?.({
      sampleRate: this.options.targetSampleRate,
      channels: 1,
      encoding: 'linear16',
      mode: 'raw',
    })
  }

  setAgentSpeaking(agentSpeaking: boolean) {
    this.node?.port.postMessage({ type: 'config', agentSpeaking })
  }

  stop() {
    this.started = false
    try { this.source?.disconnect() } catch {}
    try { this.node?.disconnect() } catch {}
    try { this.muteGain?.disconnect() } catch {}
    this.stream?.getTracks().forEach((track) => track.stop())
    this.context?.close().catch(() => {})
    this.stream = null
    this.context = null
    this.source = null
    this.node = null
    this.muteGain = null
  }

  private postConfig() {
    this.node?.port.postMessage({
      type: 'config',
      targetSampleRate: this.options.targetSampleRate,
      chunkMs: this.options.chunkMs,
      silenceMs: this.options.silenceMs,
      vadThreshold: this.options.vadThreshold,
      interruptionThreshold: this.options.interruptionThreshold,
      enabled: true,
    })
  }
}

type PlayerOptions = {
  initialBufferMs?: number
  missingPacketWaitMs?: number
  onPlaybackStart?: () => void
  onPlaybackEnd?: () => void
}

type DecodedPacket = {
  seq: number
  samples: Float32Array
}

export class WorkletJitterAudioPlayer {
  private context: AudioContext | null = null
  private node: AudioWorkletNode | null = null
  private gain: GainNode | null = null
  private expectedSeq = 0
  private fallbackSeq = 0
  private generationId: string | null = null
  private pending = new Map<number, DecodedPacket>()
  private missingTimer: ReturnType<typeof setTimeout> | null = null
  private started = false
  private muted = false
  private options: Required<PlayerOptions>

  constructor(options: PlayerOptions = {}) {
    this.options = {
      initialBufferMs: options.initialBufferMs ?? 120,
      missingPacketWaitMs: options.missingPacketWaitMs ?? 120,
      onPlaybackStart: options.onPlaybackStart ?? (() => {}),
      onPlaybackEnd: options.onPlaybackEnd ?? (() => {}),
    }
  }

  async start() {
    if (this.started) return
    this.context = new AudioContext({ latencyHint: 'interactive' })
    if (this.context.state === 'suspended') await this.context.resume()
    await this.context.audioWorklet.addModule('/audio-worklets/pcm-playback-processor.js')

    this.node = new AudioWorkletNode(this.context, 'pcm-playback-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    })
    this.gain = this.context.createGain()
    this.gain.gain.value = this.muted ? 0 : 1
    this.node.port.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'drained') {
        this.options.onPlaybackEnd()
      }
    }
    this.node.connect(this.gain)
    this.gain.connect(this.context.destination)
    this.started = true
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.gain) this.gain.gain.value = muted ? 0 : 1
  }

  async enqueuePacket(packet: IncomingAudioPacket) {
    const base64 = packet.chunk || packet.data
    if (!base64 || this.muted) return
    await this.start()

    if (packet.generationId && packet.generationId !== this.generationId) {
      this.clear()
      this.generationId = packet.generationId
      this.expectedSeq = packet.seq ?? 0
    }

    const seq = packet.seq ?? this.fallbackSeq++
    const samples = await this.decodeToMono(base64ToArrayBuffer(base64))
    this.pending.set(seq, { seq, samples })
    this.drainOrdered()
  }

  async enqueueArrayBuffer(buffer: ArrayBuffer) {
    if (this.muted) return
    await this.start()
    const seq = this.fallbackSeq++
    const samples = await this.decodeToMono(buffer)
    this.pending.set(seq, { seq, samples })
    this.drainOrdered()
  }

  handleStreamEnd(packet: IncomingAudioPacket) {
    if (typeof packet.lastSeq === 'number' && packet.lastSeq < this.expectedSeq) {
      this.options.onPlaybackEnd()
    }
  }

  clear() {
    if (this.missingTimer) clearTimeout(this.missingTimer)
    this.missingTimer = null
    this.pending.clear()
    this.expectedSeq = 0
    this.fallbackSeq = 0
    this.node?.port.postMessage({ type: 'clear' })
  }

  async close() {
    this.clear()
    try { this.node?.disconnect() } catch {}
    try { this.gain?.disconnect() } catch {}
    await this.context?.close().catch(() => {})
    this.context = null
    this.node = null
    this.gain = null
    this.started = false
  }

  private drainOrdered() {
    let pushedAny = false
    while (this.pending.has(this.expectedSeq)) {
      const packet = this.pending.get(this.expectedSeq)
      if (!packet) break
      this.pending.delete(this.expectedSeq)
      this.node?.port.postMessage({ type: 'enqueue', samples: packet.samples.buffer }, [packet.samples.buffer])
      this.expectedSeq += 1
      pushedAny = true
    }

    if (pushedAny) this.options.onPlaybackStart()

    if (this.pending.size > 0 && !this.pending.has(this.expectedSeq) && !this.missingTimer) {
      this.missingTimer = setTimeout(() => {
        this.missingTimer = null
        const nextAvailable = Math.min(...this.pending.keys())
        if (Number.isFinite(nextAvailable) && nextAvailable > this.expectedSeq) {
          this.expectedSeq = nextAvailable
          this.drainOrdered()
        }
      }, this.options.missingPacketWaitMs)
    }
  }

  private async decodeToMono(buffer: ArrayBuffer): Promise<Float32Array> {
    if (!this.context) throw new Error('Audio player not started')
    const copy = buffer.slice(0)
    const decoded = await this.context.decodeAudioData(copy)
    if (decoded.numberOfChannels === 1) {
      return new Float32Array(decoded.getChannelData(0))
    }

    const length = decoded.length
    const mono = new Float32Array(length)
    for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
      const data = decoded.getChannelData(channel)
      for (let i = 0; i < length; i++) mono[i] += data[i] / decoded.numberOfChannels
    }
    return mono
  }
}
