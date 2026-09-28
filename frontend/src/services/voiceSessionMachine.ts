import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioManager } from '../audio/audioManager';
import { TURN_DETECTION_CONFIG } from '../audio/config';
import { pcmWorkerCode, arrayBufferToBase64 } from '../audio/pcmWorker';
import {
  VoiceState,
  SemanticVariant,
  VoiceSessionState,
  VoiceSessionEvents,
  TranscriptEntry
} from '../types/voiceSession';
import { SafetyAlertData } from '../types/workerWorkflows';

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
  const [sessionId, setSessionId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('aura_voice_session_id');
      if (saved) return saved;
    } catch {}
    const sid = 'session_' + Math.random().toString(36).substring(2, 10);
    try {
      sessionStorage.setItem('aura_voice_session_id', sid);
    } catch {}
    return sid;
  });
  const [activeSafetyAlert, setActiveSafetyAlert] = useState<SafetyAlertData | null>(null);
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
  const activeSafetyAlertRef = useRef<SafetyAlertData | null>(null);
  const isDangerLockedRef = useRef<boolean>(false);

  // AUD-003: Live microphone capture graph (input.audio streaming to backend)
  const captureCtxRef = useRef<AudioContext | null>(null);
  const captureWorkletRef = useRef<AudioWorkletNode | null>(null);
  const captureSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const captureSilenceGainRef = useRef<GainNode | null>(null);
  const captureTeardownTimerRef = useRef<number | null>(null);
  const isCapturingRef = useRef<boolean>(false);

  // Tear down the mic-capture audio graph (stop streaming input.audio to backend)
  const teardownCapture = useCallback(() => {
    isCapturingRef.current = false;
    if (captureTeardownTimerRef.current) {
      window.clearTimeout(captureTeardownTimerRef.current);
      captureTeardownTimerRef.current = null;
    }
    try { captureWorkletRef.current?.port.close(); } catch {}
    try { captureWorkletRef.current?.disconnect(); } catch {}
    try { captureSourceRef.current?.disconnect(); } catch {}
    try { captureSilenceGainRef.current?.disconnect(); } catch {}
    captureWorkletRef.current = null;
    captureSourceRef.current = null;
    captureSilenceGainRef.current = null;
    if (captureCtxRef.current) {
      try { captureCtxRef.current.close(); } catch {}
      captureCtxRef.current = null;
    }
  }, []);

  // Set up the mic-capture audio graph and begin streaming input.audio frames to the backend
  const setupCapture = useCallback(async (stream: MediaStream) => {
    teardownCapture();

    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtxClass({ sampleRate: TURN_DETECTION_CONFIG.sample_rate });
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const blob = new Blob([pcmWorkerCode], { type: 'application/javascript' });
    const moduleUrl = URL.createObjectURL(blob);
    try {
      await ctx.audioWorklet.addModule(moduleUrl);
    } finally {
      URL.revokeObjectURL(moduleUrl);
    }

    const source = ctx.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(ctx, 'pcm-processor');

    // Route through a silent gain node to the destination: some browsers only
    // pull audio worklet processing when the graph reaches the destination.
    const silenceGain = ctx.createGain();
    silenceGain.gain.value = 0;

    worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (!isCapturingRef.current) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const base64 = arrayBufferToBase64(event.data);
      wsRef.current.send(JSON.stringify({ type: 'input.audio', audio: base64 }));
    };

    source.connect(worklet);
    worklet.connect(silenceGain);
    silenceGain.connect(ctx.destination);

    captureCtxRef.current = ctx;
    captureSourceRef.current = source;
    captureWorkletRef.current = worklet;
    captureSilenceGainRef.current = silenceGain;
    isCapturingRef.current = true;
  }, [teardownCapture]);

  // Initialize AudioManager on mount
  useEffect(() => {
    audioManagerRef.current = new AudioManager(TURN_DETECTION_CONFIG.sample_rate);
    return () => {
      teardownCapture();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const baseWs = tokenData.ws_url || `ws://127.0.0.1:5000/v1/ws?token=${tokenData.token}`;
      const wsUrl = baseWs.includes('session_id=')
        ? baseWs
        : `${baseWs}${baseWs.includes('?') ? '&' : '?'}session_id=${encodeURIComponent(sessionId)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setVoiceState('ready');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'session.ready') {
            setIsConnected(true);
            setVoiceState('ready');
            if (msg.session_id) {
              setSessionId(msg.session_id);
              try { sessionStorage.setItem('aura_voice_session_id', msg.session_id); } catch {}
            }
          } else if (msg.type === 'reply.audio') {
            if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
            setLastAuraAudioChunk(msg.audio);
            audioManagerRef.current?.enqueueChunk(msg.audio);
            setVoiceState('speaking');
          } else if (msg.type === 'agent_reply') {
            if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
            addTranscript('aura', msg.text);
            setLastAuraResponse(msg.text);

            // If an active safety alert is currently commanding the interface,
            // do NOT let a trailing normal agent_reply dismiss the safety alert or danger variant!
            if (activeSafetyAlertRef.current !== null || isDangerLockedRef.current) {
              setSemanticVariant('danger');
              audioManagerRef.current?.stopAndClear();
              return;
            }

            setCurrentCaption(msg.text);
            if (msg.safe_to_report === false) {
              setSemanticVariant('danger');
            }
            // FE-003: Only transition to speaking if audio payload exists; text-only replies transition to ready
            if (msg.audio) {
              setLastAuraAudioChunk(msg.audio);
              audioManagerRef.current?.enqueueChunk(msg.audio);
              setVoiceState('speaking');
              if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
              speakingTimerRef.current = window.setTimeout(() => {
                if (activeSafetyAlertRef.current === null && !isDangerLockedRef.current) {
                  setVoiceState('ready');
                }
              }, 4500);
            } else {
              setLastAuraAudioChunk(undefined);
              if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
              setVoiceState('ready');
            }
          } else if (msg.type === 'safety_alert') {
            audioManagerRef.current?.stopAndClear();
            if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
            if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
            setSemanticVariant('danger');
            setVoiceState('interrupted');
            isDangerLockedRef.current = true;
            const alertMsg = msg.message || (msg.alert && msg.alert.message) || 'Safety threshold boundary exceeded!';
            setCurrentCaption(`SAFETY ALERT: ${alertMsg}`);
            addTranscript('system', `CRITICAL SAFETY INTERRUPT: ${alertMsg}`);

            const rawAlert = msg.alert || {};
            const alertData: SafetyAlertData = {
              title: rawAlert.severity === 'critical' ? 'CRITICAL SENTINEL TRIP' : 'SAFETY THRESHOLD WARNING',
              parameter: rawAlert.parameter || 'pressure',
              measuredValue: typeof rawAlert.measured_value === 'number' ? rawAlert.measured_value : 0,
              unit: rawAlert.unit || 'PSI',
              expectedRange: rawAlert.expected_range || { min: 4.0, max: 10.0 },
              deviationPct: typeof rawAlert.deviation_pct === 'number' ? rawAlert.deviation_pct : 0,
              severity: rawAlert.severity === 'critical' ? 'critical' : 'warn',
              message: alertMsg,
              prescribedAction: rawAlert.severity === 'critical'
                ? '1. Cease current operation immediately.\n2. Isolate equipment and verify physical hazard clearance.\n3. Do not proceed until verified safe.\n4. Acknowledge and report to shift supervisor.'
                : '1. Verify operating parameters before continuing.\n2. Check equipment connections and calibrate sensors.',
              sourceContext: 'general'
            };
            activeSafetyAlertRef.current = alertData;
            setActiveSafetyAlert(alertData);
          } else if (msg.type === 'transcript.user.delta') {
            // Live partial transcript while the worker is still speaking
            setPartialUserText(msg.text || '');
          } else if (msg.type === 'transcript.user') {
            // Finalized transcript of the worker's turn
            setPartialUserText('');
            if (msg.text) {
              addTranscript('worker', msg.text);
            }
            setVoiceState('processing');
            setCurrentCaption('UNDERSTANDING...');
            // Safety net: never hang on "understanding" if no reply arrives
            if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
            processingTimerRef.current = window.setTimeout(() => {
              setVoiceState(prev => (prev === 'processing' ? 'ready' : prev));
              setCurrentCaption('No response received. Tap the orb to try again.');
            }, 20000);
          } else if (msg.type === 'voice_unavailable') {
            // Backend has no ASSEMBLYAI_API_KEY configured; mic input can't be transcribed
            teardownCapture();
            setVoiceState('ready');
            setCurrentCaption(msg.message || 'Voice transcription unavailable. Try typing instead.');
            addTranscript('system', msg.message || 'Voice transcription is not configured on this server. Use text input instead.');
          } else if (msg.type === 'session.error') {
            addTranscript('system', `Voice session error: ${msg.message || 'unknown error'}`);
            setErrorDetail(msg.message);
            setVoiceState('ready');
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
  }, [addTranscript, sessionId, teardownCapture]);

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
      await setupCapture(mediaStreamRef.current);
      setVoiceState('listening');
      setPartialUserText('');
      setCurrentCaption('Listening to your voice...');
      setErrorDetail(undefined);
    } catch (e: any) {
      setVoiceState('microphone_error');
      setErrorDetail(e?.message || 'Microphone access denied or hardware unavailable.');
      setCurrentCaption('Microphone permission required. Tap to retry.');
    }
  }, [setupCapture]);

  // Stop listening / finalize turn
  const stopListening = useCallback(() => {
    if (voiceState === 'listening') {
      setVoiceState('processing');
      setCurrentCaption('UNDERSTANDING...');

      // Keep streaming briefly so the server VAD can observe trailing silence
      // and finalize the transcript, then tear the capture graph down.
      if (captureTeardownTimerRef.current) window.clearTimeout(captureTeardownTimerRef.current);
      captureTeardownTimerRef.current = window.setTimeout(() => {
        teardownCapture();
      }, TURN_DETECTION_CONFIG.silence_duration_ms + 400);
    }
  }, [voiceState, teardownCapture]);

  // Interrupt agent immediately (Barge-in rule)
  const interruptAgent = useCallback(() => {
    audioManagerRef.current?.stopAndClear();
    teardownCapture();
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
    if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);

    setVoiceState('interrupted');
    addTranscript('system', 'Agent audio interrupted by worker.');

    if (activeSafetyAlertRef.current !== null || isDangerLockedRef.current) {
      setSemanticVariant('danger');
      return;
    }

    setCurrentCaption('PAUSED — YOUR TURN');

    // Transition back to ready after short acknowledgement only if not in danger
    speakingTimerRef.current = window.setTimeout(() => {
      if (activeSafetyAlertRef.current === null && !isDangerLockedRef.current) {
        setVoiceState('ready');
        setCurrentCaption('Ready when you are.');
      }
    }, 1500);
  }, [addTranscript, teardownCapture]);

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
      if (activeSafetyAlertRef.current !== null || isDangerLockedRef.current) {
        setVoiceState('interrupted');
        setSemanticVariant('danger');
      } else {
        setVoiceState('ready');
        setCurrentCaption('Ready when you are.');
      }
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

          const rawNumbers = text.match(/[-+]?\d*\.?\d+/g);
          const parsedVal = rawNumbers ? parseFloat(rawNumbers[0]) : 15;
          const min = 4.0;
          const max = 10.0;
          const span = max - min;
          const deviation = parsedVal > max ? ((parsedVal - max) / span) * 100 : ((min - parsedVal) / span) * 100;
          const alertData: SafetyAlertData = {
            title: 'CRITICAL SENTINEL TRIP',
            parameter: 'coolant line pressure',
            measuredValue: parsedVal,
            unit: 'PSI',
            expectedRange: { min, max },
            deviationPct: Math.round(deviation * 10) / 10,
            severity: 'critical',
            message: `Measured ${parsedVal} PSI exceeds safe operating range (${min} – ${max} PSI) by +${Math.round(deviation)}%.`,
            prescribedAction: '1. Cease current operation immediately.\n2. Close isolation valve SV-2.\n3. Do not attempt adjustment until pressure relieves.\n4. Notify shift safety supervisor.',
            sourceContext: 'general'
          };
          activeSafetyAlertRef.current = alertData;
          isDangerLockedRef.current = true;
          setActiveSafetyAlert(alertData);
        } else if (lower.includes('confirm') || lower.includes('safe') || lower.includes('done') || lower.includes('clear')) {
          reply = 'Parameters verified within safe operating range. Check complete.';
          variant = 'success';
        }

        setSemanticVariant(variant);
        setLastAuraResponse(reply);
        setCurrentCaption(reply);
        addTranscript('aura', reply);

        if (variant === 'danger') {
          // Safety alert state: initial announcement displays warning, then settles into locked interrupted danger state.
          // Danger variant, alert data, and warning caption remain active until the worker explicitly acknowledges/dismisses it!
          if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
          setVoiceState('interrupted');
        } else {
          // FE-003: Text turn fallback generates no audio; transition to ready directly
          if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
          setVoiceState('ready');
        }
      }, 700);
    }
  }, [addTranscript]);

  const toggleMicMute = useCallback(() => {
    setIsMicMuted(prev => !prev);
  }, []);

  const dismissSafetyAlert = useCallback(() => {
    activeSafetyAlertRef.current = null;
    isDangerLockedRef.current = false;
    setActiveSafetyAlert(null);
    setSemanticVariant('normal');
    setVoiceState('ready');
    setCurrentCaption('Ready when you are.');
    addTranscript('system', 'Worker acknowledged safety alert (local clearance).');
  }, [addTranscript]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
    }
    setVoiceState('reconnecting');
    setCurrentCaption('Reconnecting to Aura Co-Pilot session...');
    connectWebSocket();
  }, [connectWebSocket]);

  const resetSession = useCallback(() => {
    audioManagerRef.current?.stopAndClear();
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
    if (processingTimerRef.current) window.clearTimeout(processingTimerRef.current);
    activeSafetyAlertRef.current = null;
    isDangerLockedRef.current = false;
    setActiveSafetyAlert(null);
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
    transcripts,
    sessionId,
    activeSafetyAlert
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
      if (activeSafetyAlertRef.current !== null || isDangerLockedRef.current) {
        setVoiceState('interrupted');
        setSemanticVariant('danger');
        return;
      }
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
    setSemanticVariant,
    dismissSafetyAlert,
    reconnect
  };

  return [state, events];
}