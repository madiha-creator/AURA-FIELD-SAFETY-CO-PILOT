/**
 * AUD-003: Audio capture processor converts Float32 web audio samples to 24kHz PCM16 base64.
 */

export const pcmWorkerCode = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.targetRate = opts.targetRate || 24000;
    // "sampleRate" is the AudioContext's real rate (phones are often 44.1k/48k).
    this.ratio = sampleRate / this.targetRate;
    this.pos = 0;
    this.carry = 0;
    this.chunkSize = 1200; // 50 ms at 24 kHz
    this.out = new Int16Array(this.chunkSize);
    this.outLen = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch || ch.length === 0) return true;

    // Linear-interpolation resample from the device rate to the target rate.
    const src = new Float32Array(ch.length + 1);
    src[0] = this.carry;
    src.set(ch, 1);
    let pos = this.pos;
    while (pos < src.length - 1) {
      const i = Math.floor(pos);
      const f = pos - i;
      let v = src[i] * (1 - f) + src[i + 1] * f;
      v = Math.max(-1, Math.min(1, v));
      this.out[this.outLen++] = v < 0 ? v * 0x8000 : v * 0x7FFF;
      if (this.outLen === this.chunkSize) {
        this.port.postMessage(this.out.buffer, [this.out.buffer]);
        this.out = new Int16Array(this.chunkSize);
        this.outLen = 0;
      }
      pos += this.ratio;
    }
    this.pos = pos - (src.length - 1);
    this.carry = src[src.length - 1];
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}