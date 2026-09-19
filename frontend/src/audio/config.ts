/**
 * AUD-005: Turn detection configuration constants for AssemblyAI Voice Agent.
 * Tuned for frequent interruptions / worker barge-in in noisy field environments.
 */

export const TURN_DETECTION_CONFIG = {
  /** Voice Activity Detection threshold (0.0 to 1.0). Lower = more sensitive to speech */
  vad_threshold: 0.5,
  /** Milliseconds delay before triggering barge-in interruption on agent playback */
  interruption_delay: 200,
  /** Milliseconds of silence before considering worker's turn completed */
  silence_duration_ms: 500,
  /** Milliseconds of pre-speech audio padding to keep in capture buffer */
  prefix_padding_ms: 300,
  /** Target sample rate for AssemblyAI Voice Agent (24 kHz) */
  sample_rate: 24000,
} as const;
