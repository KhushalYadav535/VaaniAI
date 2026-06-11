class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.chunkMs = 100;
    this.vadThreshold = 0.012;
    // interruptionThreshold: the RMS level required to declare barge-in WHILE
    // the agent is speaking. Must be high enough to survive acoustic echo
    // (the agent's own filler words / TTS audio coming back through the mic).
    // 0.04 was too low — short filler words like "Hmm..." produced ~0.05 RMS
    // through typical laptop speakers, causing immediate false interrupts.
    // 0.08 requires a clearly louder voice than the speaker output.
    this.interruptionThreshold = 0.08;
    // minSpeechChunks when the agent is speaking: require MORE consecutive
    // voiced chunks so a single echo spike can't win. 3 chunks = 300ms sustained.
    this.minSpeechChunksAgent = 3;
    this.silenceMs = 700;
    this.enabled = true;
    this.agentSpeaking = false;
    this.resamplePos = 0;
    this.seq = 0;
    this.chunk = [];
    this.sumSquares = 0;
    this.speechActive = false;
    this.silentSamples = 0;
    // Consecutive above-threshold chunks required before we declare
    // speech_start. Guards against single-chunk noise spikes (coughs,
    // clicks, door slams) firing a false barge-in — the "Background-Noise
    // Confused" failure mode. 2 chunks @100ms = 200ms of sustained energy.
    this.minSpeechChunks = 2;
    this.voicedChunks = 0;
    this.samplesPerChunk = Math.max(160, Math.round(this.targetSampleRate * this.chunkMs / 1000));
    this.silenceSamples = Math.max(this.samplesPerChunk, Math.round(this.targetSampleRate * this.silenceMs / 1000));

    this.port.onmessage = (event) => {
      const msg = event.data || {};
      if (msg.type !== 'config') return;

      if (msg.targetSampleRate) this.targetSampleRate = Number(msg.targetSampleRate);
      if (msg.chunkMs) this.chunkMs = Number(msg.chunkMs);
      if (msg.vadThreshold) this.vadThreshold = Number(msg.vadThreshold);
      if (msg.interruptionThreshold) this.interruptionThreshold = Number(msg.interruptionThreshold);
      if (msg.silenceMs) this.silenceMs = Number(msg.silenceMs);
      if (msg.minSpeechChunks) this.minSpeechChunks = Number(msg.minSpeechChunks);
      if (typeof msg.enabled === 'boolean') this.enabled = msg.enabled;
      if (typeof msg.agentSpeaking === 'boolean') {
        this.agentSpeaking = msg.agentSpeaking;
        // Reset the voiced-run counter on state change so the higher
        // interruption threshold is applied cleanly from the next chunk.
        this.voicedChunks = 0;
      }

      this.samplesPerChunk = Math.max(160, Math.round(this.targetSampleRate * this.chunkMs / 1000));
      this.silenceSamples = Math.max(this.samplesPerChunk, Math.round(this.targetSampleRate * this.silenceMs / 1000));
    };
  }

  pushSample(sample) {
    const clamped = Math.max(-1, Math.min(1, sample));
    this.chunk.push(clamped);
    this.sumSquares += clamped * clamped;

    if (this.chunk.length < this.samplesPerChunk) return;

    const rms = Math.sqrt(this.sumSquares / this.chunk.length);
    const threshold = this.agentSpeaking ? this.interruptionThreshold : this.vadThreshold;
    const hasSpeech = rms >= threshold;
    // When the agent is speaking, require more consecutive voiced chunks
    // (longer sustained energy) before declaring speech_start, so that
    // brief echoes of the agent's own TTS audio don't trigger a barge-in.
    const requiredChunks = this.agentSpeaking ? this.minSpeechChunksAgent : this.minSpeechChunks;

    if (hasSpeech) {
      this.silentSamples = 0;
      this.voicedChunks += 1;
      // Only declare speech_start after N consecutive voiced chunks so a
      // brief noise transient can't trigger a false barge-in.
      if (!this.speechActive && this.voicedChunks >= requiredChunks) {
        this.speechActive = true;
        this.port.postMessage({ type: 'speech_start', rms, seq: this.seq });
      }
    } else if (this.speechActive) {
      this.voicedChunks = 0;
      this.silentSamples += this.chunk.length;
      if (this.silentSamples >= this.silenceSamples) {
        this.speechActive = false;
        this.silentSamples = 0;
        this.port.postMessage({ type: 'speech_end', rms, seq: this.seq });
      }
    } else {
      // Not in speech and this chunk was quiet — decay the voiced counter so
      // only SUSTAINED energy (not scattered spikes) accumulates.
      this.voicedChunks = 0;
    }

    const pcm = new Int16Array(this.chunk.length);
    for (let i = 0; i < this.chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, this.chunk[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    if (this.enabled) {
      this.port.postMessage({
        type: 'audio',
        seq: this.seq++,
        sampleRate: this.targetSampleRate,
        channels: 1,
        rms,
        speech: hasSpeech,
        payload: pcm.buffer,
      }, [pcm.buffer]);
    }

    this.chunk = [];
    this.sumSquares = 0;
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input || input.length === 0) return true;

    const ratio = sampleRate / this.targetSampleRate;
    while (this.resamplePos < input.length) {
      const idx = Math.floor(this.resamplePos);
      const nextIdx = Math.min(idx + 1, input.length - 1);
      const frac = this.resamplePos - idx;
      const sample = input[idx] + (input[nextIdx] - input[idx]) * frac;
      this.pushSample(sample);
      this.resamplePos += ratio;
    }
    this.resamplePos -= input.length;

    return true;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
