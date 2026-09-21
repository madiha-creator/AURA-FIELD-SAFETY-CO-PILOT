import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioManager } from '../audio/audioManager';
import { TURN_DETECTION_CONFIG } from '../audio/config';
import {
  VoiceState,
  SemanticVariant,
  VoiceSessionState,
  VoiceSessionEvents,
  TranscriptEntry
} from '../types/voiceSession';

export function useVoiceSession(): [VoiceSessionState, VoiceSessionEvents] {
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [semanticVariant, setSemanticVariant] = useState<SemanticVariant>('normal');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [currentCaption, setCurrentCaption] = useState<string>('Ready when you are.');
  const [partialUserText, setPartialUserText] = useState<string>('');
  const [lastAuraResponse, setLastAuraResponse] = useState<string>(
    'Aura online. All systems nominal. Standing by for procedure guidance or safety reporting.'
  );
  const [lastAuraAudioChunk, setLastAuraAudioChunk] = useState<string | undefined>(undefined);
  const [errorDetail, setErrorDetail] = useState<string | undefined>(undefined);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([
    {
      id: 'init-aura',
      sender: 'aura',
      text: 'Aura online. All systems nominal. Ready when you are.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const audioManagerRef = useRef<AudioManager | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processingTimerRef = useRef<number | null>(null);
  const speakingTimerRef = useRef<number | null>(null);

  // Initialize AudioManager on mount
  useEffect(() => {
    audioManagerRef.current = new AudioManager(TURN_DETECTION_CONFIG.sample_rate);
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
      if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
      audioManagerRef.current?.stopAndClear();
    };
  }, []);

  const addTranscript = useCallback((sender: 'worker' | 'aura' | 'system', text: string) => {
    const entry: TranscriptEntry = {
      id: Math.random().toString(36).substring(2, 9),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTranscripts(prev => [...prev, entry]);
    return entry;
  }, []);

  // Connect to backend WebSocket / token route
  const connectWebSocket = useCallback(async () => {
    try {
      // Use dev proxy / relative token endpoint or fallback to local
      const tokenUrl = window.location.port === '3000'
        ? 'http://127.0.0.1:5000/v1/token'
        : '/v1/token';

      const res = await fetch(tokenUrl, {
        headers: { 'Authorization': 'Bearer dev-token-bypass' }
      });

      if (!res.ok) throw new Error(`Token fetch failed (${res.status})`);
      const tokenData = await res.json();
      const wsUrl = tokenData.ws_url || `ws://127.0.0.1:5000/v1/ws?token=${tokenData.token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setVoiceState('ready');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'reply.audio') {
            setLastAuraAudioChunk(msg.audio);
            audioManagerRef.current?.enqueueChunk(msg.audio);
            setVoiceState('speaking');
          } else if (msg.type === 'agent_reply') {
            setLastAuraResponse(msg.text);
            setCurrentCaption(msg.text);
            addTranscript('aura', msg.text);
            setVoiceState('speaking');
            if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
            speakingTimerRef.current = window.setTimeout(() => {
              setVoiceState('ready');
              setCurrentCaption('Ready when you are.');
            }, 4500);
          } else if (msg.type === 'safety_alert') {
            audioManagerRef.current?.stopAndClear();
            setSemanticVariant('danger');
            setVoiceState('interrupted');
            const alertMsg = msg.message || 'Safety threshold boundary exceeded!';
            setCurrentCaption(`SAFETY ALERT: ${alertMsg}`);
            addTranscript('system', `CRITICAL SAFETY INTERRUPT: ${alertMsg}`);
          }
        } catch {
          // Ignore non-json frames
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      // Backend is offline or unreachable; fallback to standalone offline mode
      setIsConnected(false);
    }
  }, [addTranscript]);

  // Try initial backend connection once on mount
  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  // Start listening (Tap to speak)
  const startListening = useCallback(async () => {
    // Barge-in: flush any currently playing audio immediately
    audioManagerRef.current?.stopAndClear();
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);

    try {
      await audioManagerRef.current?.init();
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { sampleRate: 24000, echoCancellation: true, noiseSuppression: true }
        });
      }
      setVoiceState('listening');
      setPartialUserText('');
      setCurrentCaption('Listening to your voice...');
      setErrorDetail(undefined);
    } catch (e: any) {
      setVoiceState('microphone_error');
      setErrorDetail(e?.message || 'Microphone access denied or hardware unavailable.');
      setCurrentCaption('Microphone permission required. Tap to retry.');
    }
  }, []);

  // Stop listening / finalize turn
  const stopListening = useCallback(() => {
    if (voiceState === 'listening') {
      setVoiceState('processing');
      setCurrentCaption('UNDERSTANDING...');
    }
  }, [voiceState]);

  // Interrupt agent immediately (Barge-in rule)
  const interruptAgent = useCallback(() => {
    audioManagerRef.current?.stopAndClear();
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
    if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);

    setVoiceState('interrupted');
    setCurrentCaption('PAUSED — YOUR TURN');
    addTranscript('system', 'Agent audio interrupted by worker.');

    // Transition back to ready after short acknowledgement
    speakingTimerRef.current = window.setTimeout(() => {
      setVoiceState('ready');
      setCurrentCaption('Ready when you are.');
    }, 1500);
  }, [addTranscript]);

  // Replay last response
  const replayLastResponse = useCallback(() => {
    if (!lastAuraResponse) return;

    // Flush current audio to prevent overlapping
    audioManagerRef.current?.stopAndClear();
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);

    setVoiceState('replaying');
    setCurrentCaption(`REPLAY: "${lastAuraResponse}"`);

    if (lastAuraAudioChunk) {
      audioManagerRef.current?.enqueueChunk(lastAuraAudioChunk);
    }

    // Set duration timer for replay completion
    const duration = Math.min(8000, Math.max(3000, lastAuraResponse.length * 65));
    speakingTimerRef.current = window.setTimeout(() => {
      setVoiceState('ready');
      setCurrentCaption('Ready when you are.');
    }, duration);
  }, [lastAuraResponse, lastAuraAudioChunk]);

  // Send a user turn (spoken or typed fallback)
  const sendTextTurn = useCallback((text: string) => {
    if (!text.trim()) return;

    // Barge-in stops audio immediately
    audioManagerRef.current?.stopAndClear();
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);

    addTranscript('worker', text);
    setVoiceState('processing');
    setCurrentCaption('UNDERSTANDING...');

    // If WebSocket is live, send over WS
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_turn',
        text: text.trim()
      }));
    } else {
      // Deterministic fallback response for Part A demonstration
      if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
      processingTimerRef.current = window.setTimeout(() => {
        const lower = text.toLowerCase();
        let reply = `Acknowledged: "${text}". AURA is standing by.`;
        let variant: SemanticVariant = 'normal';

        if (lower.includes('check') || lower.includes('procedure') || lower.includes('walk me')) {
          reply = 'Starting guided inspection check. Step 1: Inspect secondary coolant line connections for physical leakage or pressure drop.';
          variant = 'normal';
        } else if (lower.includes('hazard') || lower.includes('near miss') || lower.includes('report')) {
          reply = 'Opening near-miss report intake. What location and equipment are involved?';
          variant = 'normal';
        } else if (lower.includes('psi') || lower.includes('pressure') || lower.includes('danger') || lower.includes('alert')) {
          reply = 'WARNING: Measured pressure is outside approved parameters (4.0 - 10.0 PSI). Isolate line immediately.';
          variant = 'danger';
        } else if (lower.includes('confirm') || lower.includes('safe') || lower.includes('done') || lower.includes('clear')) {
          reply = 'Parameters verified within safe operating range. Check complete.';
          variant = 'success';
        }

        setSemanticVariant(variant);
        setLastAuraResponse(reply);
        setCurrentCaption(reply);
        addTranscript('aura', reply);
        setVoiceState('speaking');

        speakingTimerRef.current = window.setTimeout(() => {
          setVoiceState('ready');
          setCurrentCaption('Ready when you are.');
          setSemanticVariant('normal');
        }, 4000);
      }, 700);
    }
  }, [addTranscript]);

  const toggleMicMute = useCallback(() => {
    setIsMicMuted(prev => !prev);
  }, []);

  const resetSession = useCallback(() => {
    audioManagerRef.current?.stopAndClear();
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
    if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
    setVoiceState('ready');
    setSemanticVariant('normal');
    setCurrentCaption('Ready when you are.');
    setErrorDetail(undefined);
  }, []);

  const state: VoiceSessionState = {
    state: voiceState,
    variant: semanticVariant,
    isConnected,
    isMicMuted,
    hasHeadset: true,
    isPttActive: true,
    batteryLevel: 98,
    siteContext: {
      siteId: '03',
      siteName: 'WAREHOUSE 03',
      bay: 'BAY 7',
      timeString: '09:41'
    },
    currentCaption,
    partialUserText,
    lastAuraResponse,
    lastAuraAudioChunk,
    errorDetail,
    transcripts
  };

  const events: VoiceSessionEvents = {
    startListening,
    stopListening,
    toggleMicMute,
    userTurnStarted: () => setVoiceState('listening'),
    userTurnPartial: (txt) => setPartialUserText(txt),
    userTurnFinalized: sendTextTurn,
    agentStartedProcessing: (lbl) => {
      setVoiceState('processing');
      if (lbl) setCurrentCaption(lbl);
    },
    agentStartedSpeaking: (txt, audio) => {
      setVoiceState('speaking');
      setCurrentCaption(txt);
      if (audio) {
        audioManagerRef.current?.enqueueChunk(audio);
      }
    },
    agentStoppedSpeaking: () => {
      setVoiceState('ready');
      setCurrentCaption('Ready when you are.');
    },
    interruptAgent,
    replayLastResponse,
    connectionLost: () => {
      setIsConnected(false);
      setVoiceState('offline');
      setCurrentCaption('Connection lost. Operating in offline cache mode.');
    },
    connectionRestored: () => {
      setIsConnected(true);
      setVoiceState('ready');
      setCurrentCaption('Ready when you are.');
    },
    microphonePermissionDenied: (err) => {
      setVoiceState('microphone_error');
      setErrorDetail(err || 'Microphone permission denied.');
    },
    audioPlaybackError: (err) => {
      setVoiceState('speaker_error');
      setErrorDetail(err || 'Audio playback error.');
    },
    sessionExpired: () => {
      setVoiceState('session_error');
      setCurrentCaption('Session expired. Tap to reconnect.');
    },
    resetSession,
    sendTextTurn,
    setSemanticVariant
  };

  return [state, events];
}
