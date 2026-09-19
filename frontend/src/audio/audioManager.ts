/**
 * AUD-004: Audio Playback Manager for reply.audio (24kHz PCM16 base64)
 * Supports immediate interruption / flush on safety alerts or user barge-in without sleep-scheduling.
 */

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private queue: ArrayBuffer[] = [];

  constructor(private sampleRate: number = 24000) {}

  public async init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: this.sampleRate });
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  /**
   * Enqueue PCM16 base64 chunk from reply.audio
   */
  public enqueueChunk(base64Audio: string) {
    try {
      const binaryStr = atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      this.queue.push(bytes.buffer);
      if (!this.isPlaying) {
        this.playNext();
      }
    } catch (e) {
      console.error('Failed to decode reply.audio PCM16 base64', e);
    }
  }

  private async playNext() {
    if (this.queue.length === 0 || !this.audioCtx) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const rawBuffer = this.queue.shift()!;
    const int16Array = new Int16Array(rawBuffer);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }

    const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);
    this.currentSourceNode = source;

    source.onended = () => {
      this.currentSourceNode = null;
      this.playNext();
    };

    source.start();
  }

  /**
   * Immediate interruption: clear queue & stop playing source immediately
   */
  public stopAndClear() {
    this.queue = [];
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {
        // Source might have already ended
      }
      this.currentSourceNode = null;
    }
    this.isPlaying = false;
  }
}
