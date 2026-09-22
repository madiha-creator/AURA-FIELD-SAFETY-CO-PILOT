import React from 'react';
import { Radio, Mic, Headphones, Wifi, HardDrive, Battery, ShieldCheck } from 'lucide-react';
import { VoiceSessionState } from '../../types/voiceSession';

interface StatusViewProps {
  session: VoiceSessionState;
}

export const StatusView: React.FC<StatusViewProps> = ({ session }) => {
  const isOnline = session.isConnected;

  const statusCards = [
    {
      icon: Mic,
      label: 'AUDIO INPUT (MICROPHONE)',
      statusText: session.isMicMuted ? 'Muted' : 'Active (24 kHz PCM16)',
      detail: 'Built-in noise suppression & VAD active',
      isOk: !session.isMicMuted && session.state !== 'microphone_error'
    },
    {
      icon: Headphones,
      label: 'HEADSET & PTT INTERFACE',
      statusText: session.hasHeadset ? 'Industrial Headset Connected' : 'No Headset Detected',
      detail: session.isPttActive ? 'Hardware Push-to-Talk (PTT) Enabled' : 'Voice Activity Only',
      isOk: session.hasHeadset
    },
    {
      icon: Wifi,
      label: 'NETWORK & WEBSOCKET SYNC',
      statusText: isOnline ? 'Connected (Low Latency)' : 'Offline Local Mode Active',
      detail: isOnline ? 'Direct link to Site 03 Dispatch Server' : 'All voice sentinels & local stores operating',
      isOk: isOnline
    },
    {
      icon: HardDrive,
      label: 'OFFLINE LOCAL STORAGE',
      statusText: 'Synchronized & Ready',
      detail: 'Local draft caching & SHA-256 idempotency store active',
      isOk: true
    },
    {
      icon: Battery,
      label: 'BATTERY & POWER',
      statusText: `${session.batteryLevel}% Optimal`,
      detail: 'Estimated ~8.5 hours continuous field operation',
      isOk: session.batteryLevel > 20
    }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: 'var(--aura-teal)',
            textTransform: 'uppercase'
          }}
        >
          HARDWARE & TELEMETRY
        </span>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            lineHeight: 1.25,
            marginTop: '2px'
          }}
        >
          Instrument Status
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--ink-500)', marginTop: '4px' }}>
          Diagnostic verification in plain frontline worker terminology.
        </p>
      </div>

      {/* Primary Session Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--outline-variant)',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <ShieldCheck size={28} color="var(--aura-teal)" />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--aura-teal-dark)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ACTIVE FIELD SESSION
          </div>
          <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink-950)', marginTop: '2px' }}>
            {session.siteContext.siteName} · {session.siteContext.bay}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink-700)', marginTop: '2px' }}>
            Worker ID: W-4882 · Local Time: {session.siteContext.timeString}
          </div>
        </div>
      </div>

      {/* Status Item Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {statusCards.map((sc, idx) => {
          const Icon = sc.icon;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--border-subtle)',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: sc.isOk ? 'var(--bg-secondary-surface)' : 'var(--warning-amber-bg)',
                  color: sc.isOk ? 'var(--aura-teal)' : 'var(--warning-amber-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={22} strokeWidth={2.4} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--ink-500)', textTransform: 'uppercase' }}>
                  {sc.label}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-950)', marginTop: '2px' }}>
                  {sc.statusText}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-500)', marginTop: '2px' }}>
                  {sc.detail}
                </div>
              </div>

              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: sc.isOk ? 'var(--success-green)' : 'var(--warning-amber)',
                  display: 'inline-block',
                  flexShrink: 0
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
