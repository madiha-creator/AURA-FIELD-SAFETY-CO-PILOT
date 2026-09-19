import React, { useState, useEffect, useRef } from 'react';
import { AudioManager } from '../audio/audioManager';
import { arrayBufferToBase64, pcmWorkerCode } from '../audio/pcmWorker';
import { TURN_DETECTION_CONFIG } from '../audio/config';
import { AlertTriangle, Mic, MicOff, Send, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';

interface TranscriptItem {
  id: string;
  sender: 'worker' | 'aura' | 'system';
  text: string;
  timestamp: string;
}

interface SafetyAlert {
  parameter: string;
  measured_value: number;
  unit: string;
  severity: 'warn' | 'critical' | 'ok';
  message: string;
  expected_range?: { min: number; max: number };
}

interface ReportFields {
  location: string;
  equipment: string;
  hazard_type: string;
  injury: string;
  narrative: string;
}

export default function Worker() {
  const [sessionMode, setSessionMode] = useState<'field_ops' | 'reporting'>('field_ops');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: 'init',
      sender: 'aura',
      text: 'Aura here. Ready for field procedure or near-miss reporting.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [safetyAlert, setSafetyAlert] = useState<SafetyAlert | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepText, setStepText] = useState<string>(
    'Step 1: Inspect secondary coolant reservoir line connections for leaks or physical damage.'
  );

  const [reportFields, setReportFields] = useState<ReportFields>({
    location: '',
    equipment: '',
    hazard_type: '',
    injury: '',
    narrative: ''
  });

  const [textInput, setTextInput] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioManagerRef.current = new AudioManager(TURN_DETECTION_CONFIG.sample_rate);
    return () => {
      disconnectSession();
    };
  }, []);

  const startSession = async () => {
    try {
      const tokenRes = await fetch('http://127.0.0.1:5000/v1/token', {
        headers: {
          'Authorization': 'Bearer dev-token-bypass'
        }
      });
      const tokenData = await tokenRes.json();
      const wsUrl = tokenData.ws_url || `ws://127.0.0.1:5000/v1/ws?token=${tokenData.token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addTranscript('system', 'Connected to Aura Voice Session');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'reply.audio') {
            audioManagerRef.current?.enqueueChunk(msg.audio);
          } else if (msg.type === 'agent_reply') {
            addTranscript('aura', msg.text);
            if (msg.mode) {
              setSessionMode(msg.mode);
            }
            if (msg.current_step) {
              setCurrentStep(msg.current_step);
              setStepText(msg.text);
            }
          } else if (msg.type === 'safety_alert') {
            // Blocking safety banner & audio flush
            audioManagerRef.current?.stopAndClear();
            setSafetyAlert(msg.alert);
            addTranscript('system', `SAFETY INTERRUPT: ${msg.message}`);
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsMicActive(false);
        addTranscript('system', 'Session disconnected.');
      };

    } catch (err) {
      console.error('Start session error:', err);
      addTranscript('system', 'Failed to connect to backend token route.');
    }
  };

  const disconnectSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    audioManagerRef.current?.stopAndClear();
    setIsConnected(false);
    setIsMicActive(false);
  };

  const toggleMic = async () => {
    if (!isMicActive) {
      try {
        await audioManagerRef.current?.init();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 24000 } });
        setIsMicActive(true);
        addTranscript('system', 'Microphone active (24kHz PCM16 stream)');
      } catch (e) {
        console.error('Mic access error', e);
        addTranscript('system', 'Microphone access denied.');
      }
    } else {
      setIsMicActive(false);
      addTranscript('system', 'Microphone muted.');
    }
  };

  const sendUserTurn = (text: string) => {
    if (!text.trim()) return;

    // User barge-in stops audio playback immediately
    audioManagerRef.current?.stopAndClear();

    addTranscript('worker', text);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_turn',
        text: text
      }));
    } else {
      // Local fallback parsing for demo if WS not ready
      handleLocalFallbackTurn(text);
    }
    setTextInput('');
  };

  const handleLocalFallbackTurn = (text: string) => {
    const lower = text.toLowerCase();

    // Check for safety numbers
    const numMatch = lower.match(/[-+]?\d*\.\d+|\d+/);
    if (numMatch && (lower.includes('psi') || lower.includes('pressure') || lower.includes('temp'))) {
      const val = parseFloat(numMatch[0]);
      if (val > 10.0 || val < 4.0) {
        setSafetyAlert({
          parameter: lower.includes('psi') ? 'coolant pressure' : 'temperature',
          measured_value: val,
          unit: lower.includes('psi') ? 'PSI' : 'F',
          severity: 'critical',
          message: `WARNING: Spoken value ${val} is outside safe range (4.0 - 10.0 PSI)!`,
          expected_range: { min: 4.0, max: 10.0 }
        });
        addTranscript('aura', `WARNING: ${val} PSI exceeds threshold limits! Isolate system immediately.`);
        return;
      }
    }

    if (lower.includes('report') || lower.includes('near miss')) {
      setSessionMode('reporting');
      addTranscript('aura', 'Switching to Near-Miss Reporting. What location and equipment were involved?');
    } else if (lower.includes('next') || lower.includes('step') || lower.includes('confirm')) {
      setSessionMode('field_ops');
      const nextS = currentStep + 1;
      setCurrentStep(nextS);
      const nextText = `Step ${nextS}: Attach drain hose to low-point purge valve and open valve slowly.`;
      setStepText(nextText);
      addTranscript('aura', nextText);
    } else {
      addTranscript('aura', `Acknowledged: "${text}". Standing by.`);
    }
  };

  const addTranscript = (sender: 'worker' | 'aura' | 'system', text: string) => {
    setTranscripts(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender,
        text,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: '#f8fafc', padding: '16px' }}>

      {/* Session Header / Mode Indicator (FE-001) */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#38bdf8' }}>
              Aura Field Worker Voice Spine
            </h2>
            <span style={{
              backgroundColor: sessionMode === 'field_ops' ? '#0369a1' : '#b45309',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '9999px',
              textTransform: 'uppercase'
            }}>
              {sessionMode === 'field_ops' ? 'Guided Field Ops Mode' : 'Near-Miss Reporting Mode'}
            </span>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
            Hands-free voice agent. Speak or type to guide procedure or file reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {!isConnected ? (
            <button
              onClick={startSession}
              style={{
                backgroundColor: '#0284c7',
                color: '#fff',
                fontWeight: 600,
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Start Session
            </button>
          ) : (
            <button
              onClick={disconnectSession}
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                fontWeight: 600,
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Blocking Safety-Alert Banner (FE-002) */}
      {safetyAlert && (
        <div style={{
          backgroundColor: '#7f1d1d',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <ShieldAlert size={32} color="#f87171" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: '#fecaca', fontSize: '1.2rem', fontWeight: 700 }}>
                CRITICAL SAFETY SENTINEL TRIGGERED
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#fca5a5', fontWeight: 600 }}>
                {safetyAlert.message}
              </p>

              {safetyAlert.expected_range && (
                <div style={{ fontSize: '0.875rem', color: '#f8fafc' }}>
                  Measured: <strong>{safetyAlert.measured_value} {safetyAlert.unit}</strong> |
                  Safe Range: <strong>{safetyAlert.expected_range.min} - {safetyAlert.expected_range.max} {safetyAlert.unit}</strong>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setSafetyAlert(null)}
            style={{
              backgroundColor: '#991b1b',
              color: '#fee2e2',
              border: '1px solid #f87171',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Acknowledge & Clear
          </button>
        </div>
      )}

      {/* Dynamic View Panel (FE-001) */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155',
        marginBottom: '20px'
      }}>
        {sessionMode === 'field_ops' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38bdf8' }}>
                CURRENT PROCEDURE STEP #{currentStep}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Procedure: proc_coolant_flush</span>
            </div>
            <div style={{
              backgroundColor: '#0f172a',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '1.1rem',
              lineHeight: '1.5',
              borderLeft: '4px solid #0284c7'
            }}>
              {stepText}
            </div>
          </div>
        ) : (
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#f59e0b', fontSize: '1.1rem' }}>
              Near-Miss Report Fields
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>LOCATION</label>
                <input
                  type="text"
                  value={reportFields.location}
                  onChange={(e) => setReportFields({ ...reportFields, location: e.target.value })}
                  placeholder="e.g. Bay 2 Coolant Line"
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>EQUIPMENT</label>
                <input
                  type="text"
                  value={reportFields.equipment}
                  onChange={(e) => setReportFields({ ...reportFields, equipment: e.target.value })}
                  placeholder="e.g. Valve V-101"
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>HAZARD TYPE</label>
                <input
                  type="text"
                  value={reportFields.hazard_type}
                  onChange={(e) => setReportFields({ ...reportFields, hazard_type: e.target.value })}
                  placeholder="e.g. Pressurized Spray"
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>INJURY</label>
                <input
                  type="text"
                  value={reportFields.injury}
                  onChange={(e) => setReportFields({ ...reportFields, injury: e.target.value })}
                  placeholder="e.g. None (Near Miss)"
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Transcript Stream (FE-002) */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#cbd5e1' }}>Live Session Transcript</h3>
        <div style={{
          backgroundColor: '#0f172a',
          height: '240px',
          overflowY: 'auto',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {transcripts.map((t) => (
            <div
              key={t.id}
              style={{
                alignSelf: t.sender === 'worker' ? 'flex-end' : t.sender === 'aura' ? 'flex-start' : 'center',
                backgroundColor: t.sender === 'worker' ? '#0369a1' : t.sender === 'aura' ? '#334155' : '#1e293b',
                color: t.sender === 'system' ? '#94a3b8' : '#f8fafc',
                padding: '8px 14px',
                borderRadius: '8px',
                maxWidth: '80%',
                fontSize: '0.9rem'
              }}
            >
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>
                {t.sender.toUpperCase()} • {t.timestamp}
              </div>
              <div>{t.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Controls: Mic Capture + Keyboard Fallback (FE-003) */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #334155',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <button
          onClick={toggleMic}
          style={{
            backgroundColor: isMicActive ? '#ef4444' : '#334155',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title={isMicActive ? 'Mute Mic' : 'Activate Mic (24kHz)'}
        >
          {isMicActive ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendUserTurn(textInput)}
          placeholder="Speak or type (e.g. 'pressure is 15 PSI' or 'report a near miss')..."
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem'
          }}
        />

        <button
          onClick={() => sendUserTurn(textInput)}
          style={{
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Send size={18} /> Send
        </button>
      </div>

    </div>
  );
}
