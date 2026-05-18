class PcmPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.offset = 0;
    this.wasDrained = true;

    this.port.onmessage = (event) => {
      const msg = event.data || {};
      if (msg.type === 'enqueue' && msg.samples) {
        this.queue.push(new Float32Array(msg.samples));
        this.wasDrained = false;
      }
      if (msg.type === 'clear') {
        this.queue = [];
        this.offset = 0;
        this.wasDrained = true;
      }
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const frames = output[0].length;
    for (let i = 0; i < frames; i++) {
      let sample = 0;

      while (this.queue.length > 0) {
        const current = this.queue[0];
        if (this.offset < current.length) {
          sample = current[this.offset++];
          break;
        }
        this.queue.shift();
        this.offset = 0;
      }

      for (let channel = 0; channel < output.length; channel++) {
        output[channel][i] = sample;
      }
    }

    if (this.queue.length === 0 && !this.wasDrained) {
      this.wasDrained = true;
      this.port.postMessage({ type: 'drained' });
    }

    return true;
  }
}

registerProcessor('pcm-playback-processor', PcmPlaybackProcessor);
