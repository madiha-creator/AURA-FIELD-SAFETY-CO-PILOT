/**
 * Voice & Session State Machine Types for FE-001 Frontline Voice Instrument.
 * Designed to be reusable and extendable by Part B workflows without rebuilding.
 */

export type VoiceState =
  | 'ready'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'interrupted'
  | 'replaying'
  | 'reconnecting'
  | 'offline'
  | 'microphone_error'
  | 'speaker_error'
  | 'session_error';

export type SemanticVariant = 'normal' | 'danger' | 'success';

export interface TranscriptEntry {
  id: string;
  sender: 'worker' | 'aura' | 'system';
  text: string;
  timestamp: string;
  isPartial?: boolean;
}

export interface VoiceSessionState {
  state: VoiceState;
  variant: SemanticVariant;
  isConnected: boolean;
  isMicMuted: boolean;
  hasHeadset: boolean;
  isPttActive: boolean;
  batteryLevel: number;
  siteContext: {
    siteId: string;
    siteName: string;
    bay: string;
    timeString: string;
  };
  currentCaption: string;
  partialUserText?: string;
  lastAuraResponse?: string;
  lastAuraAudioChunk?: string;
  errorDetail?: string;
  transcripts: TranscriptEntry[];
}

export interface VoiceSessionEvents {
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleMicMute: () => void;
  userTurnStarted: () => void;
  userTurnPartial: (text: string) => void;
  userTurnFinalized: (text: string) => void;
  agentStartedProcessing: (label?: string) => void;
  agentStartedSpeaking: (text: string, audioBase64?: string) => void;
  agentStoppedSpeaking: () => void;
  interruptAgent: () => void;
  replayLastResponse: () => void;
  connectionLost: () => void;
  connectionRestored: () => void;
  microphonePermissionDenied: (err?: string) => void;
  audioPlaybackError: (err?: string) => void;
  sessionExpired: () => void;
  resetSession: () => void;
  sendTextTurn: (text: string) => void;
  setSemanticVariant: (variant: SemanticVariant) => void;
}
