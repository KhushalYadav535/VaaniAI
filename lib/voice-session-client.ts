/**
 * ReconnectingVoiceSession — a thin wrapper around WebSocket that
 * survives transient network drops without ending the user's call.
 *
 * Why this exists:
 *   The bare WebSocket from createVoiceSession() drops the call the
 *   moment a packet is lost (mobile network handoff, brief Wi-Fi
 *   blip, laptop sleep/wake). Vapi/Retell handle this by silently
 *   re-establishing the WS within a few seconds and replaying init.
 *
 * Strategy:
 *   - Open a fresh WS, send `init`. On open or `ready`, count it
 *     as connected and reset retry state.
 *   - If close is clean (1000) OR caller explicitly called close(),
 *     stay closed.
 *   - If close is abnormal AND we're under maxAttempts, reconnect
 *     after exponential backoff (300ms → 600 → 1.2s → 2.4s, capped 5s).
 *   - On reconnect, re-send init. The backend creates a new logical
 *     session but the UI state (transcript, agent selection, mic
 *     stream) keeps running so the user sees a momentary status
 *     blip rather than "call ended".
 *
 * Public API matches the parts of WebSocket the test-agent page uses:
 *   .send(data), .close(), .onmessage, .onerror, .onreconnect, .onclose
 *   plus .readyState (always returns the underlying WS state).
 */

export type VoiceSessionInitOptions = {
  preferBinaryAudio?: boolean
  inputAudio?: {
    mode?: 'raw' | 'webm'
    encoding?: 'linear16'
    sampleRate?: number
    channels?: number
  }
  enableStt?: boolean
  streamProtocol?: boolean
}

export type ReconnectingVoiceSessionOptions = {
  wsUrl: string
  agentId: string
  token: string
  initOptions?: VoiceSessionInitOptions
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  onMessage?: (event: MessageEvent) => void
  onError?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  /** Fired when an in-flight reconnect succeeds. */
  onReconnect?: () => void
  /** Fired when reconnect is about to happen — host UI can show "reconnecting...". */
  onReconnectAttempt?: (attempt: number, delayMs: number) => void
  /** Fired when all reconnect attempts have been exhausted. */
  onGiveUp?: () => void
}

export class ReconnectingVoiceSession {
  private ws: WebSocket | null = null
  private opts: ReconnectingVoiceSessionOptions
  private attempts = 0
  private closedByUser = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private hasEverConnected = false

  constructor(options: ReconnectingVoiceSessionOptions) {
    this.opts = {
      maxAttempts: 5,
      baseDelayMs: 300,
      maxDelayMs: 5000,
      ...options,
    }
    this.connect()
  }

  private connect() {
    const ws = new WebSocket(`${this.opts.wsUrl}/ws/voice`)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      const initMessage = {
        type: 'init',
        agentId: this.opts.agentId,
        token: this.opts.token,
        enableStt: this.opts.initOptions?.enableStt ?? true,
        preferBinaryAudio: this.opts.initOptions?.preferBinaryAudio ?? false,
        streamProtocol: this.opts.initOptions?.streamProtocol ?? true,
        inputAudio: this.opts.initOptions?.inputAudio ?? {
          mode: 'raw',
          encoding: 'linear16',
          sampleRate: 16000,
          channels: 1,
        },
      }
      ws.send(JSON.stringify(initMessage))

      // Successful connection → reset backoff
      const wasReconnect = this.hasEverConnected
      this.hasEverConnected = true
      this.attempts = 0
      if (wasReconnect) {
        this.opts.onReconnect?.()
      }
    }

    ws.onmessage = (event) => {
      this.opts.onMessage?.(event)
    }

    ws.onerror = (event) => {
      this.opts.onError?.(event)
    }

    ws.onclose = (event) => {
      this.ws = null

      // User asked to close — stay closed, don't reconnect
      if (this.closedByUser) {
        this.opts.onClose?.(event)
        return
      }

      // Clean close (server shutdown, ended) — also stay closed.
      // Code 1013 = "Try Again Later" (server busy) — don't hammer the server.
      // Code 4500 = init error (bad token, agent not found) — retrying won't help.
      if (event.code === 1000 || event.code === 1013 || event.code === 4500) {
        this.opts.onClose?.(event)
        return
      }

      // Abnormal close → schedule reconnect with exponential backoff
      this.scheduleReconnect()
    }

    this.ws = ws
  }

  private scheduleReconnect() {
    if (this.attempts >= (this.opts.maxAttempts ?? 5)) {
      this.opts.onGiveUp?.()
      return
    }

    const exp = Math.min(
      (this.opts.baseDelayMs ?? 300) * Math.pow(2, this.attempts),
      this.opts.maxDelayMs ?? 5000,
    )
    // Add ~25% jitter so retrying clients don't sync up
    const delayMs = Math.round(exp * (0.75 + Math.random() * 0.5))

    this.attempts += 1
    this.opts.onReconnectAttempt?.(this.attempts, delayMs)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delayMs)
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data as any)
      return true
    }
    return false
  }

  close() {
    this.closedByUser = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    try { this.ws?.close(1000, 'user_initiated') } catch {}
    this.ws = null
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  /** Direct access for code that needs to inspect the underlying WS. */
  get raw(): WebSocket | null {
    return this.ws
  }
}
