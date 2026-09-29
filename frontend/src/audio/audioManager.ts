/**
 * AUD-004: Audio Playback Manager for reply.audio (24kHz PCM16 base64)
 * Supports immediate interruption / flush on safety alerts or user barge-in without sleep-scheduling.
 */

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private scheduledSources: AudioBufferSourceNode[] = [];
  private nextStartTime: number = 0;

  constructor(private sampleRate: number = 24000) {}

  public async init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      try {
        this.audioCtx = new AudioCtxClass({ sampleRate: this.sampleRate });
      } catch {
        // Some phone browsers reject a fixed rate; buffers are resampled automatically.
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  /**
   * Enqueue a PCM16 base64 chunk from reply.audio and schedule it to play
   * back-to-back with whatever's already queued, on a single continuous
   * timeline. This avoids the clicks/gaps you get from waiting for each
   * clip's onended event before starting the next one.
   */
  public enqueueChunk(base64Audio: string) {
    if (!this.audioCtx) return;
    try {
      const binaryStr = atob(base64Audio);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
      }

      const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, this.sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      // Small lead-in on the very first chunk of a turn so scheduling has
      // room to work with; after that, chunks are back-to-back with no gap.
      const startAt = Math.max(this.nextStartTime, now + 0.05);
      source.start(startAt);
      this.nextStartTime = startAt + audioBuffer.duration;

      this.scheduledSources.push(source);
      source.onended = () => {
        this.scheduledSources = this.scheduledSources.filter(s => s !== source);
      };
    } catch (e) {
      console.error('Failed to decode reply.audio PCM16 base64', e);
    }
  }

  /**
   * Immediate interruption: stop everything scheduled (not just the
   * currently-playing clip) and reset the playback timeline.
   */
  public stopAndClear() {
    for (const source of this.scheduledSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might have already ended
      }
    }
    this.scheduledSources = [];
    this.nextStartTime = this.audioCtx?.currentTime ?? 0;
  }
}