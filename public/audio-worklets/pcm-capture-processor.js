class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.chunkMs = 100;
    this.vadThreshold = 0.012;
    this.interruptionThreshold = 0.04;
    this.silenceMs = 700;
    this.enabled = true;
    this.agentSpeaking = false;
    this.resamplePos = 0;
    this.seq = 0;
    this.chunk = [];
    this.sumSquares = 0;
    this.speechActive = false;
    this.silentSamples = 0;
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
      if (typeof msg.enabled === 'boolean') this.enabled = msg.enabled;
      if (typeof msg.agentSpeaking === 'boolean') this.agentSpeaking = msg.agentSpeaking;

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

    if (hasSpeech) {
      this.silentSamples = 0;
      if (!this.speechActive) {
        this.speechActive = true;
        this.port.postMessage({ type: 'speech_start', rms, seq: this.seq });
      }
    } else if (this.speechActive) {
      this.silentSamples += this.chunk.length;
      if (this.silentSamples >= this.silenceSamples) {
        this.speechActive = false;
        this.silentSamples = 0;
        this.port.postMessage({ type: 'speech_end', rms, seq: this.seq });
      }
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
